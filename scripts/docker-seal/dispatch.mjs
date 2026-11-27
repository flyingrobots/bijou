#!/usr/bin/env node
// Public command boundary: the host snapshots inputs; only the seal executes work.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const args = process.argv.slice(2);
const build = args[0] === '--build';
if (build) args.shift();
if (args.shift() !== '--' || args.length === 0) {
  console.error('Usage: node scripts/docker-seal/dispatch.mjs [--build] -- command [args...]');
  process.exit(2);
}

function run(command, commandArgs) {
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

if (existsSync('/.dockerenv')) {
  await import('./require-docker.mjs');
  if (build) run('npm', ['run', 'build']);
  run(args[0], args.slice(1));
} else {
  run(process.execPath, [
    'scripts/docker-seal/run.mjs', '--', 'node',
    'scripts/docker-seal/dispatch.mjs', ...(build ? ['--build'] : []), '--', ...args,
  ]);
}
