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

    const rewritten = rewritePackageManifestToTarballs(source, {
      '@flyingrobots/bijou': 'file:/tmp/bijou.tgz',
      '@flyingrobots/bijou-node': 'file:/tmp/bijou-node.tgz',
      '@flyingrobots/bijou-tui': 'file:/tmp/bijou-tui.tgz',
      '@flyingrobots/bijou-tui-app': 'file:/tmp/bijou-tui-app.tgz',
    });

    expect(rewritten).toContain('"@flyingrobots/bijou": "file:/tmp/bijou.tgz"');
    expect(rewritten).toContain('"@flyingrobots/bijou-node": "file:/tmp/bijou-node.tgz"');
    expect(rewritten).toContain('"chalk": "^5.0.0"');
    expect(rewritten).toContain('"@flyingrobots/bijou-tui": "file:/tmp/bijou-tui.tgz"');
    expect(rewritten).toContain('"@flyingrobots/bijou-tui-app": "file:/tmp/bijou-tui-app.tgz"');
  });

  it('leaves unrelated manifests unchanged when no tarball exists', () => {
    const source = JSON.stringify({
      name: 'core-canary',
      dependencies: {
        '@flyingrobots/bijou': 'latest',
        picocolors: '^1.1.0',
      },
    });

    const rewritten = rewritePackageManifestToTarballs(source, {
      '@flyingrobots/bijou-node': 'file:/tmp/bijou-node.tgz',
    });

    expect(rewritten).toContain('"@flyingrobots/bijou": "latest"');
    expect(rewritten).toContain('"picocolors": "^1.1.0"');
  });

  it('adds tarball overrides for transitive workspace dependencies', () => {
    const source = JSON.stringify({
      name: 'core-canary',
      dependencies: {
        '@flyingrobots/bijou': 'latest',
        '@flyingrobots/bijou-node': 'latest',
      },
    });

    const rewritten = rewritePackageManifestToTarballs(source, {
      '@flyingrobots/bijou': 'file:/tmp/bijou.tgz',
      '@flyingrobots/bijou-node': 'file:/tmp/bijou-node.tgz',
      '@flyingrobots/bijou-tui': 'file:/tmp/bijou-tui.tgz',
    });

    expect(rewritten).toContain('"@flyingrobots/bijou": "file:/tmp/bijou.tgz"');
    expect(rewritten).toContain('"@flyingrobots/bijou-node": "file:/tmp/bijou-node.tgz"');
    expect(rewritten).toContain('"@flyingrobots/bijou-tui": "file:/tmp/bijou-tui.tgz"');
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
