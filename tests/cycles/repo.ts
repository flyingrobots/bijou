import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

export function repoPath(relativePath: string): string {
  return resolve(ROOT, relativePath);
}

export function readRepoFile(relativePath: string): string {
  return readFileSync(repoPath(relativePath), 'utf8');
}

export function existsRepoPath(relativePath: string): boolean {
  return existsSync(repoPath(relativePath));
}
