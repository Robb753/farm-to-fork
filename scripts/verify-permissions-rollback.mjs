import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import { unaccent } from '@electric-sql/pglite/contrib/unaccent';
const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const plan = JSON.parse(read('supabase/deployment/plan.json'));
for (const [file, hash] of Object.entries(plan.files)) assert.equal(createHash('sha256').update(read(file)).digest('hex'), hash, `Reviewed SQL changed: ${file}`);
const db = new PGlite({ extensions: { unaccent } });
const normalize = value => typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : Array.isArray(value) ? value.map(normalize) : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).filter(([k]) => k !== 'collected_at').map(([k,v]) => [k,normalize(v)])) : value;
const exportSql = read('supabase/audit/export-schema.sql').replace('BEGIN TRANSACTION READ ONLY;','').replace('COMMIT;','');
const catalog = async () => normalize((await db.query(exportSql)).rows[0].snapshot);
async function rows() {
  const tables = JSON.parse(read('supabase/baseline/source-catalog.json')).tables.map(t => `public."${t.name}"`).concat(['storage.objects','storage.buckets']);
  const result = {};
  for (const table of tables) result[table] = (await db.query(`SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text), '[]'::jsonb) AS data FROM ${table} t`)).rows[0].data;
  return result;
}
const sequenceState = async () => (await db.query("SELECT sequencename, last_value::text FROM pg_sequences WHERE schemaname='public' ORDER BY sequencename")).rows;
const sequenceGrants = async () => (await db.query("SELECT c.relname, coalesce(r.rolname,'PUBLIC') AS role, a.privilege_type, a.is_grantable FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace CROSS JOIN LATERAL aclexplode(coalesce(c.relacl,acldefault('S',c.relowner))) a LEFT JOIN pg_roles r ON r.oid=a.grantee WHERE c.relkind='S' AND n.nspname='public' ORDER BY c.relname,role,a.privilege_type")).rows;
try {
  await db.exec(read('supabase/tests/platform-fixture.sql'));
  await db.exec(read('supabase/tests/storage-triggers-fixture.sql'));
  await db.exec(read('supabase/migrations/20260920213943_verified_app_baseline.sql'));
  await db.exec(`INSERT INTO listing(id,slug,name,clerk_user_id,active) VALUES(1,'rollback-fixture','Rollback fixture','user_A',false);
    INSERT INTO profiles(user_id,email,role,farm_id) VALUES('user_A','a@example.invalid','farmer',1),('user_admin','admin@example.invalid','admin',null);
    INSERT INTO products(name,farm_id,listing_id) VALUES('Fixture',1,1);
    INSERT INTO "listingImages"(url,listing_id) VALUES('fixture.jpg',1);
    INSERT INTO storage.objects(bucket_id,name) VALUES('listingImages','1/fixture.jpg');
    INSERT INTO producer_requests(type,user_id,user_email) VALUES('create','user_A','a@example.invalid');`);
  const before = await catalog(), data = await rows(), sequences = await sequenceState(), grants = await sequenceGrants();
  await db.exec(read('supabase/migrations/20260921051759_targeted_permissions.sql'));
  assert.deepEqual(await rows(),data,'Patch changed application/Storage rows');
  assert.deepEqual(await sequenceState(),sequences,'Patch changed sequence values');
  const after = await catalog();
  assert.deepEqual(after.triggers,before.triggers,'Patch changed triggers');
  assert.deepEqual(after.functions.filter(f=>f.name!=='is_admin'),before.functions.filter(f=>f.name!=='is_admin'),'Patch changed another function');
  await db.exec(read('supabase/deployment/rollback-targeted-permissions.sql'));
  assert.deepEqual(await catalog(),before,'Rollback does not restore exact catalog');
  assert.deepEqual(await sequenceGrants(),grants,'Rollback does not restore sequence grants');
  assert.deepEqual(await rows(),data,'Rollback changed rows');
  assert.deepEqual(await sequenceState(),sequences,'Rollback changed sequence values');
  console.info('PASS: reviewed hashes; patch preserves rows, sequence values, producer triggers/functions; rollback restores catalog, grants and rows.');
} finally { await db.close(); }
