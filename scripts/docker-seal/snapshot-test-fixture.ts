import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { captureSnapshot } from './snapshot.mjs';

/** Real temporary repositories inside the already admitted Docker filesystem. */
export function repositoryFixture() {
  const root = mkdtempSync(join(tmpdir(), 'seal-repository-'));
  const owned = [root];
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('GIT_')));
  Object.assign(env, { GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null' });
  const git = (cwd: string, ...args: string[]): string => execFileSync('git', args, {
    cwd, env, encoding: 'utf8', timeout: 10_000, stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
  git(root, 'init', '-q', '-b', 'topic-seal');
  git(root, 'config', 'user.name', 'sealed fixture');
  git(root, 'config', 'user.email', 'fixture@example.invalid');
  writeFileSync(join(root, 'data.txt'), 'committed\n');
  git(root, 'add', 'data.txt');
  git(root, 'commit', '-qm', 'fixture base');
  return {
    root, git,
    async capture(input = Buffer.alloc(0), sourceIndex?: string, fullPush = false) {
      // The host entrypoint checks host storage; these fixtures are already
      // inside hard-capped tmpfs and measure the real VM backing filesystem.
      const snapshot = await captureSnapshot(root, ['node', '-e', 'process.exit(0)'], input,
        { measurementPath: '/', fullPush, ...(sourceIndex === undefined ? {} : { sourceIndex }) });
      owned.push(snapshot.directory);
      return snapshot;
    },
    cleanup() { for (const path of owned) rmSync(path, { recursive: true, force: true }); },
  };
}
