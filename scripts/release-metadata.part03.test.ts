import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

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
  it('writes GitHub outputs for dry-run metadata', () => {
    const root = makeWorkspace([
      { dir: 'bijou', name: '@flyingrobots/bijou', version: '3.0.0' },
      {
        dir: 'bijou-tui',
        name: '@flyingrobots/bijou-tui',
        version: '3.0.0',
        dependencies: { '@flyingrobots/bijou': '3.0.0' },
      },
    ]);
    const outputPath = join(root, 'github-output.txt');
    const stdout: string[] = [];
    const stderr: string[] = [];
    const code = runReleaseMetadata(
      ['--current-version', '--notes-tag-run-id', '123', '--github-output', outputPath],
      {
        cwd: root,
        stdout: (text) => stdout.push(text),
        stderr: (text) => stderr.push(text),
      },
    );
    expect(code).toBe(0);
    expect(stderr).toEqual([]);
    expect(stdout.join('')).toContain('@flyingrobots/bijou: 3.0.0 (release: 3.0.0)');
    expect(readFileSync(outputPath, 'utf8')).toContain('version=3.0.0');
    expect(readFileSync(outputPath, 'utf8')).toContain('notes_tag=dry-run-v3.0.0-123');
  });
});

describe('runReleaseMetadata', () => {
  it('writes GitHub outputs for tag metadata', () => {
    const root = makeWorkspace([
      { dir: 'bijou', name: '@flyingrobots/bijou', version: '3.1.0-rc.2' },
      {
        dir: 'bijou-tui',
        name: '@flyingrobots/bijou-tui',
        version: '3.1.0-rc.2',
        peerDependencies: { '@flyingrobots/bijou': '3.1.0-rc.2' },
      },
    ]);
    const outputPath = join(root, 'github-output.txt');
    const stdout: string[] = [];
    const stderr: string[] = [];
    const code = runReleaseMetadata(
      ['--tag', 'v3.1.0-rc.2', '--github-output', outputPath],
      {
        cwd: root,
        stdout: (text) => stdout.push(text),
        stderr: (text) => stderr.push(text),
      },
    );
    expect(code).toBe(0);
    expect(stderr).toEqual([]);
    expect(stdout.join('')).toContain('@flyingrobots/bijou: 3.1.0-rc.2 (tag: 3.1.0-rc.2)');
    expect(readFileSync(outputPath, 'utf8')).toContain('tag=v3.1.0-rc.2');
    expect(readFileSync(outputPath, 'utf8')).toContain('tag_version=3.1.0-rc.2');
    expect(readFileSync(outputPath, 'utf8')).toContain('is_prerelease=true');
    expect(readFileSync(outputPath, 'utf8')).toContain('npm_dist_tag=next');
  });
});
