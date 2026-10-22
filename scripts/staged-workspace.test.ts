import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanupWorkspaces, fixtureGit, makeLockedWorkspace, patchLockedPackage, prepareHook } from './workspace-lock.test-support.js';

afterEach(cleanupWorkspaces);

function runCheck(root: string, script = 'check-staged-workspace.ts', env: NodeJS.ProcessEnv = {}) {
  return spawnSync(process.execPath, ['--import', 'tsx', `scripts/${script}`,
    ...(script === 'release-metadata.ts' ? ['--current-version'] : [])], {
    cwd: root, encoding: 'utf8', timeout: 15_000, env: { ...process.env, ...env },
  });
}

describe('pre-commit validates the index metadata', () => {
  it('rejects a stale staged lock even when the working copy has been repaired', () => {
    const root = makeLockedWorkspace();
    const lock = join(root, 'package-lock.json');
    const good = readFileSync(lock);
    patchLockedPackage(root, 'packages/core', { version: '0.9.0' });
    const hook = prepareHook(root);
    writeFileSync(lock, good);
    const working = runCheck(root, 'release-metadata.ts');
    expect(working.status, working.stdout + working.stderr).toBe(0);
    const result = spawnSync('bash', [hook], { cwd: root, encoding: 'utf8', timeout: 15_000 });
    expect(result.status).not.toBe(0);
    expect(result.stdout + result.stderr).toContain('package-lock.json packages/core version (0.9.0)');
  });

  it('accepts valid staged metadata while unrelated working-copy metadata differs', () => {
    const root = makeLockedWorkspace();
    prepareHook(root);
    patchLockedPackage(root, 'packages/core', { version: '0.9.0' });
    const staged = fixtureGit(root, ['ls-files', '--stage']);
    const working = readFileSync(join(root, 'package-lock.json'));
    const result = runCheck(root);
    expect(result.status, result.stdout + result.stderr).toBe(0);
    expect(fixtureGit(root, ['ls-files', '--stage'])).toBe(staged);
    expect(readFileSync(join(root, 'package-lock.json'))).toEqual(working);
  });

  it('rejects a lock deleted from the index even if it remains on disk', () => {
    const root = makeLockedWorkspace();
    prepareHook(root);
    fixtureGit(root, ['rm', '--cached', 'package-lock.json']);
    const result = runCheck(root);
    expect(result.status).not.toBe(0);
    expect(result.stdout + result.stderr).toContain('package-lock.json');
  });

  it('rejects a staged workspace manifest hidden by a repaired working copy', () => {
    const root = makeLockedWorkspace();
    const path = join(root, 'packages/core/package.json');
    const good = readFileSync(path);
    writeFileSync(path, JSON.stringify({ name: '@flyingrobots/bijou', version: '0.9.0' }));
    prepareHook(root);
    writeFileSync(path, good);
    const result = runCheck(root);
    expect(result.status).not.toBe(0);
    expect(result.stdout + result.stderr).toContain('Workspace version mismatch detected');
  });

  it('honors the alternate index used by Git commit operations', () => {
    const root = makeLockedWorkspace();
    prepareHook(root);
    const alternate = join(root, '.git', 'alternate-index');
    copyFileSync(join(root, '.git', 'index'), alternate);
    patchLockedPackage(root, 'packages/core', { version: '0.9.0' });
    fixtureGit(root, ['add', 'package-lock.json']);
    expect(runCheck(root).status).toBe(1);
    const result = runCheck(root, 'check-staged-workspace.ts', { GIT_INDEX_FILE: alternate });
    expect(result.status, result.stdout + result.stderr).toBe(0);
  });
});
