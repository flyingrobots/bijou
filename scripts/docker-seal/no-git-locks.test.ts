import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// The repository's own scripts must run on a machine that has only what
// `npm ci` and Docker provide. git-locks is a separate tool: a caller may wrap
// a sealed command in it, but no script here may invoke it
// (flyingrobots/bijou#865).
const scripts = fileURLToPath(new URL('..', import.meta.url));
const word = ['lo', 'cks'].join('');
const invocation = new RegExp(`git[ '",]+${word}\\b|['"]${word}['"]`, 'u');

function sources(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) return name === 'ucd' ? [] : sources(path);
    return name.endsWith('.test.ts') ? [] : [path];
  });
}

describe('sealed runner scripts and the lock tool', () => {
  it('finds script sources to scan', () => {
    expect(sources(scripts).length).toBeGreaterThan(50);
  });

  it('invokes git-locks from no script', () => {
    const offenders = sources(scripts).filter((path) => invocation.test(readFileSync(path, 'utf8')));
    expect(offenders.map((path) => path.slice(scripts.length))).toEqual([]);
  });

  it('recognises an invocation when it sees one', () => {
    expect(invocation.test(`spawnSync('git', ['${word}', 'with'])`)).toBe(true);
    expect(invocation.test(`git ${word} with --job x`)).toBe(true);
    expect(invocation.test('const blocks = unlockSurface();')).toBe(false);
  });
});
