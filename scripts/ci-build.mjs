import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { once } from 'node:events';

// A compilation/prerender check only. No auth bypass or fixture branch in app code.
// Refuse local credentials: Next also reads .env files in child processes.
if (readdirSync('.').some((name) => /^\.env(?:\.|$)/.test(name) && name !== '.env.example')) {
  throw new Error('build:ci requires a clean checkout without .env files. Use npm run build for a configured environment.');
}
if (existsSync('.clerk')) throw new Error('build:ci requires a checkout without local Clerk configuration.');
if (process.env.VERCEL) throw new Error('build:ci must never be used as the Vercel deployment build.');

const unexpected = [];
const server = createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (req.method !== 'GET' || url.pathname !== '/rest/v1/listing') {
    unexpected.push(`${req.method} ${url.pathname}`);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Unexpected CI fixture request' }));
    return;
  }
  res.writeHead(200, { 'Content-Type': 'application/json', 'Content-Range': '*/0' });
  res.end('[]');
});
server.listen(0, '127.0.0.1');
await once(server, 'listening');

const url = `http://127.0.0.1:${server.address().port}`;
// Remove provider settings from the child environment, including public variants.
const env = Object.fromEntries(Object.entries(process.env).filter(([name]) =>
  !/^(NEXT_PUBLIC_|SUPABASE_|CLERK_|RESEND_|TWILIO_|INSEE_|ANTHROPIC_|VERCEL|GOOGLE_VERIFICATION)/.test(name)
));
Object.assign(env, {
  NODE_ENV: 'production',
  NEXT_TELEMETRY_DISABLED: '1',
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
  NEXT_PUBLIC_SUPABASE_URL: url,
  SUPABASE_URL: url,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'ci-public-fixture-not-a-real-key',
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: `pk_test_${Buffer.from('clerk-ci.example.invalid$').toString('base64')}`,
  NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: 'pk.ci-fixture-not-a-real-token',
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: '/sign-in',
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: '/sign-up',
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: '/explore',
  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: '/welcome',
  NEXT_PUBLIC_TWILIO_ENABLED: 'false',
});

console.info('CI build: empty local database fixture, fake public keys, no provider secrets. Do not deploy this output.');
const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'build'], { stdio: 'inherit', env });
const stop = (signal) => child.kill(signal);
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
try {
  const [code] = await once(child, 'exit');
  if (unexpected.length) console.error('Unexpected fixture requests:', unexpected.join(', '));
  process.exitCode = code === 0 && unexpected.length === 0 ? 0 : 1;
} finally {
  server.closeAllConnections();
  server.close();
  process.off('SIGINT', stop);
  process.off('SIGTERM', stop);
}
