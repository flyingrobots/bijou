import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { runDebtGitFixture } from './dogfood-debt-git-fixture.js';

// Control-repository setup must itself be independent of any enclosing hook.
const controlEnvironment = Object.fromEntries(
  Object.entries(process.env).filter(([name]) => !name.startsWith('GIT_')),
);
const git = (cwd: string, args: readonly string[]): string => execFileSync('git', [...args], {
  cwd, env: controlEnvironment, encoding: 'utf8', timeout: 5_000, stdio: ['ignore', 'pipe', 'pipe'],
});
const digest = (path: string): string => createHash('sha256').update(readFileSync(path)).digest('hex');

function repositoryState(cwd: string) {
  return {
    head: git(cwd, ['rev-parse', 'HEAD']).trim(),
    config: digest(resolve(cwd, git(cwd, ['rev-parse', '--git-common-dir']).trim(), 'config')),
    index: digest(resolve(cwd, git(cwd, ['rev-parse', '--git-path', 'index']).trim())),
  };
}

describe('debt Git fixture containment', () => {
  it.each(['git-dir', 'common-dir-and-index'] as const)('does not mutate an enclosing repository via %s', (locator) => {
    const workspace = repositoryState(process.cwd());
    const parent = mkdtempSync(join(tmpdir(), 'bijou-debt-parent-'));
    try {
      git(parent, ['init', '-q']);
      git(parent, ['config', 'user.name', 'Parent fixture']);
      git(parent, ['config', 'user.email', 'parent@example.invalid']);
      git(parent, ['config', 'commit.gpgsign', 'false']);
      writeFileSync(join(parent, 'sentinel.txt'), 'parent content\n');
      git(parent, ['add', '.']);
      git(parent, ['commit', '-qm', 'parent sentinel']);
      const before = repositoryState(parent);
      const environment = {
        ...controlEnvironment,
        GIT_DIR: join(parent, '.git'),
        ...(locator === 'common-dir-and-index' ? {
          GIT_COMMON_DIR: join(parent, '.git'),
          GIT_INDEX_FILE: join(parent, '.git', 'index'),
        } : {}),
      };
      const result = runDebtGitFixture(
        { 'examples/docs/fixture.ts': ['Keep copy', 'Remove copy'] },
        { 'examples/docs/fixture.ts': ['Keep copy'] },
        environment,
      );
      expect(repositoryState(parent)).toEqual(before);
      expect(result).toEqual({ exitCode: 0, stderr: '' });
    } finally {
      rmSync(parent, { recursive: true, force: true });
      expect(repositoryState(process.cwd())).toEqual(workspace);
    }
  });

  it('reports inherited Git locator names without disclosing their values', () => {
    const names = execFileSync('git', ['rev-parse', '--local-env-vars'], { encoding: 'utf8', timeout: 5_000 })
      .trim().split('\n');
    expect(names).toContain('GIT_DIR');
    process.stdout.write(`debt-fixture inherited Git variable names: ${names.filter((name) => process.env[name] !== undefined).join(', ') || '(none)'}\n`);
  });
});
