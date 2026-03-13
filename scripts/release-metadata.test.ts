import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  formatReleaseOutputs,
  parseReleaseTag,
  runReleaseMetadata,
  validateReleaseVersion,
  validateWorkspaceVersion,
  writeGithubOutput,
} from './release-metadata.js';

const tempRoots: string[] = [];

function makeWorkspace(packages: Array<{
  readonly dir: string;
  readonly name: string;
  readonly version: string;
  readonly dependencies?: Record<string, string>;
  readonly devDependencies?: Record<string, string>;
  readonly peerDependencies?: Record<string, string>;
}>, options?: {
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
    rmSync(tempRoots.pop()!, { recursive: true, force: true });
  }
});

describe('parseReleaseTag', () => {
  it('parses stable tags', () => {
    expect(parseReleaseTag('v3.0.0')).toEqual({
      tag: 'v3.0.0',
      tagVersion: '3.0.0',
      isPrerelease: false,
      npmDistTag: 'latest',
    });
  });

  it('parses prerelease tags', () => {
    expect(parseReleaseTag('v3.1.0-rc.2')).toEqual({
      tag: 'v3.1.0-rc.2',
      tagVersion: '3.1.0-rc.2',
      isPrerelease: true,
      npmDistTag: 'next',
    });
  });

  it('rejects invalid tags', () => {
    expect(() => parseReleaseTag('release-3.0.0')).toThrow('Invalid tag format');
  });

  it('rejects tags with leading-zero numeric identifiers', () => {
    expect(() => parseReleaseTag('v01.2.3')).toThrow('Invalid tag format');
    expect(() => parseReleaseTag('v3.1.0-rc.01')).toThrow('Invalid tag format');
  });
});

describe('validateReleaseVersion', () => {
  it('accepts valid release versions', () => {
    expect(validateReleaseVersion('3.0.0')).toBe('3.0.0');
    expect(validateReleaseVersion('3.1.0-beta.2')).toBe('3.1.0-beta.2');
  });

  it('rejects leading-zero numeric identifiers', () => {
    expect(() => validateReleaseVersion('01.2.3')).toThrow('Invalid release version');
    expect(() => validateReleaseVersion('3.1.0-rc.01')).toThrow('Invalid release version');
  });
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
        dependencies: { '@flyingrobots/bijou-legacy': '3.0.0' },
      },
    ]);

    expect(validateWorkspaceVersion(root, '3.0.0').errors).toEqual([
      '@flyingrobots/bijou-node references unknown internal package @flyingrobots/bijou-legacy in dependencies',
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
