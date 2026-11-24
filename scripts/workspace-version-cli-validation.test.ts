import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { readJsonObject } from './release-metadata.part01.js';
import { validateWorkspaceVersion } from './release-metadata.js';
import { cleanupWorkspaces, makeLockedWorkspace, runVersion } from './workspace-lock.test-support.js';

afterEach(cleanupWorkspaces);

const FILES = ['package.json', 'package-lock.json', 'bench/package.json',
  'packages/core/package.json', 'packages/node/package.json', 'packages/tui/package.json'];

function snapshot(root: string): Map<string, Buffer | undefined> {
  return new Map(FILES.map((path) => [path, existsSync(join(root, path)) ? readFileSync(join(root, path)) : undefined]));
}

const LEADING_ZERO = ['01.0.0', '1.00.0', '1.0.01', '1.0.0-rc.01', '1.0.0-beta.00', '1.0.0-alpha.007'];
const OTHER_MALFORMED = ['1.0', '1', 'v1.0.0', '1.0.0-rc', '1.0.0-rc.', '1.0.0-rc.1.2', '1.0.0-dev.1',
  '1.0.0-rc.1+build.5', '1.0.0+build.5', '1.0.0-', '-1.0.0', '1.0.0 ', '1.0.-1', 'a.b.c'];

describe('version CLI applies the canonical SemVer integer rule', () => {
  it.each([...LEADING_ZERO, ...OTHER_MALFORMED])('rejects %j before any write', (version) => {
    const root = makeLockedWorkspace();
    const before = snapshot(root);
    const result = runVersion(root, version);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('invalid semver');
    expect(result.stdout).not.toContain('Bumping');
    expect(result.stdout).not.toContain('Done. Recommended next steps:');
    expect(snapshot(root)).toEqual(before);
    expect(existsSync(join(root, 'node_modules'))).toBe(false);
  });

  it.each(['0.0.0', '10.20.30', '2.0.0-alpha.0', '2.0.0-beta.10', '2.0.0-rc.1'])('still accepts %s', (version) => {
    const root = makeLockedWorkspace();
    const result = runVersion(root, version);
    expect(result.status, result.stdout + result.stderr).toBe(0);
    expect(readJsonObject(join(root, 'packages/core/package.json'))).toMatchObject({ version });
    expect(validateWorkspaceVersion(root, version).errors).toEqual([]);
  }, 60_000);
});
