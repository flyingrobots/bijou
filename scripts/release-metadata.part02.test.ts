
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';

import { tmpdir } from 'node:os';

import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';
import { validateWorkspaceVersion } from './release-metadata.js';

const tempRoots: string[] = [];

function makeWorkspace(packages: {
  readonly dir: string;
  readonly name: string;
  readonly version: string;
  readonly dependencies?: Record<string, string>;
  readonly devDependencies?: Record<string, string>;
  readonly peerDependencies?: Record<string, string>;
}[], options?: {
  readonly workspaceRoot?: string;
  readonly workspacePatterns?: readonly string[];
}): string {
  const root = mkdtempSync(join(tmpdir(), 'bijou-release-meta-'));
  tempRoots.push(root);
  const workspaceRoot = options?.workspaceRoot ?? 'packages';
  const workspacePatterns = options?.workspacePatterns ?? [`${workspaceRoot}/*`];
  mkdirSync(join(root, workspaceRoot), { recursive: true });
  writeFileSync(
    join(root, 'package.json'),
    JSON.stringify(
      {
        name: 'bijou-release-meta-test',
        private: true,
        workspaces: workspacePatterns,
      },
      null,
      2,
    ),
    'utf8',
  );
  for (const pkg of packages) {
    const pkgDir = join(root, workspaceRoot, pkg.dir);
    mkdirSync(pkgDir, { recursive: true });
    writeFileSync(
      join(pkgDir, 'package.json'),
      JSON.stringify(
        {
          name: pkg.name,
          version: pkg.version,
          ...(pkg.dependencies ? { dependencies: pkg.dependencies } : {}),
          ...(pkg.devDependencies ? { devDependencies: pkg.devDependencies } : {}),
          ...(pkg.peerDependencies ? { peerDependencies: pkg.peerDependencies } : {}),
        },
        null,
        2,
      ),
      'utf8',
    );
  }
  return root;
}

afterEach(() => {
  while (tempRoots.length > 0) {
    const root = tempRoots.pop();
    if (root != null) rmSync(root, { recursive: true, force: true });
  }
});

describe('validateWorkspaceVersion', () => {
  it('accepts aligned workspace versions and internal pins', () => {
    const root = makeWorkspace([
      { dir: 'bijou', name: '@flyingrobots/bijou', version: '3.0.0' },
      {
        dir: 'bijou-tui',
        name: '@flyingrobots/bijou-tui',
        version: '3.0.0',
        dependencies: { '@flyingrobots/bijou': '3.0.0' },
        peerDependencies: { '@flyingrobots/bijou-node': '3.0.0' },
      },
      {
        dir: 'bijou-node',
        name: '@flyingrobots/bijou-node',
        version: '3.0.0',
        devDependencies: { '@flyingrobots/bijou': '3.0.0' },
      },
    ]);
    expect(validateWorkspaceVersion(root, '3.0.0').errors).toEqual([]);
  });
  it('reports mismatched peer dependency pins', () => {
    const root = makeWorkspace([
      { dir: 'bijou', name: '@flyingrobots/bijou', version: '3.0.0' },
      {
        dir: 'bijou-node',
        name: '@flyingrobots/bijou-node',
        version: '3.0.0',
        peerDependencies: { '@flyingrobots/bijou': '^3.0.0' },
      },
    ]);
    expect(validateWorkspaceVersion(root, '3.0.0').errors).toEqual([
      '@flyingrobots/bijou-node has @flyingrobots/bijou@^3.0.0 in peerDependencies, expected 3.0.0',
    ]);
  });
  it('fails on unknown Bijou-scoped dependencies', () => {
    const root = makeWorkspace([
      { dir: 'bijou', name: '@flyingrobots/bijou', version: '3.0.0' },
      {
        dir: 'bijou-node',
        name: '@flyingrobots/bijou-node',
        version: '3.0.0',
        dependencies: { '@flyingrobots/bijou-ghost': '3.0.0' },
      },
    ]);
    expect(validateWorkspaceVersion(root, '3.0.0').errors).toEqual([
      '@flyingrobots/bijou-node references unknown internal package @flyingrobots/bijou-ghost in dependencies',
    ]);
  });
  it('discovers packages from the root workspace config instead of assuming packages/*', () => {
    const root = makeWorkspace(
      [
        { dir: 'bijou', name: '@flyingrobots/bijou', version: '3.0.0' },
        {
          dir: 'bijou-node',
          name: '@flyingrobots/bijou-node',
          version: '3.0.0',
          dependencies: { '@flyingrobots/bijou': '3.0.0' },
        },
      ],
      {
        workspaceRoot: 'fixtures',
        workspacePatterns: ['fixtures/*'],
      },
    );
    expect(validateWorkspaceVersion(root, '3.0.0').errors).toEqual([]);
  });
});
