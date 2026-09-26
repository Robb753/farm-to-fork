const { spawnSync } = require('node:child_process');

const CLERK_DOMAIN = 'humane-buffalo-60.clerk.accounts.dev';

// Only literal loopback origins; no DNS aliases, credentials, paths or redirects.
function localOrigin(value, port) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' || !['localhost', '127.0.0.1'].includes(url.hostname)
      || url.port !== String(port) || url.username || url.password
      || url.pathname !== '/' || url.search || url.hash) return null;
    return `http://127.0.0.1:${port}`;
  } catch { return null; }
}

function validateLocalEnvironment(env, status) {
  const errors = [];
  for (const name of ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_URL']) {
    if (!localOrigin(env[name], 54321)) errors.push(`${name}: expected local Supabase HTTP port 54321`);
  }
  for (const name of ['NEXT_PUBLIC_APP_URL', 'NEXT_PUBLIC_SITE_URL']) {
    if (env[name] !== 'http://localhost:3000') errors.push(`${name}: expected http://localhost:3000`);
  }
  const publicKey = env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';
  let domain;
  if (publicKey.startsWith('pk_test_')) domain = Buffer.from(publicKey.slice(8), 'base64').toString();
  if (domain !== `${CLERK_DOMAIN}$`) errors.push('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: expected the existing Clerk Development instance');
  if (!env.CLERK_SECRET_KEY?.startsWith('sk_test_')) errors.push('CLERK_SECRET_KEY: expected a Development secret key');
  for (const name of ['NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY']) {
    if (!env[name]) errors.push(`${name}: missing local stack key`);
  }
  if (env.NEXT_PUBLIC_ALLOW_VERCEL_PREVIEWS === 'true') errors.push('NEXT_PUBLIC_ALLOW_VERCEL_PREVIEWS: must be false locally');
  if (env.NEXT_PUBLIC_VERCEL_URL) errors.push('NEXT_PUBLIC_VERCEL_URL: must be unset locally');
  if (status) {
    if (!localOrigin(status.API_URL, 54321)) errors.push('Supabase status: unexpected API target');
    for (const [name, field] of [
      ['NEXT_PUBLIC_SUPABASE_ANON_KEY', 'ANON_KEY'],
      ['SUPABASE_SERVICE_ROLE_KEY', 'SERVICE_ROLE_KEY'],
      ...(env.SUPABASE_ANON_KEY ? [['SUPABASE_ANON_KEY', 'ANON_KEY']] : []),
    ]) {
      if (!status[field] || env[name] !== status[field]) errors.push(`${name}: does not match the running LOCAL stack`);
    }
  }
  return errors;
}

function readLocalStatus() {
  // Fixed read-only command. Never accepts project-ref, linked, db-url or user arguments.
  const result = spawnSync(process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['--yes', 'supabase@2.117.0', 'status', '-o', 'json'], {
      encoding: 'utf8', timeout: 60000, windowsHide: true,
      shell: process.platform === 'win32',
    });
  // CLI stdout contains local keys; neither stdout, stderr nor spawn errors are logged.
  if (result.error || result.status !== 0) throw new Error('Local Supabase status unavailable. Start Docker and the local stack; no remote fallback is allowed.');
  try { return JSON.parse(result.stdout); }
  catch { throw new Error('Local Supabase status is not valid JSON. No server started.'); }
}

function assertLocalEnvironment(env) {
  // Reject unsafe URLs BEFORE invoking even the read-only CLI.
  let errors = validateLocalEnvironment(env);
  if (!errors.length) errors = validateLocalEnvironment(env, readLocalStatus());
  if (errors.length) throw new Error(`Local development refused:\n${errors.join('\n')}`);
}

function supabaseNetworkConfig(value, development) {
  let url;
  try { url = new URL(value); } catch { throw new Error('NEXT_PUBLIC_SUPABASE_URL: invalid URL'); }
  if (development && !localOrigin(value, 54321)) throw new Error('Development Supabase must use loopback port 54321');
  const localSources = ['http://127.0.0.1:54321', 'http://localhost:54321'];
  return {
    imagePattern: { protocol: url.protocol.slice(0, -1), hostname: url.hostname, port: url.port, pathname: '/storage/v1/object/public/**' },
    imageSources: development ? localSources : [url.origin],
    connectSources: development
      ? [...localSources, 'ws://127.0.0.1:54321', 'ws://localhost:54321']
      : ['https://*.supabase.co', 'wss://*.supabase.co'],
  };
}

module.exports = { CLERK_DOMAIN, localOrigin, validateLocalEnvironment, readLocalStatus, assertLocalEnvironment, supabaseNetworkConfig };
