import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

// Contract = checked-in Row columns, NOT a claim that these types match production.
export function readCodeContract(source) {
  const file = ts.createSourceFile('database.ts', source, ts.ScriptTarget.Latest, true);
  const member = (node, name) => node?.members?.find((m) => m.name?.getText(file).replace(/["']/g, '') === name);
  const database = file.statements.find((n) => ts.isInterfaceDeclaration(n) && n.name.text === 'Database');
  const tables = member(member(database, 'public')?.type, 'Tables')?.type;
  if (!tables?.members?.length) throw new Error('Database.public.Tables contract not found');
  return tables.members.map((table) => ({
    name: table.name.getText(file).replace(/["']/g, ''),
    columns: member(table.type, 'Row').type.members.map((column) => column.name.getText(file).replace(/["']/g, '')),
  }));
}

export function compareSchema(snapshot, contract) {
  if (snapshot?.format_version !== 1 || !['tables', 'columns', 'policies', 'triggers', 'functions', 'constraints', 'storage_buckets'].every((k) => Array.isArray(snapshot[k]))) {
    throw new Error('Invalid snapshot. Use supabase/audit/export-schema.sql and save its JSON snapshot cell.');
  }
  const errors = [];
  const review = [];
  // Include tables omitted from hand-maintained application types.
  for (const table of snapshot.tables) {
    if (table.schema === 'public' && ['r', 'p', undefined].includes(table.kind) && !table.rls_enabled) {
      errors.push(`RLS disabled: public.${table.name}`);
    }
  }
  for (const expected of contract) {
    const table = snapshot.tables.find((t) => t.schema === 'public' && t.name === expected.name);
    if (!table) {
      errors.push(`Missing table: public.${expected.name}`);
      continue;
    }
    const columns = new Set(snapshot.columns.filter((c) => c.schema === 'public' && c.table_name === expected.name).map((c) => c.name));
    for (const name of expected.columns) if (!columns.has(name)) errors.push(`Missing column: public.${expected.name}.${name}`);
  }
  for (const [table, name] of [
    ['profiles', 'user_id'], ['listing', 'clerk_user_id'], ['orders', 'user_id'],
    ['producer_requests', 'user_id'], ['listing_claim_requests', 'clerk_user_id'],
  ]) {
    const column = snapshot.columns.find((c) => c.schema === 'public' && c.table_name === table && c.name === name);
    if (column && !/^(text|character varying(?:\(\d+\))?)$/.test(column.data_type)) {
      errors.push(`Clerk ID must support user_… strings: public.${table}.${name}`);
    }
  }
  for (const policy of snapshot.policies) {
    if (policy.schema === 'public' && /auth\.uid\s*\(/i.test(`${policy.qual ?? ''} ${policy.with_check ?? ''}`)) {
      errors.push(`UUID auth.uid() in Clerk policy: public.${policy.table_name}.${policy.name}`);
    }
  }
  if (!snapshot.triggers.some((t) => t.schema === 'public' && t.table_name === 'producer_requests' && ['O', 'A'].includes(t.enabled) && t.function_name === 'handle_producer_request_approval')) {
    review.push('producer_requests: the approval trigger named by the API is absent/disabled/renamed; inspect equivalent behavior before any migration');
  }
  if (snapshot.triggers.some((t) => t.function_name === 'protect_claimed_listing' && ['O', 'A'].includes(t.enabled))) {
    review.push('protect_claimed_listing is active: inspect its function body; the historical version also blocks owner edits');
  }
  if (!snapshot.storage_buckets.some((b) => b.id === 'listingImages')) errors.push('Missing Storage bucket: listingImages');
  if (!snapshot.tables.some((t) => t.schema === 'storage' && t.name === 'objects' && t.rls_enabled)) errors.push('Storage objects RLS missing or disabled');
  if (!snapshot.policies.some((p) => p.schema === 'storage' && p.table_name === 'objects')) review.push('No Storage objects policies exported; verify authenticated owner uploads');
  review.push('Inspect all policies, grants, enum values, constraints and SECURITY DEFINER functions; column presence alone does not validate permissions or behavior');
  review.push('Test visitor, user A, user B and admin with real Clerk JWTs in an isolated environment');
  return { errors, review };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    if (!process.argv[2]) throw new Error('Usage: npm run schema:check -- private-audit/schema.json');
    let snapshot = JSON.parse(readFileSync(process.argv[2], 'utf8'));
    // Accept SQL Editor JSON export [{snapshot: {...}}] as well as the JSON cell.
    if (Array.isArray(snapshot) && snapshot.length === 1) snapshot = snapshot[0].snapshot;
    if (typeof snapshot === 'string') snapshot = JSON.parse(snapshot);
    const source = readFileSync(new URL('../lib/types/database.ts', import.meta.url), 'utf8');
    const result = compareSchema(snapshot, readCodeContract(source));
    for (const message of result.errors) console.error(`MISMATCH ${message}`);
    for (const message of result.review) console.warn(`REVIEW ${message}`);
    console.info(`${result.errors.length} structural mismatch(es). This is NOT a security certification or a migration.`);
    process.exitCode = result.errors.length ? 1 : 0;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
