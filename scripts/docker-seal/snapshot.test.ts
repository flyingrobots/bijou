import { existsSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { initializeSnapshot } from './initialize.mjs';
import { repositoryFixture } from './snapshot-test-fixture.js';

describe.skipIf(process.platform !== 'linux')('sealed source capture', () => {
  it('serializes only the explicit full-push boolean without ambient skip controls', async () => {
    const fixture = repositoryFixture();
    const previous = process.env['BIJOU_SKIP_PTY_TESTS'];
    process.env['BIJOU_SKIP_PTY_TESTS'] = 'fixture-only-untrusted-value';
    try {
      for (const fullPush of [false, true]) {
        const snapshot = await fixture.capture(Buffer.alloc(0), undefined, fullPush);
        const text = readFileSync(join(snapshot.source, '.seal', 'request.json'), 'utf8');
        const request: unknown = JSON.parse(text);
        expect(request).toMatchObject({ fullPush });
        expect(text).not.toContain('BIJOU_SKIP_PTY_TESTS');
        expect(text).not.toContain('fixture-only-untrusted-value');
      }
    } finally {
      if (previous === undefined) delete process.env['BIJOU_SKIP_PTY_TESTS'];
      else process.env['BIJOU_SKIP_PTY_TESTS'] = previous;
      fixture.cleanup();
    }
  });

  it('round-trips the worktree, staged bytes and comparison identities into independent Git storage', async () => {
    const fixture = repositoryFixture();
    try {
      const { root, git } = fixture;
      const base = git(root, 'rev-parse', 'HEAD');
      git(root, 'update-ref', 'refs/remotes/origin/main', base);
      git(root, 'remote', 'add', 'origin', 'https://fixture.invalid/private-repository');
      git(root, 'config', 'credential.helper', 'fixture-only-never-run');
      writeFileSync(join(root, '.git', 'FETCH_HEAD'), `${base}\t\tfixture remote URL\n`);
      writeFileSync(join(root, 'data.txt'), 'staged\n');
      git(root, 'add', 'data.txt');
      writeFileSync(join(root, 'data.txt'), 'working\n');
      writeFileSync(join(root, 'owned-new.txt'), 'new source\n');
      const sourceStatus = git(root, 'status', '--porcelain');
      const snapshot = await fixture.capture();
      initializeSnapshot(snapshot.source);
      // One protocol transaction: a hook must observe the same index/worktree
      // and base, while all mutation authority points into the independent copy.
      expect(git(snapshot.source, 'symbolic-ref', 'HEAD')).toBe('refs/heads/topic-seal');
      expect(git(snapshot.source, 'show', ':data.txt')).toBe('staged');
      expect(readFileSync(join(snapshot.source, 'data.txt'), 'utf8')).toBe('working\n');
      expect(git(snapshot.source, 'rev-parse', 'FETCH_HEAD')).toBe(base);
      expect(git(snapshot.source, 'rev-parse', 'origin/main')).toBe(base);
      expect(git(snapshot.source, 'status', '--porcelain')).toBe(sourceStatus);
      expect(git(snapshot.source, 'remote')).toBe('');
      expect(readFileSync(join(snapshot.source, '.git', 'config'), 'utf8')).not.toContain('credential');
      expect(existsSync(join(snapshot.source, '.git', 'commondir'))).toBe(false);
      expect(existsSync(join(snapshot.source, '.git', 'objects/info/alternates'))).toBe(false);
    } finally { fixture.cleanup(); }
  });

  it('omits untracked credential files but retains the reviewed locale example', async () => {
    const fixture = repositoryFixture();
    try {
      for (const name of ['.env', '.env.local', '.npmrc', '.netrc', 'id_ed25519']) {
        writeFileSync(join(fixture.root, name), 'fixture placeholder only');
      }
      writeFileSync(join(fixture.root, '.env.example'), '# LANG\n');
      const snapshot = await fixture.capture();
      for (const name of ['.env', '.env.local', '.npmrc', '.netrc', 'id_ed25519']) {
        expect(existsSync(join(snapshot.source, name)), `credential path ${name}`).toBe(false);
      }
      expect(readFileSync(join(snapshot.source, '.env.example'), 'utf8')).toBe('# LANG\n');
    } finally { fixture.cleanup(); }
  });

  it('refuses an untracked symlink instead of reading its target', async () => {
    const fixture = repositoryFixture();
    try {
      symlinkSync('data.txt', join(fixture.root, 'redirected-input'));
      await expect(fixture.capture()).rejects.toThrow('Unsupported source entry: redirected-input');
    } finally { fixture.cleanup(); }
  });
});
