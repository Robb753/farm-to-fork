import { URL } from 'node:url';
import console from 'node:console';
import process from 'node:process';
import { PGlite } from '@electric-sql/pglite';
import { unaccent } from '@electric-sql/pglite/contrib/unaccent';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const read = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const root = 'supabase/tests/producer-approval/';
for (const [file, hash] of Object.entries({ 'baseline.sql': '8426e7b08dcbf22dad16d72d33c1915d3d3199f45e2284980b48e945e3c16b5a', 'permissions.sql': '7829e8524571761f86531665e059566f0acba5eae189653095374c2f359dbe5f' })) {
  assert.equal(createHash('sha256').update(read(root + file)).digest('hex'), hash);
}
const db = new PGlite({ extensions: { unaccent } });
const scalar = async sql => Object.values((await db.query(sql)).rows[0])[0];
async function scenario(name, body, expected) {
  await db.exec('BEGIN');
  let error;
  try { await body(); } catch (e) { error = e; }
  await db.exec('ROLLBACK');
  console.log(`${name}: ${error ? 'FAIL invariant: ' + error.message : 'PASS'}`);
  assert.equal(!error, expected, `${name}: unexpected regression result`);
}
async function matrix(fixed) {
  for (const [name, existing, claim, owned] of [['A create new',false,false,false],['B create existing',true,false,false],['C claim',false,true,false],['C2 claim existing profile',true,true,false],['E occupied claim',false,true,true]]) {
    await scenario(name, async () => {
      await db.exec(`INSERT INTO listing(id,slug,name,clerk_user_id) VALUES (900001,'fixture','Fixture',${owned ? "'other'" : 'NULL'});
        ${existing ? "INSERT INTO profiles(user_id,email,role) VALUES ('applicant','a@example.invalid','user');" : ''}
        INSERT INTO producer_requests(type,user_id,user_email,farm_name,listing_id) VALUES ('${claim?'claim':'create'}','applicant','a@example.invalid','Fixture',${claim?'900001':'NULL'});
        SET LOCAL ROLE service_role; SELECT set_config('request.jwt.claims','{"role":"service_role"}',true);`);
      let rejected = false;
      try { await db.exec("SAVEPOINT approval; UPDATE producer_requests SET status='approved';"); } catch (e) {
        if (!owned) throw e;
        rejected = true;
        await db.exec('ROLLBACK TO SAVEPOINT approval');
      }
      await db.exec('RESET ROLE');
      if (owned) {
        assert.ok(rejected, 'occupied claim must reject');
        assert.equal(await scalar('SELECT count(*)::int FROM listing'),1);
        assert.equal(await scalar('SELECT count(*)::int FROM profiles'),0);
        assert.equal(await scalar('SELECT status FROM producer_requests'),'pending');
        return;
      }
      const row = (await db.query(`SELECT p.role,p.farm_id,r.listing_id,l.clerk_user_id FROM profiles p JOIN producer_requests r ON p.user_id=r.user_id LEFT JOIN listing l ON l.id=r.listing_id`)).rows[0];
      assert.equal(row.role,'farmer');
      assert.equal(row.clerk_user_id,'applicant');
      assert.equal(row.farm_id,row.listing_id,'farm_id must match request');
      if (claim) assert.equal(Number(row.listing_id),900001);
      assert.equal(await scalar('SELECT count(*)::int FROM listing'),claim?1:2);
      assert.notEqual(await scalar("SELECT coalesce(current_setting('app.bypass_sensitive',true),'')"),'on');
    }, fixed);
  }
  await scenario('D reapproval no extra effects', async () => {
    await db.exec(`INSERT INTO producer_requests(type,user_id,user_email,farm_name) VALUES ('create','repeat','repeat@example.invalid','Repeat'); SET LOCAL ROLE service_role; UPDATE producer_requests SET status='approved'; RESET ROLE;`);
    const before = await scalar('SELECT row_to_json(t)::text FROM (SELECT listing_id FROM producer_requests) t');
    await db.exec("SET LOCAL ROLE service_role; UPDATE producer_requests SET status='approved'; RESET ROLE;");
    assert.equal(await scalar('SELECT count(*)::int FROM listing'),1);
    assert.equal(await scalar('SELECT row_to_json(t)::text FROM (SELECT listing_id FROM producer_requests) t'),before);
  }, true);
  await scenario('F non-admin cannot approve',async()=>{
    await db.exec(`INSERT INTO producer_requests(type,user_id,user_email) VALUES ('create','ordinary','o@example.invalid'); SET LOCAL ROLE authenticated; SELECT set_config('request.jwt.claims','{"sub":"ordinary","role":"authenticated"}',true);`);
    assert.equal((await db.query("UPDATE producer_requests SET status='approved' RETURNING id")).rows.length,0);
    await db.exec('RESET ROLE');
    assert.equal(await scalar('SELECT status FROM producer_requests'),'pending');
  },true);
}
try {
  await db.exec(read(root+'platform.sql'));
  await db.exec(read(root+'baseline.sql'));
  await db.exec(read(root+'permissions.sql'));
  // Read-only Production observation, 2026-10-10: compare the relevant function
  // bodies rather than assuming the archived fixture still matches production.
  const observed = {
    handle_producer_request_approval: '167ac60839818ee147006220bdfcaffe',
    is_admin: '3b7c6175fbd8685031d780c04c898a45',
    prevent_profile_role_change: 'e6e25ac538f7e2eef00c65144bd004cc',
    prevent_profiles_sensitive_changes: '7a0818b6f2fac866635598311bcb7f04',
  };
  for (const [name, hash] of Object.entries(observed)) {
    const result = await db.query("SELECT md5(regexp_replace(prosrc, '\\s', '', 'g')) AS hash FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname=$1",[name]);
    assert.equal(result.rows[0].hash,hash,name+' differs from read-only Production observation');
  }
  console.log('Production function bodies match the isolated pre-fix fixture');
  console.log('BEFORE'); await matrix(false);
  if (!process.argv.includes('--before-only')) {
    const file = readdirSync(new URL('../supabase/migrations/',import.meta.url)).find(p=>p.endsWith('_producer_approval_invariants.sql'));
    await db.exec(read('supabase/migrations/'+file));
    await db.exec(read('supabase/migrations/'+file)); // DDL replay itself is safe.
    console.log('AFTER'); await matrix(true);
    async function rejects(sql, code) {
      await db.exec('SAVEPOINT denied');
      let error;
      try { await db.exec(sql); } catch (e) { error = e; }
      await db.exec('ROLLBACK TO SAVEPOINT denied');
      assert.equal(error?.code,code);
    }
    await scenario('G direct approved INSERT rejected', async()=>{
      await db.exec(`SET LOCAL ROLE authenticated; SELECT set_config('request.jwt.claims','{"sub":"intruder"}',true);`);
      await rejects("INSERT INTO producer_requests(type,user_id,user_email,status) VALUES ('create','intruder','x@example.invalid','approved')",'23514');
    },true);
    await scenario('H bypass restored and profile protection retained', async()=>{
      await db.exec(`INSERT INTO producer_requests(type,user_id,user_email,farm_name) VALUES ('create','applicant','a@example.invalid','A'); SET LOCAL ROLE service_role; UPDATE producer_requests SET status='approved'; SET LOCAL ROLE authenticated; SELECT set_config('request.jwt.claims','{"sub":"applicant"}',true);`);
      await rejects("UPDATE profiles SET role='admin' WHERE user_id='applicant'",'P0001');
      await rejects("UPDATE profiles SET farm_id=NULL WHERE user_id='applicant'",'P0001');
    },true);
    await scenario('I approved association immutable',async()=>{
      await db.exec(`INSERT INTO producer_requests(type,user_id,user_email,farm_name) VALUES ('create','applicant','a@example.invalid','A'); SET LOCAL ROLE service_role; UPDATE producer_requests SET status='approved';`);
      await rejects("UPDATE producer_requests SET status='pending'",'23514');
      await rejects("UPDATE producer_requests SET user_id='intruder'",'23514');
      await rejects("UPDATE producer_requests SET listing_id=NULL",'23514');
    },true);
    await scenario('J authorization independent of forged JWT/bypass',async()=>{
      await db.exec(`INSERT INTO producer_requests(type,user_id,user_email) VALUES ('create','intruder','x@example.invalid'); CREATE POLICY test_only_update ON producer_requests FOR UPDATE TO authenticated USING(true) WITH CHECK(true); SET LOCAL ROLE authenticated; SELECT set_config('request.jwt.claims','{"sub":"intruder","role":"service_role"}',true); SELECT set_config('app.bypass_sensitive','on',true);`);
      await rejects("UPDATE producer_requests SET status='approved'",'42501');
    },true);
    await scenario('K failed profile write rolls ownership back',async()=>{
      await db.exec(`INSERT INTO listing(id,slug) VALUES (900001,'fixture'); ALTER TABLE profiles ADD CONSTRAINT test_only_failure CHECK (user_id <> 'applicant'); INSERT INTO producer_requests(type,user_id,user_email,listing_id) VALUES ('claim','applicant','duplicate@example.invalid',900001); SET LOCAL ROLE service_role;`);
      await rejects("UPDATE producer_requests SET status='approved'",'23514');
      await db.exec('RESET ROLE');
      assert.equal(await scalar('SELECT clerk_user_id FROM listing'),null);
      assert.equal(await scalar('SELECT status FROM producer_requests'),'pending');
      assert.notEqual(await scalar("SELECT coalesce(current_setting('app.bypass_sensitive',true),'')"),'on');
    },true);
    await scenario('L existing farm association preserved',async()=>{
      await db.exec(`INSERT INTO listing(id,slug) VALUES (900001,'existing'),(900002,'target'); INSERT INTO profiles(user_id,role,farm_id) VALUES ('applicant','farmer',900001); INSERT INTO producer_requests(type,user_id,user_email,listing_id) VALUES ('claim','applicant','a@example.invalid',900002); SET LOCAL ROLE service_role;`);
      await rejects("UPDATE producer_requests SET status='approved'",'23514');
      await db.exec('RESET ROLE');
      assert.equal(Number(await scalar('SELECT farm_id FROM profiles')),900001);
      assert.equal(await scalar('SELECT clerk_user_id FROM listing WHERE id=900002'),null);
    },true);
    await scenario('M same farm names do not collide',async()=>{
      await db.exec(`INSERT INTO producer_requests(type,user_id,user_email,farm_name) VALUES ('create','first','a@example.invalid','Same'),('create','second','b@example.invalid','Same'); SET LOCAL ROLE service_role; UPDATE producer_requests SET status='approved'; RESET ROLE;`);
      assert.equal(await scalar('SELECT count(*)::int FROM listing'),2);
      assert.equal(await scalar('SELECT count(DISTINCT farm_id)::int FROM profiles'),2);
    },true);
    assert.equal(await scalar("SELECT count(*)::int FROM pg_trigger WHERE tgrelid='producer_requests'::regclass AND tgfoid='handle_producer_request_approval'::regproc"),1);

  }
} finally { await db.close(); }
