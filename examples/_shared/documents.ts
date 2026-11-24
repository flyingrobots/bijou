import { readDocumentationFile } from '../../scripts/documentation-corpus.js';
import { exampleDocsKey } from './document-key.js';

// The one seam through which DOGFOOD reads a document. This is the Node
// adapter: the live file first, then the SHA-256-verified book corpus. The
// showcase's build swaps this module for a reader over a table of the documents
// the app reads (examples/web-gpu/documents-plugin.ts).
const ROOT = new URL('../../', import.meta.url);
const seen = new Set<string>();

/** The text of a document named by a path relative to `examples/docs`. */
export function readExampleDocsDocument(path: string): string {
  const key = exampleDocsKey(path);
  seen.add(key);
  return readDocumentationFile(new URL(key, ROOT), 'utf8');
}

/** Every repository-relative key read through this module so far. */
export function documentKeysRead(): readonly string[] {
  return [...seen].sort();
}
