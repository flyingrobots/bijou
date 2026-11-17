#!/usr/bin/env node
// Public command boundary: the host snapshots inputs; only the seal executes work.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = fileURLToPath(new URL('../../', import.meta.url));
const args = process.argv.slice(2);
const build = args[0] === '--build';
if (build) args.shift();
if (args.shift() !== '--' || args.length === 0) {
  console.error('Usage: node scripts/docker-seal/dispatch.mjs [--build] -- command [args...]');
  process.exit(2);
}

function run(command, commandArgs) {
  if (process.platform === 'win32') {
    const cli = {
      npm: join(dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js'),
      vitest: join(root, 'node_modules/vitest/vitest.mjs'),
      tsx: join(root, 'node_modules/tsx/dist/cli.mjs'),
    }[command];
    if (cli) { command = process.execPath; commandArgs = [cli, ...commandArgs]; }
  }
  const result = spawnSync(command, commandArgs, { cwd: root, stdio: 'inherit' });
  if (result.error) {
    console.error(`Cannot start sealed command: ${result.error.message}`);
    process.exit(1);
  }
  if (result.signal) {
    process.kill(process.pid, result.signal);
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (existsSync('/.dockerenv') || (process.platform === 'win32' && existsSync('C:\\bijou-test-seal'))) {
  await import('./require-docker.mjs');
  if (build) run('npm', ['run', 'build']);
  run(args[0], args.slice(1));
} else {
  run(process.execPath, [
    process.platform === 'win32' ? 'scripts/docker-seal/windows.mjs' : 'scripts/docker-seal/run.mjs', '--', 'node',
    'scripts/docker-seal/dispatch.mjs', ...(build ? ['--build'] : []), '--', ...args,
  ]);
}
