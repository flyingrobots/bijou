import { exampleDocsKey } from './document-key.js';

/**
 * The browser adapter of `documents.ts`, over a table of repository-relative
 * key to text. It imports nothing from Node. The showcase's build makes the
 * table from the documents DOGFOOD reads (examples/web-gpu/documents-plugin.ts)
 * and does not hash again: `tests/dogfood-documents.test.ts` checks each text
 * against its file and the corpus.
 */
export function createDocumentReader(table: ReadonlyMap<string, string>): (path: string) => string {
  return (path) => {
    const key = exampleDocsKey(path);
    const text = table.get(key);
    if (text === undefined) throw new Error(`Document is not in the browser table: ${key}`);
    return text;
  };
}
