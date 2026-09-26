import { readFileSync, writeFileSync } from 'node:fs';
import { parse } from 'dotenv';
import { pathToFileURL } from 'node:url';
import local from './local-environment.cjs';

export function replaceLocalValues(text, values) {
  const remaining = new Map(Object.entries(values));
  const lines = text.split(/\r?\n/).flatMap(line => {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/);
    if (!match || !Object.hasOwn(values, match[1])) return [line];
    if (!remaining.has(match[1])) return []; // Remove duplicate assignments.
    const value = remaining.get(match[1]);
    remaining.delete(match[1]);
    return [`${match[1]}=${value}`];
  });
  return [...lines, ...[...remaining].map(([name, value]) => `${name}=${value}`)].join('\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    if (process.argv.length !== 2) throw new Error('No arguments accepted. This command configures only .env.local from the local stack.');
    const status = local.readLocalStatus();
    const text = readFileSync('.env.local', 'utf8');
    const values = {
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
      NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
      NEXT_PUBLIC_SUPABASE_URL: status.API_URL,
      SUPABASE_URL: status.API_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: status.ANON_KEY,
      SUPABASE_ANON_KEY: status.ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: status.SERVICE_ROLE_KEY,
      NEXT_PUBLIC_ALLOW_VERCEL_PREVIEWS: 'false',
      NEXT_PUBLIC_VERCEL_URL: '',
    };
    const errors = local.validateLocalEnvironment({ ...parse(text), ...values }, status);
    if (errors.length) throw new Error(errors.join('\n'));
    writeFileSync('.env.local', replaceLocalValues(text, values), { mode: 0o600 });
    console.info('Updated local URLs and LOCAL Supabase keys in .env.local. Clerk Development keys and unrelated settings preserved. No values displayed.');
    console.info('Shell variables can override this file; npm run dev will validate the effective configuration again.');
  } catch (error) {
    // File/CLI errors may contain paths, never file contents or provider credentials.
    console.error(error.code ? 'Cannot read/write .env.local. Prepare it with your existing Clerk Development keys first.' : error.message);
    process.exitCode = 1;
  }
}
