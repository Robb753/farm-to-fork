import { Client } from 'pg';

// Diagnostics only: fixed LOCAL connection, no env-based target or CLI arguments.
if (process.argv.length !== 2) throw new Error('No arguments accepted; target is always 127.0.0.1:54322.');
const client = new Client({ host: '127.0.0.1', port: 54322, user: 'postgres', password: 'postgres', database: 'postgres', connectionTimeoutMillis: 5000 });
try {
  await client.connect();
  await client.query('BEGIN TRANSACTION READ ONLY');
  const { rows } = await client.query(`SELECT jsonb_build_object(
    'postgres_version', current_setting('server_version'),
    'columns', (SELECT jsonb_agg(jsonb_build_object('name',a.attname,'type',format_type(a.atttypid,a.atttypmod),
      'default',pg_get_expr(d.adbin,d.adrelid)) ORDER BY a.attnum)
      FROM pg_attribute a LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum
      WHERE a.attrelid='storage.objects'::regclass AND a.attnum>0 AND NOT a.attisdropped),
    'constraints', (SELECT jsonb_agg(jsonb_build_object('name',conname,'definition',pg_get_constraintdef(oid),
      'deferrable',condeferrable,'validated',convalidated) ORDER BY conname)
      FROM pg_constraint WHERE conrelid='storage.objects'::regclass),
    'indexes', (SELECT jsonb_agg(jsonb_build_object('name',c.relname,'definition',pg_get_indexdef(i.indexrelid),
      'unique',i.indisunique,'valid',i.indisvalid,'immediate',i.indimmediate,'predicate',pg_get_expr(i.indpred,i.indrelid)) ORDER BY c.relname)
      FROM pg_index i JOIN pg_class c ON c.oid=i.indexrelid WHERE i.indrelid='storage.objects'::regclass),
    'triggers', (SELECT jsonb_agg(jsonb_build_object('name',tgname,'enabled',tgenabled,'definition',pg_get_triggerdef(oid)) ORDER BY tgname)
      FROM pg_trigger WHERE tgrelid='storage.objects'::regclass AND NOT tgisinternal)
  ) AS storage_catalog`);
  console.info(JSON.stringify({ target: '127.0.0.1:54322/postgres', ...rows[0].storage_catalog }, null, 2));
} catch (error) {
  console.error(`Local Storage inventory failed (${error.code ?? 'unknown'}). No remote fallback or schema change.`);
  process.exitCode = 1;
} finally {
  // The only transaction is read-only. No application rows or credentials output.
  await client.query('ROLLBACK').catch(() => {});
  await client.end();
}
