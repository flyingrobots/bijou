#!/usr/bin/env node
// Build only the immutable toolchain marker layer. No source or dependencies enter it.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { isGitHubHostedJob } from './github-hosted.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const args = process.argv.slice(2);
const isolated = args.includes('--isolated-ci');
if (isolated) {
  if (!isGitHubHostedJob()) throw new Error('Bootstrap CI mode requires an exclusive GitHub-hosted job VM');
  await import('./bootstrap-owned.mjs');
} else {
// Spawned directly, with no lock tool: a caller that wants admission control
// wraps this command itself.
const result = spawnSync(process.execPath, ['scripts/docker-seal/bootstrap-owned.mjs', ...args], {
  cwd: root, stdio: 'inherit',
  env: Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('GIT_'))),
});
process.exitCode = result.status ?? 2;
}
