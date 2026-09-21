import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import { unaccent } from '@electric-sql/pglite/contrib/unaccent';

// Never accepts a remote URL or provider credentials. Every write is local.
const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const migrations = readdirSync(new URL('../supabase/migrations/', import.meta.url)).filter(p => p.endsWith('.sql')).sort();
assert.equal(migrations.length, 2, 'Review the reconstruction test when adding migrations');
const baseline = read(`supabase/migrations/${migrations[0]}`);
const patch = read('supabase/audit/targeted-permissions-fix.sql');
assert.equal(patch, read(`supabase/migrations/${migrations[1]}`), 'Reviewed patch and migration must be identical');
const source = JSON.parse(read('supabase/baseline/source-catalog.json'));
const exportSql = read('supabase/audit/export-schema.sql').replace('BEGIN TRANSACTION READ ONLY;', '').replace('COMMIT;', '');
const results = [];
const normalize = (value) => typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : value;
const sort = (rows) => rows.map(r => Object.fromEntries(Object.entries(r).sort(([a], [b]) => a.localeCompare(b)).map(([k,v]) => [k, normalize(v)]))).sort((a,b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
function appCatalog(s) {
  const result = {};
  for (const name of ['tables','columns','constraints','functions','triggers','enums']) result[name] = sort(s[name].filter(x => x.schema === 'public'));
  result.policies = sort(s.policies.filter(x => x.schema === 'public' || (x.schema === 'storage' && x.table_name === 'objects')));
  result.indexes = sort(s.indexes.filter(x => x.schemaname === 'public'));
  // PostgreSQL table_catalog changes with the local database name, not its schema.
  result.table_grants = sort(s.table_grants.filter(x => x.table_schema === 'public' && ['PUBLIC','anon','authenticated','service_role'].includes(x.grantee)).map(x => Object.fromEntries(Object.entries(x).filter(([key]) => !['table_catalog', 'grantor'].includes(key)))));
  result.storage_buckets = sort(s.storage_buckets);
  return result;
}
async function catalog(db) {
  await db.exec('SET search_path = public;');
  return appCatalog((await db.query(exportSql)).rows[0].snapshot);
}
const actors = {
  visitor: { role: 'anon', claims: {} },
  A: { role: 'authenticated', claims: { sub: 'user_A', role: 'authenticated' } },
  B: { role: 'authenticated', claims: { sub: 'user_B', role: 'authenticated' } },
  admin: { role: 'authenticated', claims: { sub: 'user_admin', role: 'authenticated' } },
  newcomer: { role: 'authenticated', claims: { sub: 'user_new', role: 'authenticated' } },
};
async function check(db, actor, label, sql, expected, options = {}) {
  const identity = options.identity ?? actors[actor];
  await db.exec('BEGIN;');
  try {
    await db.exec(`SET LOCAL ROLE ${identity.role};`);
    await db.query("SELECT set_config('request.jwt.claims', $1, true)", [JSON.stringify(identity.claims)]);
    if (options.storageApi) await db.query("SELECT set_config('storage.allow_delete_query', 'true', true)");
    const r = (await db.query('SELECT current_user AS name, rolbypassrls, rolsuper FROM pg_roles WHERE rolname = current_user')).rows[0];
    assert.equal(r.name, identity.role);
    assert.equal(r.rolbypassrls, false, 'Tests must not bypass RLS');
    assert.equal(r.rolsuper, false, 'Tests must not run as owner/superuser');
    let response, error;
    try { response = await db.query(sql); } catch (e) { error = e; }
    if (typeof expected === 'string') {
      assert.ok(error, `${actor}: ${label}: expected SQLSTATE ${expected}`);
      assert.equal(error.code, expected, `${actor}: ${label}: ${error.message}`);
    } else {
      if (error) throw new Error(`${actor}: ${label}: ${error.message}`, { cause: error });
      assert.deepEqual(response.rows, expected, `${actor}: ${label}`);
    }
    results.push({ actor, label, pass: true });
  } finally { await db.exec('ROLLBACK;'); }
}
async function sequences(db) {
  const rows = (await db.query(`SELECT sequencename AS name, data_type, start_value::text AS start,
    increment_by::text AS increment, min_value::text AS min, max_value::text AS max,
    cache_size::text AS cache, cycle FROM pg_sequences WHERE schemaname='public'`)).rows;
  assert.deepEqual(sort(rows), sort(source.sequences), 'Sequence definitions differ from source');
  const owners = (await db.query(`SELECT seq.relname AS sequence, tab.relname AS table,
    a.attname AS column, d.deptype AS dependency FROM pg_class seq
    JOIN pg_depend d ON d.objid=seq.oid AND d.classid='pg_class'::regclass
      AND d.refclassid='pg_class'::regclass AND d.deptype IN ('a','i')
    JOIN pg_class tab ON tab.oid=d.refobjid
    JOIN pg_attribute a ON a.attrelid=tab.oid AND a.attnum=d.refobjsubid
    WHERE seq.relkind='S' AND seq.relnamespace='public'::regnamespace`)).rows;
  assert.deepEqual(sort(owners), sort(source.sequence_ownership), 'Sequence ownership differs');
}
async function seed(db) {
  await db.exec(`
    INSERT INTO listing(id,slug,name,clerk_user_id,active) VALUES
      (1,'fixture-a','A','user_A',false),(2,'fixture-b','B','user_B',true),
      (3,'fixture-hidden','Hidden',null,false),(4,'fixture-public','Public',null,true);
    INSERT INTO profiles(user_id,email,role,farm_id) VALUES
      ('user_A','a@example.invalid','farmer',1),('user_B','b@example.invalid','farmer',2),
      ('user_admin','admin@example.invalid','admin',null);
    INSERT INTO products(id,name,farm_id,listing_id) VALUES (11,'A',1,1),(22,'B',2,2);
    INSERT INTO "listingImages"(id,url,listing_id) VALUES (101,'a.jpg',1),(102,'b.jpg',2);
    INSERT INTO storage.objects(id,bucket_id,name) VALUES
      ('00000000-0000-0000-0000-000000000001','listingImages','1/a.jpg'),
      ('00000000-0000-0000-0000-000000000002','listingImages','2/b.jpg');
    INSERT INTO producer_requests(id,type,user_id,user_email) VALUES
      ('00000000-0000-0000-0000-000000000011','create','user_A','a@example.invalid'),
      ('00000000-0000-0000-0000-000000000022','create','user_B','b@example.invalid');
  `);
}
async function matrix(db) {
  for (const actor of ['visitor','A','B','admin']) {
    const own = actor === 'A' ? 1 : actor === 'B' ? 2 : null;
    const other = own === 1 ? 2 : 1;
    const ids = actor === 'admin' ? [1,2,3,4] : actor === 'A' ? [1,2,4] : [2,4];
    await check(db,actor,'listing visibility','SELECT id::int AS id FROM listing ORDER BY id',ids.map(id=>({id})));
    await check(db,actor,'product reads preserved','SELECT id::int AS id FROM products ORDER BY id',[{id:11},{id:22}]);
    await check(db,actor,'profiles visibility','SELECT user_id FROM profiles ORDER BY user_id', actor==='visitor'?[]:actor==='admin'?[{user_id:'user_A'},{user_id:'user_B'},{user_id:'user_admin'}]:[{user_id:`user_${actor}`}]);
    await check(db,actor,'no OSM direct read','SELECT id FROM osm_import_review','42501');
    await check(db,actor,'no OSM direct write',"INSERT INTO osm_import_review(name) VALUES ('test') RETURNING id",'42501');
    await check(db,actor,'no cross-farm product update',`UPDATE products SET name='x' WHERE farm_id=${other} RETURNING name`,actor==='visitor'?'42501':[]);
    await check(db,actor,'no cross-farm product delete',`DELETE FROM products WHERE farm_id=${other} RETURNING name`,actor==='visitor'?'42501':[]);
    await check(db,actor,'no cross-farm product insert',`INSERT INTO products(name,farm_id,listing_id) VALUES ('x',${other},${other}) RETURNING name`,'42501');
    await check(db,actor,'no cross-farm image insert',`INSERT INTO "listingImages"(url,listing_id) VALUES ('x',${other}) RETURNING url`,'42501');
    await check(db,actor,'image update authority',`UPDATE "listingImages" SET url='x' WHERE listing_id=${other} RETURNING url`,actor==='admin'?[{url:'x'}]:[]);
    await check(db,actor,'image delete authority',`DELETE FROM "listingImages" WHERE listing_id=${other} RETURNING url`,actor==='admin'?[{url:other===1?'a.jpg':'b.jpg'}]:[]);
    await check(db,actor,'listing update authority',`UPDATE listing SET name='x' WHERE id=${other} RETURNING name`,actor==='admin'?[{name:'x'}]:[]);
    await check(db,actor,'storage public read',"SELECT name FROM storage.objects WHERE bucket_id='listingImages' ORDER BY name",[{name:'1/a.jpg'},{name:'2/b.jpg'}]);
    await check(db,actor,'no cross-farm storage insert',`INSERT INTO storage.objects(bucket_id,name) VALUES ('listingImages','${other}/new.jpg') RETURNING name`,'42501');
    await check(db,actor,'no cross-farm storage update',`UPDATE storage.objects SET metadata='{}' WHERE name='${other}/${other===1?'a':'b'}.jpg' RETURNING name`,[]);
    await check(db,actor,'no cross-farm storage delete',`DELETE FROM storage.objects WHERE name='${other}/${other===1?'a':'b'}.jpg' RETURNING name`,[],{storageApi:true});
    for (const table of ['products','profiles','listing','"listingImages"','osm_import_review']) await check(db,actor,`no TRUNCATE ${table}`,`TRUNCATE ${table} CASCADE`,'42501');
    if (own) {
      const product = own*11;
      await check(db,actor,'own product insert',`INSERT INTO products(name,farm_id,listing_id) VALUES ('x',${own},${own}) RETURNING name`,[{name:'x'}]);
      await check(db,actor,'own product update',`UPDATE products SET name='x' WHERE id=${product} RETURNING name`,[{name:'x'}]);
      await check(db,actor,'own product delete',`DELETE FROM products WHERE id=${product} RETURNING name`,[{name:actor}]);
      await check(db,actor,'no product farm transfer',`UPDATE products SET farm_id=${other} WHERE id=${product} RETURNING name`,'42501');
      await check(db,actor,'no inconsistent product listing',`INSERT INTO products(name,farm_id,listing_id) VALUES ('x',${own},${other}) RETURNING name`,'42501');
      await check(db,actor,'own image insert',`INSERT INTO "listingImages"(url,listing_id) VALUES ('x',${own}) RETURNING url`,[{url:'x'}]);
      await check(db,actor,'own image update including inactive listing',`UPDATE "listingImages" SET url='x' WHERE listing_id=${own} RETURNING url`,[{url:'x'}]);
      await check(db,actor,'own image delete',`DELETE FROM "listingImages" WHERE listing_id=${own} RETURNING url`,[{url:own===1?'a.jpg':'b.jpg'}]);
      await check(db,actor,'no image reassignment',`UPDATE "listingImages" SET listing_id=${other} WHERE listing_id=${own} RETURNING url`,'42501');
      await check(db,actor,'own listing edit',`UPDATE listing SET name='x' WHERE id=${own} RETURNING name`,[{name:'x'}]);
      await check(db,actor,'no listing ownership transfer',`UPDATE listing SET clerk_user_id='user_new' WHERE id=${own} RETURNING name`,'42501');
      await check(db,actor,'own favorites',`UPDATE profiles SET favorites='[1]' WHERE user_id='user_${actor}' RETURNING favorites`,[{favorites:[1]}]);
      await check(db,actor,'no self promotion',`UPDATE profiles SET role='admin' WHERE user_id='user_${actor}' RETURNING role`,'P0001');
      await check(db,actor,'no farm reassignment',`UPDATE profiles SET farm_id=${other} WHERE user_id='user_${actor}' RETURNING farm_id`,'P0001');
      await check(db,actor,'own storage insert',`INSERT INTO storage.objects(bucket_id,name) VALUES ('listingImages','${own}/new.jpg') RETURNING name`,[{name:`${own}/new.jpg`}]);
      await check(db,actor,'own storage upsert',`INSERT INTO storage.objects(bucket_id,name) VALUES ('listingImages','${own}/${own===1?'a':'b'}.jpg') ON CONFLICT(bucket_id,name) DO UPDATE SET metadata='{}' RETURNING name`,[{name:`${own}/${own===1?'a':'b'}.jpg`}]);
      await check(db,actor,'no storage folder move',`UPDATE storage.objects SET name='${other}/moved.jpg' WHERE name='${own}/${own===1?'a':'b'}.jpg' RETURNING name`,'42501');
      await check(db,actor,'own storage delete via API SQL context',`DELETE FROM storage.objects WHERE name='${own}/${own===1?'a':'b'}.jpg' RETURNING name`,[{name:`${own}/${own===1?'a':'b'}.jpg`}],{storageApi:true});
      await check(db,actor,'storage direct delete protected',`DELETE FROM storage.objects WHERE name='${own}/${own===1?'a':'b'}.jpg' RETURNING name`,'42501');
      for (const name of ['abc/file.jpg','999999999999999999999999999999/file.jpg','01/file.jpg']) await check(db,actor,`invalid path ${name}`,`INSERT INTO storage.objects(bucket_id,name) VALUES ('listingImages','${name}') RETURNING name`,'42501');
      await check(db,actor,'Clerk request ownership','SELECT user_id FROM producer_requests ORDER BY user_id',[{user_id:`user_${actor}`}]);
      await check(db,actor,'no sequence reset',"SELECT setval('public.products_id_seq',999)",'42501');
    }
  }
  await check(db,'newcomer','plain profile insert',"INSERT INTO profiles(user_id,email) VALUES ('user_new','new@example.invalid') RETURNING role",[{role:'user'}]);
  for (const fields of ["'admin',null","'farmer',null","'user',1"]) await check(db,'newcomer',`profile escalation ${fields}`,`INSERT INTO profiles(user_id,role,farm_id) VALUES ('user_new',${fields}) RETURNING role`,'42501');
  await check(db,'newcomer','no profile impersonation',"INSERT INTO profiles(user_id) VALUES ('user_other') RETURNING user_id",'42501');
  await check(db,'newcomer','untrusted email cannot be admin','SELECT is_admin() AS admin',[{admin:false}],{identity:{role:'authenticated',claims:{sub:'user_new',email:'admin@farmtofork.fr',user_metadata:{email:'admin@farmtofork.fr'}}}});
  await check(db,'admin','DB admin recognized','SELECT is_admin() AS admin',[{admin:true}]);
  await check(db,'admin','admin can read inactive images','SELECT id::int AS id FROM "listingImages" ORDER BY id',[{id:101},{id:102}]);
}

const db = new PGlite({ extensions: { unaccent } });
let expectedTarget;
try {
  await db.exec(read('supabase/tests/platform-fixture.sql'));
  await db.exec(read('supabase/tests/storage-triggers-fixture.sql'));
  await db.exec(baseline);
  await sequences(db);
  assert.deepEqual(await catalog(db), appCatalog(source), 'Baseline differs from observed production app metadata');
  await seed(db);
  // Negative controls: prove the test detects the old authorization holes.
  await check(db,'visitor','before patch: anonymous product write',"UPDATE products SET name='x' WHERE id=11 RETURNING name",[{name:'x'}]);
  await check(db,'newcomer','before patch: self-admin insert',"INSERT INTO profiles(user_id,role) VALUES ('user_new','admin') RETURNING role",[{role:'admin'}]);
  await check(db,'A','before patch: cross-farm storage delete',"DELETE FROM storage.objects WHERE name='2/b.jpg' RETURNING name",[{name:'2/b.jpg'}],{storageApi:true});
  await db.exec(patch);
  expectedTarget = await catalog(db);
  await matrix(db);
  console.info(`PGlite PostgreSQL 17: baseline matches source, patch and ${results.length} permission checks passed.`);
} finally { await db.close(); }
// Second independent empty database: complete migration replay, without source data.
const fresh = new PGlite({ extensions: { unaccent } });
try {
  await fresh.exec(read('supabase/tests/platform-fixture.sql'));
  await fresh.exec(read('supabase/tests/storage-triggers-fixture.sql'));
  for (const file of migrations) await fresh.exec(read(`supabase/migrations/${file}`));
  await sequences(fresh);
  assert.deepEqual(await catalog(fresh), expectedTarget, 'Empty rebuild differs from baseline + patch');
  for (const t of source.tables) assert.equal((await fresh.query(`SELECT count(*)::int AS n FROM public."${t.name}"`)).rows[0].n, 0);
  await seed(fresh);
  await matrix(fresh);
  console.info('Second empty database: same catalog, no application data, permission matrix passed again.');
} finally { await fresh.close(); }

if (process.argv.includes('--supabase-local')) {
  const { Client } = await import('pg');
  // Fixed local CLI endpoint. Cannot be redirected to production by environment.
  const client = new Client({ host: '127.0.0.1', port: 54322, user: 'postgres', password: 'postgres', database: 'postgres' });
  await client.connect();
  const native = { query: (sql,args) => client.query(sql,args), exec: sql => client.query(sql) };
  try {
    const address = (await client.query('select inet_server_addr()::text as addr')).rows[0].addr;
    assert.ok(address, 'Expected local container database');
    await sequences(native);
    assert.deepEqual(await catalog(native), expectedTarget, 'Supabase CLI migrations differ from tested target');
    for (const t of source.tables) assert.equal((await client.query(`SELECT count(*)::int AS n FROM public."${t.name}"`)).rows[0].n,0,'Native DB must be empty before test fixtures');
    await seed(native);
    await matrix(native);
    console.info('Real local Supabase PostgreSQL: reconstructed catalog and permission matrix passed.');
  } finally { await client.end(); }
}
mkdirSync(new URL('../private-audit/',import.meta.url),{recursive:true});
writeFileSync(new URL('../private-audit/db-validation.json',import.meta.url),JSON.stringify({ migrations:migrations.map(file=>({file,sha256:createHash('sha256').update(read(`supabase/migrations/${file}`)).digest('hex')})), checks:results, native:process.argv.includes('--supabase-local') },null,2));
