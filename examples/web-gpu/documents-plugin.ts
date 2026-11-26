import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';

const repository = fileURLToPath(new URL('../../', import.meta.url));
const SEAM = /^(?:\.\.?\/)+_shared\/documents\.js$/u;
const VIRTUAL = '\0bijou-dogfood-documents';
const READER = fileURLToPath(new URL('../_shared/document-reader.ts', import.meta.url));

/**
 * DOGFOOD reads documents through one seam, examples/_shared/documents.ts (the
 * live file, then the verified corpus). In the showcase's build that module is
 * this one instead: a reader over a table of exactly the documents the app
 * reads, made from the files at build time (scripts/dogfood-documents.ts, in a
 * child process so the build does not load DOGFOOD's tooling). Nothing is
 * committed, and nothing from Node reaches the page.
 */
export function dogfoodDocuments(): Plugin {
  let table: string | undefined;
  return {
    name: 'bijou-web-gpu:dogfood-documents',
    enforce: 'pre',
    resolveId(id) {
      return SEAM.test(id) ? VIRTUAL : null;
    },
    load(id) {
      if (id !== VIRTUAL) return null;
      table ??= execFileSync(process.execPath, ['--import', 'tsx', 'scripts/print-dogfood-documents.ts'], { cwd: repository, encoding: 'utf8', maxBuffer: 1 << 28 });
      return [
        `import { createDocumentReader } from ${JSON.stringify(READER)};`,
        `export const readExampleDocsDocument = createDocumentReader(new Map(Object.entries(${table})));`,
      ].join('\n');
    },
  };
}
