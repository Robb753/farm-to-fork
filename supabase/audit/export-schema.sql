-- Read-only inventory. Run in the Supabase SQL Editor or with psql.
-- Returns one JSON cell, snapshot. No application rows, users or tokens.
-- Review function definitions privately: legacy functions may contain literals.
-- Do NOT place this file in migrations or apply the historical migrations.
BEGIN TRANSACTION READ ONLY;

WITH relations AS (
  SELECT c.oid, n.nspname AS schema, c.relname AS name,
         c.relrowsecurity AS rls_enabled, c.relforcerowsecurity AS rls_forced,
         c.relkind AS kind
  FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE (n.nspname = 'public' OR (n.nspname = 'storage' AND c.relname IN ('objects', 'buckets')))
    AND c.relkind IN ('r', 'p', 'v', 'm')
), columns AS (
  SELECT r.schema, r.name AS table_name, a.attname AS name,
         pg_catalog.format_type(a.atttypid, a.atttypmod) AS data_type,
         NOT a.attnotnull AS nullable, a.attidentity AS identity,
         pg_catalog.pg_get_expr(d.adbin, d.adrelid) AS default_expression
  FROM relations r
  JOIN pg_catalog.pg_attribute a ON a.attrelid = r.oid AND a.attnum > 0 AND NOT a.attisdropped
  LEFT JOIN pg_catalog.pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
), constraints AS (
  SELECT r.schema, r.name AS table_name, c.conname AS name, c.contype AS type,
         pg_catalog.pg_get_constraintdef(c.oid, true) AS definition
  FROM relations r JOIN pg_catalog.pg_constraint c ON c.conrelid = r.oid
), triggers AS (
  SELECT r.schema, r.name AS table_name, t.tgname AS name, t.tgenabled AS enabled,
         pn.nspname AS function_schema, p.proname AS function_name,
         pg_catalog.pg_get_triggerdef(t.oid, true) AS definition
  FROM relations r
  JOIN pg_catalog.pg_trigger t ON t.tgrelid = r.oid AND NOT t.tgisinternal
  JOIN pg_catalog.pg_proc p ON p.oid = t.tgfoid
  JOIN pg_catalog.pg_namespace pn ON pn.oid = p.pronamespace
), functions AS (
  SELECT n.nspname AS schema, p.proname AS name,
         pg_catalog.pg_get_function_identity_arguments(p.oid) AS arguments,
         p.prosecdef AS security_definer, p.proconfig AS settings,
         pg_catalog.pg_get_functiondef(p.oid) AS definition
  FROM pg_catalog.pg_proc p
  JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
  WHERE p.prokind = 'f'
    AND (n.nspname = 'public' OR (n.nspname = 'auth' AND p.proname IN ('uid', 'jwt')))
    AND NOT EXISTS (
      SELECT 1 FROM pg_catalog.pg_depend d
      WHERE d.classid = 'pg_proc'::regclass AND d.objid = p.oid AND d.deptype = 'e'
    )
), policies AS (
  SELECT schemaname AS schema, tablename AS table_name, policyname AS name,
         permissive, roles, cmd, qual, with_check
  FROM pg_catalog.pg_policies
  WHERE schemaname IN ('public', 'storage')
), enums AS (
  SELECT n.nspname AS schema, t.typname AS name,
         jsonb_agg(e.enumlabel ORDER BY e.enumsortorder) AS values
  FROM pg_catalog.pg_type t
  JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
  JOIN pg_catalog.pg_enum e ON e.enumtypid = t.oid
  WHERE n.nspname = 'public'
  GROUP BY n.nspname, t.typname
)
SELECT jsonb_build_object(
  'format_version', 1,
  'collected_at', current_timestamp,
  'tables', COALESCE((SELECT jsonb_agg(to_jsonb(r) - 'oid' ORDER BY r.schema, r.name) FROM relations r), '[]'::jsonb),
  'columns', COALESCE((SELECT jsonb_agg(c ORDER BY c.schema, c.table_name, c.name) FROM columns c), '[]'::jsonb),
  'constraints', COALESCE((SELECT jsonb_agg(c ORDER BY c.schema, c.table_name, c.name) FROM constraints c), '[]'::jsonb),
  'triggers', COALESCE((SELECT jsonb_agg(t ORDER BY t.schema, t.table_name, t.name) FROM triggers t), '[]'::jsonb),
  'functions', COALESCE((SELECT jsonb_agg(f ORDER BY f.schema, f.name, f.arguments) FROM functions f), '[]'::jsonb),
  'policies', COALESCE((SELECT jsonb_agg(p ORDER BY p.schema, p.table_name, p.name) FROM policies p), '[]'::jsonb),
  'enums', COALESCE((SELECT jsonb_agg(e ORDER BY e.schema, e.name) FROM enums e), '[]'::jsonb),
  'indexes', COALESCE((SELECT jsonb_agg(i ORDER BY i.schemaname, i.tablename, i.indexname)
    FROM pg_catalog.pg_indexes i WHERE i.schemaname IN ('public', 'storage')), '[]'::jsonb),
  'table_grants', COALESCE((SELECT jsonb_agg(g ORDER BY g.table_schema, g.table_name, g.grantee, g.privilege_type)
    FROM information_schema.table_privileges g WHERE g.table_schema IN ('public', 'storage')), '[]'::jsonb),
  'column_grants', COALESCE((SELECT jsonb_agg(g ORDER BY g.table_schema, g.table_name, g.column_name, g.grantee)
    FROM information_schema.column_privileges g WHERE g.table_schema IN ('public', 'storage')), '[]'::jsonb),
  'routine_grants', COALESCE((SELECT jsonb_agg(g ORDER BY g.routine_schema, g.routine_name, g.grantee)
    FROM information_schema.routine_privileges g WHERE g.routine_schema = 'public'), '[]'::jsonb),
  'storage_buckets', COALESCE((SELECT jsonb_agg(jsonb_build_object(
    'id', b.id, 'public', b.public, 'file_size_limit', b.file_size_limit,
    'allowed_mime_types', b.allowed_mime_types) ORDER BY b.id) FROM storage.buckets b), '[]'::jsonb)
) AS snapshot;

COMMIT;
