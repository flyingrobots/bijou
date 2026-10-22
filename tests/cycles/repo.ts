import { documentationFileExists as existsSync, readDocumentationFile as readFileSync } from '../../scripts/documentation-corpus.js';
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
