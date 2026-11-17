import { readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { initializeSnapshot } from './initialize.mjs';
import { repositoryFixture } from './snapshot-test-fixture.js';
import { captureSnapshot } from './snapshot.mjs';

describe.skipIf(process.platform !== 'linux')('selected Git index capture', () => {
  it('uses the linked worktree administration directory rather than the shared main index', async () => {
    const fixture = repositoryFixture();
    let capturedDirectory: string | undefined;
    try {
      const linked = join(fixture.root, 'linked');
      fixture.git(fixture.root, 'worktree', 'add', '-q', '-b', 'linked-index', linked, 'HEAD');
      const administration = fixture.git(linked, 'rev-parse', '--absolute-git-dir');
      writeFileSync(join(linked, 'data.txt'), 'linked staged bytes\n');
      fixture.git(linked, 'add', 'data.txt');
      const selected = join(administration, 'next-index-fixture');
      writeFileSync(selected, readFileSync(join(administration, 'index')));
      await expect(captureSnapshot(linked, ['node'], Buffer.alloc(0), {
        measurementPath: '/', sourceIndex: join(fixture.root, '.git', 'index'),
      })).rejects.toThrow('Source index must be a regular file under this worktree Git directory');
      const snapshot = await captureSnapshot(linked, ['node'], Buffer.alloc(0), {
        measurementPath: '/', sourceIndex: selected,
      });
      capturedDirectory = snapshot.directory;
      initializeSnapshot(snapshot.source);
      expect(fixture.git(snapshot.source, 'show', ':data.txt')).toBe('linked staged bytes');
    } finally {
      if (capturedDirectory) rmSync(capturedDirectory, { recursive: true, force: true });
      fixture.cleanup();
    }
  });

  it('captures the explicitly selected index without changing either caller index', async () => {
    const fixture = repositoryFixture();
    try {
      const { root, git } = fixture;
      const index = join(root, '.git', 'index');
      const defaultBytes = readFileSync(index);
      writeFileSync(join(root, 'data.txt'), 'only-commit staged content\n');
      git(root, 'add', 'data.txt');
      const temporaryIndex = join(root, '.git', 'next-index-fixture');
      const selectedBytes = readFileSync(index);
      writeFileSync(temporaryIndex, selectedBytes);
      writeFileSync(index, defaultBytes);
      writeFileSync(join(root, 'data.txt'), 'later working copy\n');
      const snapshot = await fixture.capture(Buffer.alloc(0), temporaryIndex);
      initializeSnapshot(snapshot.source);
      expect(git(snapshot.source, 'show', ':data.txt')).toBe('only-commit staged content');
      expect(readFileSync(join(snapshot.source, 'data.txt'), 'utf8')).toBe('later working copy\n');
      expect(readFileSync(index)).toEqual(defaultBytes);
      expect(readFileSync(temporaryIndex)).toEqual(selectedBytes);
      expect(readFileSync(join(snapshot.source, '.seal', 'request.json'), 'utf8')).not.toContain(temporaryIndex);
      expect(git(snapshot.source, 'rev-parse', '--absolute-git-dir')).toBe(join(snapshot.source, '.git'));
    } finally { fixture.cleanup(); }
  });

  it('rejects an index outside this repository Git administration', async () => {
    const fixture = repositoryFixture();
    try {
      const outside = join(fixture.root, 'outside-index');
      writeFileSync(outside, readFileSync(join(fixture.root, '.git', 'index')));
      await expect(fixture.capture(Buffer.alloc(0), outside)).rejects.toThrow('Source index must be a regular file under this worktree Git directory');
    } finally { fixture.cleanup(); }
  });

  it('rejects a symlinked index even when its target is within Git administration', async () => {
    const fixture = repositoryFixture();
    try {
      const redirected = join(fixture.root, '.git', 'next-index-redirect');
      symlinkSync('index', redirected);
      await expect(fixture.capture(Buffer.alloc(0), redirected)).rejects.toThrow('Source index must be a regular file under this worktree Git directory');
    } finally { fixture.cleanup(); }
  });
});
