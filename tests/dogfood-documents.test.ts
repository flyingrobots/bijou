import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createI18nRuntime, createRuntimeLocalizationPort } from '../packages/bijou-i18n/src/index.js';
import { createDocumentReader } from '../examples/_shared/document-reader.js';
import { exampleDocsKey } from '../examples/_shared/document-key.js';
import { documentKeysRead, readExampleDocsDocument as readFromNode } from '../examples/_shared/documents.js';
import '../examples/docs/app.js';
import { guideDocBody } from '../examples/docs/app-guide-access.js';
import { GUIDE_DOCS } from '../examples/docs/app-guide-catalog.js';
import { collectDogfoodMarkdownDocuments } from '../examples/docs/i18n-debt-markdown-discovery.js';
import { defaultMarkdownTemplateValues, readRepoFile } from '../examples/docs/i18n-debt-io.js';
import { dogfoodI18nCatalogsForLocale } from '../examples/docs/i18n/dogfood-catalog.js';
import { DOGFOOD_I18N_DEBT_SOURCES } from '../examples/docs/i18n-debt-sources.js';
import { DOGFOOD_LOCALE_OPTIONS } from '../examples/docs/locale.js';
import { documentTable } from '../scripts/dogfood-documents.js';

// DOGFOOD reads documents through one seam. Node answers from the live file,
// then the verified corpus; the showcase's build swaps in a reader over a table
// it makes from the same files every time (examples/web-gpu/documents-plugin.ts),
// so nothing is committed. These tests make that table in memory and hold it
// to what the app reads, to the files and to the corpus.
const table = documentTable();
const sha256 = (text: string | Buffer): string => createHash('sha256').update(text).digest('hex');
const root = new URL('../', import.meta.url);

describe('the DOGFOOD document table', () => {
  it('holds exactly the documents the app reads, in every locale', () => {
    for (const { id } of DOGFOOD_LOCALE_OPTIONS) {
      const i18n = createRuntimeLocalizationPort(createI18nRuntime({
        locale: id, direction: 'ltr', fallbackLocale: 'en',
        fallbackCatalogs: dogfoodI18nCatalogsForLocale('en'), catalogs: dogfoodI18nCatalogsForLocale(id),
      }));
      for (const guide of GUIDE_DOCS) guideDocBody(guide, i18n);
    }
    const read = documentKeysRead();
    const keys = Object.keys(table).sort();
    expect({ tableOnly: keys.filter((key) => !read.includes(key)), readOnly: read.filter((key) => !keys.includes(key)) }).toEqual({ tableOnly: [], readOnly: [] });
  });

  it('holds every document a readMarkdownDoc call site names', () => {
    const named = DOGFOOD_I18N_DEBT_SOURCES.flatMap((source) => collectDogfoodMarkdownDocuments(source, defaultMarkdownTemplateValues(), readRepoFile));
    expect(named.length).toBeGreaterThan(20);
    expect(named.filter((document) => !(document.path in table)).map((document) => document.path)).toEqual([]);
  });

  it('is answered by the browser reader as the Node adapter answers, and a key it lacks is refused', () => {
    const read = createDocumentReader(new Map(Object.entries(table)));
    for (const key of Object.keys(table)) expect(read(`../../${key}`)).toBe(readFromNode(`../../${key}`));
    expect(() => read('./content/no-such-document.md')).toThrow('not in the browser table');
  });

  it('carries each text as its live file has it, or as the verified corpus does', () => {
    const corpus: unknown = JSON.parse(readFileSync(new URL('docs/book/source-corpus.json', root), 'utf8'));
    const archived = new Map<string, string>();
    const records: readonly unknown[] = Array.isArray(corpus) ? corpus : [];
    for (const record of records) {
      if (typeof record === 'object' && record !== null && 'path' in record && 'sha256' in record
        && typeof record.path === 'string' && typeof record.sha256 === 'string') archived.set(record.path, record.sha256);
    }
    for (const [key, text] of Object.entries(table)) {
      const live = new URL(key, root);
      if (existsSync(live)) expect(sha256(text), key).toBe(sha256(readFileSync(live)));
      else expect(sha256(text), key).toBe(archived.get(key));
    }
  });

  it('resolves a path relative to examples/docs to a repository key', () => {
    expect(exampleDocsKey('./content/guides-start-here.md')).toBe('examples/docs/content/guides-start-here.md');
    expect(exampleDocsKey('../../docs/README.md')).toBe('docs/README.md');
  });
});
