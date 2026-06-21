
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';

import { tmpdir } from 'node:os';

import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';
import { runReleaseMetadata } from './release-metadata.js';

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

describe('runReleaseMetadata', () => {
it('prints derived outputs locally when no GitHub output file is provided', () => {
    const root = makeWorkspace([
      { dir: 'bijou', name: '@flyingrobots/bijou', version: '3.0.0' },
      {
        dir: 'bijou-tui',
        name: '@flyingrobots/bijou-tui',
        version: '3.0.0',
        dependencies: { '@flyingrobots/bijou': '3.0.0' },
      },
    ]);
    const stdout: string[] = [];
    const stderr: string[] = [];
    const code = runReleaseMetadata(['--current-version', '--notes-tag-run-id', 'local'], {
      cwd: root,
      stdout: (text) => stdout.push(text),
      stderr: (text) => stderr.push(text),
    });
    expect(code).toBe(0);
    expect(stderr).toEqual([]);
    expect(stdout.join('')).toContain('@flyingrobots/bijou: 3.0.0 (release: 3.0.0)');
    expect(stdout.join('')).toContain('version=3.0.0');
    expect(stdout.join('')).toContain('notes_tag=dry-run-v3.0.0-local');
  });
});

describe('runReleaseMetadata', () => {
it('derives --current-version from discovered workspace packages instead of packages/bijou', () => {
    const root = makeWorkspace(
      [
        { dir: 'core', name: '@flyingrobots/bijou', version: '3.0.0' },
        {
          dir: 'node',
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
    const stdout: string[] = [];
    const stderr: string[] = [];
    const code = runReleaseMetadata(['--current-version'], {
      cwd: root,
      stdout: (text) => stdout.push(text),
      stderr: (text) => stderr.push(text),
    });
    expect(code).toBe(0);
    expect(stderr).toEqual([]);
    expect(stdout.join('')).toContain('@flyingrobots/bijou: 3.0.0 (release: 3.0.0)');
    expect(stdout.join('')).toContain('version=3.0.0');
  });
});
