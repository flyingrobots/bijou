import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
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

// Frozen source and delivery evidence retain original paths. Exact hashes prevent
// these exceptions from admitting new machine-specific content or mutable code.
const FROZEN_EVIDENCE = new Map([
  ['docs/book/source-corpus.json', '7f2f0fc444dc1a194001e84c5199fc72cf152b13b6420a6b62dd6eb00c0562fc'],
  ['docs/book/build-report.json', 'b799ee9fa864da133b4dad4a66483b5aaaf933a51179349621905ccf4233ec2c'],
  ['docs/book/reader-delivery.json', '199e7d6c3d7bca303e03bde778f79d848a2e28c7e9985a331c72fa29d1e7adb9'],
  ['docs/book/history/2026-10-20-before-progressive-build-report.json', 'eed9b35ce2cccffba4c2368cd6a75991f350c3afdfd0a20446867a8796709c46'],
  ['docs/book/history/2026-10-20-before-progressive-reader-delivery.json', 'f5ebbeb9edd234a3d5fce9d281971030b2ba95fd42def593f6ea974ee4040253'],
]);

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
      if (!existsSync(absolutePath)) {
        continue;
      }
      const buffer = readFileSync(absolutePath);
      const preservedHash = FROZEN_EVIDENCE.get(relativePath);
      if (preservedHash !== undefined) {
        expect(createHash('sha256').update(buffer).digest('hex'), relativePath)
          .toBe(preservedHash);
        continue;
      }
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
