import DOCUMENTS from '../docs/generated/documents.json' with { type: 'json' };
import { exampleDocsKey } from './document-key.js';

// The browser adapter of `documents.ts`: the same one function, answered from
// a table generated at build time from the documents DOGFOOD reads. It imports
// nothing from Node. Each entry's SHA-256 is recorded in
// `documents.sha256.json` and checked by `tests/dogfood-documents.test.ts`
// against the files and the corpus; the page does not hash again.
// Each text is stored as its lines; see scripts/dogfood-browser-data.ts.
const TABLE: ReadonlyMap<string, string> = new Map(Object.entries(DOCUMENTS).map(([key, lines]) => [key, lines.join('\n')]));

/** The text of a document named by a path relative to `examples/docs`. */
export function readExampleDocsDocument(path: string): string {
  const key = exampleDocsKey(path);
  const text = TABLE.get(key);
  if (text === undefined) throw new Error(`Document is not in the browser table: ${key}`);
  return text;
}
