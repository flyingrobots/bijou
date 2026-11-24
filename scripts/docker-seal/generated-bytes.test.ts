import { lstatSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { generatedBytes, type GeneratedFiles } from './generated-bytes.mjs';
import { repositoryFixture } from './snapshot-test-fixture.js';

const fixtures: ReturnType<typeof repositoryFixture>[] = [];
afterEach(() => { for (const fixture of fixtures.splice(0)) fixture.cleanup(); });

function repository(): ReturnType<typeof repositoryFixture> {
  const fixture = repositoryFixture();
  fixtures.push(fixture);
  return fixture;
}

/**
 * Real files, except that `doomed` is removed right after the walk has seen it
 * as a directory: the window in which a test cleaning up its temporary
 * repository raced the supervisor's sampled walk of `/tmp` on a hosted runner.
 */
function removingAfterStat(doomed: string, replacement?: string): GeneratedFiles {
  return {
    readdirSync,
    lstatSync: (path) => {
      const stat = lstatSync(path);
      if (path === doomed) {
        rmSync(doomed, { recursive: true });
        if (replacement !== undefined) writeFileSync(doomed, replacement);
      }
      return stat;
    },
  };
}

function tagFiles(baseline: Map<string, number>, root: string): string[] {
  const prefix = join(root, '.git', 'refs', 'tags') + '/';
  return [...baseline.keys()].filter((path) => path.startsWith(prefix)).map((path) => path.slice(prefix.length)).sort();
}

describe.skipIf(process.platform !== 'linux')('sealed generated-byte walk', () => {
  it.each([
    ['has no tags at all', (_: ReturnType<typeof repositoryFixture>) => undefined],
    ['keeps its tags only in packed-refs', ({ root, git }: ReturnType<typeof repositoryFixture>) => {
      git(root, 'tag', 'v1'); git(root, 'pack-refs', '--all');
    }],
  ])('treats refs/tags as empty when it vanishes mid-walk from a repository that %s', (_name, arrange) => {
    const fixture = repository();
    arrange(fixture);
    const tags = join(fixture.root, '.git', 'refs', 'tags');
    const baseline = new Map<string, number>();
    // Oracle: the directory is gone, so it holds no bytes, and the walk still
    // records the files that remain.
    expect(generatedBytes([fixture.root], baseline, true, removingAfterStat(tags))).toBe(0);
    expect(baseline.has(join(fixture.root, 'data.txt'))).toBe(true);
    expect(tagFiles(baseline, fixture.root)).toEqual([]);
  });

  it('walks a repository whose refs/tags directory is absent before the walk starts', () => {
    const fixture = repository();
    fixture.git(fixture.root, 'tag', 'v1'); fixture.git(fixture.root, 'pack-refs', '--all');
    rmSync(join(fixture.root, '.git', 'refs', 'tags'), { recursive: true });
    const baseline = new Map<string, number>();
    generatedBytes([fixture.root], baseline, true);
    // Oracle: Git still resolves the packed tag without the loose directory.
    expect(fixture.git(fixture.root, 'tag', '-l')).toBe('v1');
    expect(tagFiles(baseline, fixture.root)).toEqual([]);
    expect(baseline.has(join(fixture.root, '.git', 'packed-refs'))).toBe(true);
  });

  it('finds every loose tag that git for-each-ref reports', () => {
    const fixture = repository();
    fixture.git(fixture.root, 'tag', 'v1'); fixture.git(fixture.root, 'tag', 'release/v2');
    const baseline = new Map<string, number>();
    generatedBytes([fixture.root], baseline, true);
    const listed = fixture.git(fixture.root, 'for-each-ref', '--format=%(refname:strip=2)', 'refs/tags').split('\n').sort();
    expect(listed).toEqual(['release/v2', 'v1']);
    expect(tagFiles(baseline, fixture.root)).toEqual(listed);
  });

  it('finds no loose tag files once git has packed them, while git still lists them', () => {
    const fixture = repository();
    fixture.git(fixture.root, 'tag', 'v1'); fixture.git(fixture.root, 'pack-refs', '--all');
    const baseline = new Map<string, number>();
    generatedBytes([fixture.root], baseline, true);
    expect(fixture.git(fixture.root, 'tag', '-l')).toBe('v1');
    expect(tagFiles(baseline, fixture.root)).toEqual([]);
  });

  it('counts only growth since the recorded baseline', () => {
    const fixture = repository();
    const baseline = new Map<string, number>();
    generatedBytes([fixture.root], baseline, true);
    writeFileSync(join(fixture.root, 'generated.log'), 'twelve bytes');
    // Oracle: 'twelve bytes' is 12 bytes and nothing else changed.
    expect(generatedBytes([fixture.root], baseline)).toBe(12);
  });

  it('still fails on a missing root, which is a mount and never optional', () => {
    const fixture = repository();
    expect(() => generatedBytes([join(fixture.root, 'absent-root')], new Map())).toThrow(/ENOENT: .*scandir/u);
  });

  it('still fails when a listed directory is replaced by a file mid-walk', () => {
    const fixture = repository();
    const tags = join(fixture.root, '.git', 'refs', 'tags');
    expect(() => generatedBytes([fixture.root], new Map(), true, removingAfterStat(tags, 'not a directory')))
      .toThrow(/ENOTDIR: .*scandir/u);
  });
});
