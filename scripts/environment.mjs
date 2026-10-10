import nextEnv from '@next/env';
import { pathToFileURL } from 'node:url';

// Return names and diagnoses only. Never include key/token values in output.
export function validateEnvironment(env, runtime = false) {
  const errors = [];
  const warnings = [];
  const required = [
    'NEXT_PUBLIC_APP_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN',
    ...(runtime ? ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'CLERK_SECRET_KEY'] : []),
  ];
  for (const name of required) {
    if (!env[name]?.trim()) errors.push(`${name}: missing`);
  }

  const urls = new Map();
  for (const name of ['NEXT_PUBLIC_APP_URL', 'NEXT_PUBLIC_SITE_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_URL']) {
    if (!env[name]?.trim()) continue;
    try {
      const url = new URL(env[name]);
      if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
        throw new Error('Expected an origin');
      }
      if (url.hostname.endsWith('.invalid')) throw new Error('Fixture hostname');
      urls.set(name, url.origin);
    } catch {
      errors.push(`${name}: expected a real HTTP(S) origin without credentials, path or query`);
    }
  }
  for (const [a, b] of [
    ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_URL'],
    ['NEXT_PUBLIC_APP_URL', 'NEXT_PUBLIC_SITE_URL'],
  ]) {
    if (urls.has(a) && urls.has(b) && urls.get(a) !== urls.get(b)) {
      errors.push(`${a} / ${b}: different origins`);
    }
  }

  const publicKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (publicKey) {
    if (publicKey.startsWith('sb_secret_')) {
      errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY: a secret key must never be public');
    } else if (!publicKey.startsWith('sb_publishable_')) {
      try {
        // Inspection only, not signature verification or an authentication check.
        const payload = JSON.parse(Buffer.from(publicKey.split('.')[1], 'base64url').toString());
        if (payload.role !== 'anon') throw new Error('Not anon');
      } catch {
        errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY: expected an anon JWT or publishable key');
      }
    }
  }
  const clerkKey = env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (clerkKey) {
    try {
      if (!/^pk_(test|live)_/.test(clerkKey)) throw new Error('Not public');
      const domain = Buffer.from(clerkKey.replace(/^pk_(test|live)_/, ''), 'base64').toString();
      if (!/^[a-zA-Z0-9.-]+\$$/.test(domain) || domain.endsWith('.invalid$')) throw new Error('Invalid domain');
    } catch {
      errors.push('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: invalid publishable key or CI fixture');
    }
  }
  if (env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN && !env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN.startsWith('pk.')) {
    errors.push('NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: expected a public pk. token');
  }
  if (clerkKey && env.CLERK_SECRET_KEY) {
    const expectedPrefix = clerkKey.startsWith('pk_live_') ? 'sk_live_' : 'sk_test_';
    if (!env.CLERK_SECRET_KEY.startsWith(expectedPrefix)) errors.push('CLERK_SECRET_KEY: does not match the publishable key environment');
  }
  if (runtime) {
    if (!env.NEXT_PUBLIC_SITE_URL) warnings.push('NEXT_PUBLIC_SITE_URL: unset; existing email URLs use fallbacks');
    for (const name of ['RESEND_API_KEY', 'INSEE_API_KEY', 'ANTHROPIC_API_KEY']) {
      if (!env[name]) warnings.push(`${name}: unset; the corresponding email, claim or suggestion feature will not work`);
    }
    if (env.NEXT_PUBLIC_TWILIO_ENABLED === 'true') {
      for (const name of ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER']) {
        if (!env[name]) errors.push(`${name}: required when SMS is enabled`);
      }
    }
    if (env.NEXT_PUBLIC_ALLOW_VERCEL_PREVIEWS === 'true') warnings.push('NEXT_PUBLIC_ALLOW_VERCEL_PREVIEWS: current code accepts every vercel.app origin; keep false');
  }
  return { errors, warnings };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  nextEnv.loadEnvConfig(process.cwd(), process.argv.includes('--development'));
  const result = validateEnvironment(process.env, process.argv.includes('--runtime'));
  for (const message of result.warnings) console.warn(`WARNING ${message}`);
  for (const message of result.errors) console.error(`ERROR ${message}`);
  if (result.errors.length) process.exitCode = 1;
  else console.info('Configuration shape is valid. Provider access, JWT signatures and database permissions are NOT verified.');
}
