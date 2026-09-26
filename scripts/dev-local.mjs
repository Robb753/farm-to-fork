import nextEnv from '@next/env';
import { spawn } from 'node:child_process';
import local from './local-environment.cjs';

// Explicit Development loading: existing shell variables still take precedence and
// are validated too. Never print parsed environment values or provider errors.
process.env.NODE_ENV = 'development';
nextEnv.loadEnvConfig(process.cwd(), true, { info() {}, error() {} });
try {
  local.assertLocalEnvironment(process.env);
  if (process.argv.length > 2) throw new Error('npm run dev uses localhost:3000; additional CLI arguments are not supported.');
  const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '--hostname', 'localhost', '--port', '3000'], {
    stdio: 'inherit', env: process.env,
  });
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
  child.on('error', () => { console.error('Local Next.js process failed to start.'); process.exitCode = 1; });
  child.on('exit', (code) => { process.exitCode = code ?? 1; });
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
