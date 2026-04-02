import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { basename, dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BINARY_EXTENSIONS = new Set([
  '.gif',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.ico',
  '.pdf',
  '.zip',
  '.xlsx',
  '.woff',
  '.woff2',
  '.ttf',
]);
const USER_HOME_SEGMENT = ['/', 'Users', '/'].join('');
const HOME_SEGMENT = ['/', 'home', '/'].join('');
const FILE_SCHEME = ['file:', '//'].join('');
const WINDOWS_ABSOLUTE_PATH = /\b[A-Za-z]:\\/;

function listTrackedFiles(): string[] {
  return execFileSync('git', ['ls-files', '-z'], { cwd: ROOT, encoding: 'utf8' })
    .split('\0')
    .filter(Boolean);
}

function isBinaryLike(pathname: string, contents: Buffer): boolean {
  if (BINARY_EXTENSIONS.has(extname(pathname).toLowerCase())) {
    return true;
  }
  return contents.includes(0);
}

function isScannedFile(pathname: string): boolean {
  const name = basename(pathname);
  if (name === 'package-lock.json') {
    return true;
  }
  if (name.startsWith('.')) {
    return name === '.gitignore' || name === '.ignore' || name === '.npmrc';
  }
  return true;
}

describe('repo hygiene', () => {
  it('does not commit local absolute filesystem paths into tracked source or docs files', () => {
    const violations: string[] = [];

    for (const relativePath of listTrackedFiles()) {
      if (!isScannedFile(relativePath)) {
        continue;
      }

      const absolutePath = resolve(ROOT, relativePath);
      const buffer = readFileSync(absolutePath);
      if (isBinaryLike(relativePath, buffer)) {
        continue;
      }

      const text = buffer.toString('utf8');
      if (text.includes(USER_HOME_SEGMENT)) {
        violations.push(`${relativePath}: contains macOS user-home absolute path`);
      }
      if (text.includes(HOME_SEGMENT)) {
        violations.push(`${relativePath}: contains POSIX home absolute path`);
      }
      if (text.includes(FILE_SCHEME)) {
        violations.push(`${relativePath}: contains file URL`);
      }
      if (WINDOWS_ABSOLUTE_PATH.test(text)) {
        violations.push(`${relativePath}: contains Windows absolute path`);
      }
    }

    expect(violations, violations.join('\n')).toEqual([]);
  });
});
