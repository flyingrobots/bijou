import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

import { tmpdir } from 'node:os';

import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';
import { formatReleaseOutputs, runReleaseMetadata, writeGithubOutput } from './release-metadata.js';

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
it('fails on workspace mismatches', () => {
    const root = makeWorkspace([
      { dir: 'bijou', name: '@flyingrobots/bijou', version: '3.0.0' },
      { dir: 'bijou-node', name: '@flyingrobots/bijou-node', version: '2.1.0' },
    ]);
    const stdout: string[] = [];
    const stderr: string[] = [];
    const code = runReleaseMetadata(['--current-version'], {
      cwd: root,
      stdout: (text) => stdout.push(text),
      stderr: (text) => stderr.push(text),
    });
    expect(code).toBe(1);
    expect(stdout.join('')).toContain('@flyingrobots/bijou-node: 2.1.0 (release: 3.0.0)');
    expect(stderr.join('')).toContain('Workspace version mismatch detected');
    expect(stderr.join('')).toContain('@flyingrobots/bijou-node version (2.1.0) does not match expected (3.0.0)');
  });
});

describe('writeGithubOutput', () => {
  it('formats key value pairs as environment-file lines', () => {
    expect(formatReleaseOutputs({ version: '3.0.0', notes_tag: 'dry-run-v3.0.0-local' })).toBe(
      'version=3.0.0\nnotes_tag=dry-run-v3.0.0-local\n',
    );
  });
  it('appends key value pairs as environment-file lines', () => {
    const root = makeWorkspace([{ dir: 'bijou', name: '@flyingrobots/bijou', version: '3.0.0' }]);
    const outputPath = join(root, 'github-output.txt');
    writeGithubOutput(outputPath, { version: '3.0.0', notes_tag: 'dry-run-v3.0.0-local' });
    expect(readFileSync(outputPath, 'utf8')).toBe(
      'version=3.0.0\nnotes_tag=dry-run-v3.0.0-local\n',
    );
  });
});
