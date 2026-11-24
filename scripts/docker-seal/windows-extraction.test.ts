import { execFileSync } from 'node:child_process';
import { lstatSync, mkdirSync, mkdtempSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { gitExtractionCommands } from './windows-extraction.mjs';

const roots: string[] = [];
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });

function symlinks(path: string): string[] {
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    const child = join(path, entry.name);
    if (lstatSync(child).isSymbolicLink()) return [child];
    return entry.isDirectory() ? symlinks(child) : [];
  });
}

describe('Windows Git toolchain extraction', () => {
  it('decompresses bzip2 before tar so tar never pipes through an external filter', () => {
    const steps = gitExtractionCommands('S', 'T');
    expect(steps.map((step) => step.label)).toEqual(['decompress-git', 'extract-git']);
    expect(steps[0]?.argv).toEqual(['bzip2', '-d', join('S', 'git.tar.bz2')]);
    expect(steps[1]?.argv.slice(0, 5)).toEqual(['tar.exe', '-xf', join('S', 'git.tar'), '-C', 'T']);
  });

  it('bounds each step independently', () => {
    for (const step of gitExtractionCommands('S', 'T')) expect(step.timeout).toBeGreaterThan(0);
  });

  it('leaves out the MSYS pseudo-device links that escape the toolchain', () => {
    const root = mkdtempSync(join(tmpdir(), 'git-extract-'));
    roots.push(root);
    const source = join(root, 'source');
    mkdirSync(join(source, 'dev'), { recursive: true });
    mkdirSync(join(source, 'etc'));
    mkdirSync(join(source, 'cmd'));
    writeFileSync(join(source, 'cmd', 'git.exe'), 'git');
    const links: readonly (readonly [string, string])[] = [['dev/fd', '/proc/self/fd'], ['dev/stdin', '/proc/self/fd/0'],
      ['dev/stdout', '/proc/self/fd/1'], ['dev/stderr', '/proc/self/fd/2'], ['etc/mtab', '/proc/mounts']];
    for (const [link, target] of links) {
      symlinkSync(target, join(source, link));
    }
    const target = join(root, 'target');
    mkdirSync(target);
    mkdirSync(join(root, 'scratch'));
    execFileSync('tar', ['-cf', join(root, 'scratch', 'git.tar'), '-C', source, '.']);
    const argv = gitExtractionCommands(join(root, 'scratch'), target)[1]?.argv ?? [];
    execFileSync('tar', argv.slice(1));
    expect(symlinks(target)).toEqual([]);
    expect(lstatSync(join(target, 'cmd', 'git.exe')).isFile()).toBe(true);
  });
});
