import { readdirSync, readFileSync } from 'node:fs';
import { extname, posix as posixPath, resolve } from 'node:path';
import type { CodeSizeFile } from './code-size-gate-types.js';

const SOURCE_EXTENSIONS = new Set(['.cjs', '.js', '.mjs', '.ts', '.tsx']);
const SKIPPED_DIRECTORIES = new Set([
  '.git',
  'coverage',
  'dist',
  'node_modules',
]);

export function collectCodeSizeFiles(cwd: string): readonly CodeSizeFile[] {
  const files: CodeSizeFile[] = [];

  function visit(relativeDirectory: string): void {
    const absoluteDirectory = resolve(cwd, relativeDirectory);
    for (const entry of readdirSync(absoluteDirectory, {
      withFileTypes: true,
    })) {
      const relativePath =
        relativeDirectory === ''
          ? entry.name
          : posixPath.join(relativeDirectory, entry.name);
      if (entry.isDirectory()) {
        if (!SKIPPED_DIRECTORIES.has(entry.name)) visit(relativePath);
        continue;
      }
      if (!entry.isFile() || !isSourceFile(relativePath)) continue;
      files.push(
        Object.freeze({
          path: relativePath,
          lines: countLines(readFileSync(resolve(cwd, relativePath), 'utf8')),
        }),
      );
    }
  }

  visit('');
  return Object.freeze(files.sort((a, b) => a.path.localeCompare(b.path)));
}

function isSourceFile(path: string): boolean {
  if (path.endsWith('.d.ts')) return false;
  return SOURCE_EXTENSIONS.has(extname(path));
}

function countLines(text: string): number {
  if (text.length === 0) return 0;
  return text.endsWith('\n')
    ? text.split('\n').length - 1
    : text.split('\n').length;
}
