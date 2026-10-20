import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CORPUS = resolve(ROOT, 'docs/book/source-corpus.json');
let archived: ReadonlyMap<string, string> | undefined;

function archive(): ReadonlyMap<string, string> {
  if (archived != null) return archived;
  const value: unknown = JSON.parse(readFileSync(CORPUS, 'utf8'));
  if (!Array.isArray(value)) throw new Error('Book corpus must be an array');
  const records: readonly unknown[] = value;
  const entries = new Map<string, string>();
  for (const record of records) {
    if (record == null || typeof record !== 'object'
      || !('path' in record) || typeof record.path !== 'string'
      || !('text' in record) || typeof record.text !== 'string'
      || !('sha256' in record) || typeof record.sha256 !== 'string') {
      throw new Error('Invalid book corpus entry');
    }
    if (relative(ROOT, resolve(ROOT, record.path)) !== record.path
      || entries.has(record.path)
      || createHash('sha256').update(record.text).digest('hex') !== record.sha256) {
      throw new Error(`Invalid book corpus path or checksum: ${record.path}`);
    }
    entries.set(record.path, record.text);
  }
  archived = entries;
  return entries;
}

function archiveKey(path: string | URL): string {
  const absolute = path instanceof URL ? fileURLToPath(path) : resolve(path);
  return relative(ROOT, absolute).split('\\').join('/');
}

/** Read a live file first, then an exact source retained in the compiled book. */
export function readDocumentationFile(path: string | URL, encoding: 'utf8'): string {
  if (existsSync(path)) return readFileSync(path, encoding);
  const text = archive().get(archiveKey(path));
  if (text !== undefined) return text;
  return readFileSync(path, encoding);
}

/** Archived documents exist logically; unrelated missing paths remain missing. */
export function documentationFileExists(path: string | URL): boolean {
  return existsSync(path) || archive().has(archiveKey(path));
}
