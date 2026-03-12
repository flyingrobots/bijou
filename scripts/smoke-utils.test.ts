import { describe, expect, it } from 'vitest';
import { detectGarbage, rewritePackageManifestToTarballs } from './smoke-utils.js';

describe('rewritePackageManifestToTarballs', () => {
  it('rewrites matching workspace dependencies to tarball specs', () => {
    const source = JSON.stringify({
      name: 'canary-app',
      dependencies: {
        '@flyingrobots/bijou': 'latest',
        '@flyingrobots/bijou-node': 'latest',
        chalk: '^5.0.0',
      },
      devDependencies: {
        '@flyingrobots/bijou-tui': 'latest',
      },
      peerDependencies: {
        '@flyingrobots/bijou-tui-app': 'latest',
      },
    });

    const rewritten = JSON.parse(rewritePackageManifestToTarballs(source, {
      '@flyingrobots/bijou': 'file:/tmp/bijou.tgz',
      '@flyingrobots/bijou-node': 'file:/tmp/bijou-node.tgz',
      '@flyingrobots/bijou-tui': 'file:/tmp/bijou-tui.tgz',
      '@flyingrobots/bijou-tui-app': 'file:/tmp/bijou-tui-app.tgz',
    })) as Record<string, Record<string, string>>;

    expect(rewritten.dependencies?.['@flyingrobots/bijou']).toBe('file:/tmp/bijou.tgz');
    expect(rewritten.dependencies?.['@flyingrobots/bijou-node']).toBe('file:/tmp/bijou-node.tgz');
    expect(rewritten.dependencies?.['chalk']).toBe('^5.0.0');
    expect(rewritten.devDependencies?.['@flyingrobots/bijou-tui']).toBe('file:/tmp/bijou-tui.tgz');
    expect(rewritten.peerDependencies?.['@flyingrobots/bijou-tui-app']).toBe('file:/tmp/bijou-tui-app.tgz');
  });

  it('leaves unrelated manifests unchanged when no tarball exists', () => {
    const source = JSON.stringify({
      name: 'core-canary',
      dependencies: {
        '@flyingrobots/bijou': 'latest',
        picocolors: '^1.1.0',
      },
    });

    const rewritten = JSON.parse(rewritePackageManifestToTarballs(source, {
      '@flyingrobots/bijou-node': 'file:/tmp/bijou-node.tgz',
    })) as Record<string, Record<string, string>>;

    expect(rewritten.dependencies?.['@flyingrobots/bijou']).toBe('latest');
    expect(rewritten.dependencies?.['picocolors']).toBe('^1.1.0');
  });
});

describe('detectGarbage', () => {
  it('flags raw surface dumps and runtime errors', () => {
    expect(detectGarbage('width: 10,\nheight: 1,\ncells: [')).toMatch(/raw Surface dump/);
    expect(detectGarbage('[Pipeline Error] TypeError: nope')).toMatch(/error output/);
  });

  it('allows normal smoke output', () => {
    expect(detectGarbage('My Bijou App\nHome ready\nSplit ready')).toBeNull();
  });
});
