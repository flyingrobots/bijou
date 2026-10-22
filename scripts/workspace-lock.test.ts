import { readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { afterEach, describe, expect, it } from 'vitest';
import { runReleaseMetadata, validateWorkspaceVersion } from './release-metadata.js';
import { readJsonObject } from './release-metadata.part01.js';
import { cleanupWorkspaces, fixtureEnvironment, makeLockedWorkspace, patchLockedPackage, prepareHook, writeJson } from './workspace-lock.test-support.js';

afterEach(cleanupWorkspaces);

describe('workspace lock-step contract', () => {
  it('accepts an aligned npm workspace lock', () => {
    expect(validateWorkspaceVersion(makeLockedWorkspace(), '1.0.0').errors).toEqual([]);
  });

  it('rejects a stale lock version even while every manifest agrees', () => {
    const root = makeLockedWorkspace();
    writeJson(root, 'package-lock.json', {
      lockfileVersion: 3, packages: { '': {}, 'packages/core': { version: '0.9.0' } },
    });
    expect(validateWorkspaceVersion(root, '1.0.0').errors.join('\n')).toContain('package-lock.json');
  });

  it('rejects missing, malformed and legacy locks', () => {
    for (const lock of [undefined, {}, { lockfileVersion: 1, dependencies: {} }]) {
      const root = makeLockedWorkspace();
      if (lock === undefined) rmSync(join(root, 'package-lock.json'));
      else writeJson(root, 'package-lock.json', lock);
      expect(validateWorkspaceVersion(root, '1.0.0').errors.join('\n')).toContain('package-lock.json');
    }
  });

  it('does not emit successful release outputs for a stale lock', () => {
    const root = makeLockedWorkspace();
    writeJson(root, 'package-lock.json', { lockfileVersion: 3, packages: {} });
    const output = join(root, 'release-output');
    expect(runReleaseMetadata(['--current-version', '--github-output', output], {
      cwd: root, stdout: () => undefined, stderr: () => undefined,
    })).toBe(1);
    expect(() => readFileSync(output)).toThrow();
  });

  it.each([
    { path: 'packages/node', group: 'dependencies', name: '@flyingrobots/bijou' },
    { path: 'packages/tui', group: 'peerDependencies', name: '@flyingrobots/bijou' },
    { path: 'bench', group: 'devDependencies', name: '@flyingrobots/bijou-node' },
    { path: 'bench', group: 'optionalDependencies', name: '@flyingrobots/bijou' },
  ])('rejects stale $group in $path', ({ path, group, name }) => {
    const root = makeLockedWorkspace();
    patchLockedPackage(root, path, { [group]: { [name]: '0.9.0' } });
    expect(validateWorkspaceVersion(root, '1.0.0').errors.join('\n')).toContain(`${path} ${group} ${name}`);
  });

  it.each([{}, { '@flyingrobots/bijou': '1.0.0', '@flyingrobots/bijou-ghost': '1.0.0' }])(
    'rejects missing and unknown internal lock pins', (dependencies) => {
      const root = makeLockedWorkspace();
      patchLockedPackage(root, 'packages/node', { dependencies });
      expect(validateWorkspaceVersion(root, '1.0.0').errors.join('\n')).toContain('package-lock.json');
    },
  );

  it('checks root internal pins as well as workspace pins', () => {
    const root = makeLockedWorkspace();
    const manifest = readJsonObject(join(root, 'package.json'));
    manifest['dependencies'] = { '@flyingrobots/bijou': '1.0.0' };
    writeJson(root, 'package.json', manifest);
    patchLockedPackage(root, '', { dependencies: { '@flyingrobots/bijou': '1.0.0' } });
    expect(validateWorkspaceVersion(root, '1.0.0').errors).toEqual([]);
    patchLockedPackage(root, '', { dependencies: { '@flyingrobots/bijou': '0.9.0' } });
    expect(validateWorkspaceVersion(root, '1.0.0').errors.join('\n')).toContain('root dependencies');
  });

  it('fails the actual pre-commit hook with a lock-specific diagnostic', () => {
    const root = makeLockedWorkspace();
    writeJson(root, 'package-lock.json', { lockfileVersion: 3, packages: {} });
    const result = spawnSync('bash', [prepareHook(root)], { cwd: root, env: fixtureEnvironment(), encoding: 'utf8', timeout: 30_000 });
    expect(result.status).not.toBe(0);
    expect(result.stdout + result.stderr).toContain('package-lock.json');
  });
});
