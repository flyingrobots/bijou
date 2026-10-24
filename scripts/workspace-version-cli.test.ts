import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { afterEach, describe, expect, it } from 'vitest';
import { readJsonObject } from './release-metadata.part01.js';
import { validateWorkspaceVersion } from './release-metadata.js';
import { cleanupWorkspaces, makeLockedWorkspace, runVersion, writeJson } from './workspace-lock.test-support.js';

afterEach(cleanupWorkspaces);

describe('version CLI owns manifest and lock agreement', () => {
  it('updates stable and prerelease locks that npm ci can install', () => {
    const root = makeLockedWorkspace();
    const manifest = readJsonObject(join(root, 'package.json'));
    manifest['scripts'] = { preinstall: 'node -e "process.exit(73)"' };
    manifest['dependencies'] = { '@flyingrobots/bijou': '1.0.0' };
    writeJson(root, 'package.json', manifest);
    for (const version of ['2.0.0-rc.1', '2.0.0']) {
      const result = runVersion(root, version);
      expect(result.status, result.stdout + result.stderr).toBe(0);
      expect(readJsonObject(join(root, 'package-lock.json'))).toMatchObject({ packages: {
        '': { dependencies: { '@flyingrobots/bijou': version } },
        'packages/core': { version },
        'packages/node': { version, dependencies: { '@flyingrobots/bijou': version } },
        'packages/tui': { version, peerDependencies: { '@flyingrobots/bijou': version } },
        bench: { version, optionalDependencies: { '@flyingrobots/bijou': version },
          devDependencies: { '@flyingrobots/bijou-node': version } },
      } });
      expect(validateWorkspaceVersion(root, version).errors).toEqual([]);
      expect(existsSync(join(root, 'node_modules'))).toBe(false);
    }
    const installed = spawnSync('npm ci --offline --ignore-scripts --no-audit --no-fund', {
      cwd: root, shell: true, encoding: 'utf8', timeout: 30_000,
    });
    expect(installed.status, installed.stdout + installed.stderr).toBe(0);
  }, 60_000);

  it.each([true, false])('restores exact input bytes on npm failure (existing lock: %s)', (hasLock) => {
    const root = makeLockedWorkspace();
    const manifest = readJsonObject(join(root, 'package.json'));
    manifest['dependencies'] = { '@fixture/unresolvable': 'not a valid version' };
    writeJson(root, 'package.json', manifest);
    if (!hasLock) rmSync(join(root, 'package-lock.json'));
    const originals = new Map(['package.json', 'package-lock.json', 'bench/package.json',
      'packages/core/package.json', 'packages/node/package.json', 'packages/tui/package.json']
      .map((path) => [path, existsSync(join(root, path)) ? readFileSync(join(root, path)) : undefined] as const));
    const result = runVersion(root, '2.0.0');
    expect(result.status).not.toBe(0);
    expect(result.stdout).not.toContain('Done. Recommended next steps:');
    for (const [path, bytes] of originals) {
      if (bytes === undefined) expect(existsSync(join(root, path))).toBe(false);
      else expect(readFileSync(join(root, path))).toEqual(bytes);
    }
  }, 60_000);

  it('creates a lock when starting without one', () => {
    const root = makeLockedWorkspace();
    rmSync(join(root, 'package-lock.json'));
    const result = runVersion(root, '2.0.0');
    expect(result.status, result.stdout + result.stderr).toBe(0);
    expect(validateWorkspaceVersion(root, '2.0.0').errors).toEqual([]);
  }, 60_000);
});
