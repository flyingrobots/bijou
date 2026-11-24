import { lstatSync, mkdirSync, mkdtempSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { measureContext, type ContextFiles } from './windows-context.mjs';

const roots: string[] = [];
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });

function scratch(): string {
  const root = mkdtempSync(join(tmpdir(), 'context-measure-'));
  roots.push(root);
  mkdirSync(join(root, 'context', 'git'), { recursive: true });
  writeFileSync(join(root, 'context', 'git', 'git.exe'), 'git!');
  writeFileSync(join(root, 'git.tar.bz2'), 'archive');
  return root;
}

/** Real files, except that `doomed` is removed once its directory has been listed. */
function removingAfterListing(doomed: string): ContextFiles {
  return {
    readdirSync: (path) => {
      const names = readdirSync(path);
      if (path === dirname(doomed)) rmSync(doomed);
      return names;
    },
    lstatSync,
  };
}

/**
 * Real files, except that `doomed` is removed (and optionally replaced by a
 * file) right before the walk reads it: the directory was listed by its parent,
 * then a running step removed it.
 */
function removingBeforeRead(doomed: string, replacement?: string): ContextFiles {
  return {
    readdirSync: (path) => {
      if (path === doomed) {
        rmSync(doomed, { recursive: true });
        if (replacement !== undefined) writeFileSync(doomed, replacement);
      }
      return readdirSync(path);
    },
    lstatSync,
  };
}

describe('Windows toolchain context measurement', () => {
  it('counts the bytes and entries of every file in the context', () => {
    const state = { entries: 0, bytes: 0 };
    // Oracle: 'git!' is 4 bytes and 'archive' is 7; entries are context, git, git.exe, git.tar.bz2.
    expect(measureContext(scratch(), state)).toBe(11);
    expect(state).toEqual({ entries: 4, bytes: 11 });
  });

  it('refuses a symlink in the context', () => {
    const root = scratch();
    symlinkSync('/proc/mounts', join(root, 'context', 'git', 'mtab'));
    expect(() => measureContext(root)).toThrow('Toolchain context symlink refused');
  });

  it.each([['git.tar.bz2', 4], [join('context', 'git', 'git.exe'), 7]])(
    'counts nothing for %s when a running step removes it after it was listed',
    (doomed, remaining) => {
      const root = scratch();
      // Oracle: the bytes of the one file that still exists.
      expect(measureContext(root, undefined, removingAfterListing(join(root, doomed)))).toBe(remaining);
    },
  );

  it('counts a listed directory as empty when a running step removes it before it is read', () => {
    const root = scratch();
    const git = join(root, 'context', 'git');
    const state = { entries: 0, bytes: 0 };
    // Oracle: git.exe went with its directory; only the 7-byte archive remains.
    // Entries: context, git, git.tar.bz2 (git.exe was never listed).
    expect(measureContext(root, state, removingBeforeRead(git))).toBe(7);
    expect(state).toEqual({ entries: 3, bytes: 7 });
  });

  it('still fails on a missing root', () => {
    expect(() => measureContext(join(scratch(), 'absent-root'))).toThrow(/ENOENT: .*scandir/u);
  });

  it('still fails when a listed directory is replaced by a file before it is read', () => {
    const root = scratch();
    expect(() => measureContext(root, undefined, removingBeforeRead(join(root, 'context', 'git'), 'not a directory')))
      .toThrow(/ENOTDIR: .*scandir/u);
  });
});
