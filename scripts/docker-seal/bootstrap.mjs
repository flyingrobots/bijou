#!/usr/bin/env node
// Build only the immutable toolchain marker layer. No source or dependencies enter it.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { isAbsolute } from 'node:path';

const root = fileURLToPath(new URL('../../', import.meta.url));
const args = process.argv.slice(2);
const isolated = args.includes('--isolated-ci');
if (isolated) {
  if (process.env.GITHUB_ACTIONS !== 'true' || process.env.RUNNER_ENVIRONMENT !== 'github-hosted' ||
      !isAbsolute(process.env.RUNNER_TEMP ?? '') || !existsSync(process.env.RUNNER_TEMP) ||
      !/^\d+$/u.test(process.env.GITHUB_RUN_ID ?? '')) throw new Error('Bootstrap CI mode requires an exclusive GitHub-hosted job VM');
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
