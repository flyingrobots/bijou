#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { cleanEnvironment } from './constants.mjs';
// Trusted orchestration only. The session performs no host tests or builds.
const root = fileURLToPath(new URL('../../', import.meta.url));
const args = process.argv.slice(2);
// Hook-selected indexes are capture inputs, never inherited Git authority.
if (process.env.GIT_INDEX_FILE) args.unshift('--source-index', resolve(process.cwd(), process.env.GIT_INDEX_FILE));
if (process.env.BIJOU_FULL_PUSH === '1') args.unshift('--full-push');
if (!args.includes('--') || args.indexOf('--') === args.length - 1) {
  console.error('Usage: node scripts/docker-seal/run.mjs [--isolated-ci] [--node-version 20|22|24] [--export relative/path] -- command args...');
  process.exit(2);
}
const env = { ...cleanEnvironment() };
for (const key of ['GITHUB_ACTIONS', 'RUNNER_TEMP', 'RUNNER_ENVIRONMENT', 'GITHUB_RUN_ID', 'GITHUB_JOB']) {
  if (process.env[key]) env[key] = process.env[key];
}
// The session is spawned directly. Exclusivity does not need a lock tool: the
// worker container has a fixed name and startWorker() refuses a second run. A
// caller that wants to queue wraps this command in a lock of its own choosing.
const invocation = [process.execPath, resolve(root, 'scripts/docker-seal/session.mjs'), ...args];
const result = spawnSync(invocation[0], invocation.slice(1), { cwd: root, stdio: 'inherit', env });
process.exitCode = result.status ?? 2;
