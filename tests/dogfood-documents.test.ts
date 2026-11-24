import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { createI18nRuntime } from '../packages/bijou-i18n/src/index.js';
import { exampleDocsKey } from '../examples/_shared/document-key.js';
import { documentKeysRead, readExampleDocsDocument as readFromNode } from '../examples/_shared/documents.js';
import { readExampleDocsDocument as readFromTable } from '../examples/_shared/documents.browser.js';
import { guideDocBody } from '../examples/docs/app-guide-access.js';
import { GUIDE_DOCS } from '../examples/docs/app-guide-catalog.js';
import { collectDogfoodMarkdownDocuments } from '../examples/docs/i18n-debt-markdown-discovery.js';
import { defaultMarkdownTemplateValues, readRepoFile } from '../examples/docs/i18n-debt-io.js';
import { DOGFOOD_I18N_DEBT_SOURCES } from '../examples/docs/i18n-debt-sources.js';
import { DOGFOOD_LOCALE_OPTIONS } from '../examples/docs/locale.js';
import { dogfoodBrowserData, DOGFOOD_DATA_DIR } from '../scripts/dogfood-browser-data.js';

// DOGFOOD reads documents through one seam. Node answers from the live file,
// then the verified corpus; the showcase resolves the seam to a table built
// from the same documents. These tests hold that table to what is read.
const parse = (name: string): Record<string, string> => {
  const value: unknown = JSON.parse(dogfoodBrowserData().get(`${DOGFOOD_DATA_DIR}/${name}`) ?? '');
  if (typeof value !== 'object' || value === null) throw new Error(`${name} is not an object`);
  return Object.fromEntries(Object.entries(value).map(([key, text]) => [key, String(text)]));
};
const table = parse('documents.json');
const digests = parse('documents.sha256.json');
const sha256 = (text: string): string => createHash('sha256').update(text).digest('hex');

describe('the DOGFOOD document table', () => {
  it('holds exactly the documents the app reads, in every locale', () => {
    for (const { id } of DOGFOOD_LOCALE_OPTIONS) {
      const i18n = createI18nRuntime({ locale: id, direction: 'ltr' });
      for (const guide of GUIDE_DOCS) guideDocBody(guide, i18n);
    }
    expect(Object.keys(table).sort()).toEqual(documentKeysRead());
  });

  it('holds every document a readMarkdownDoc call site names', () => {
    const named = DOGFOOD_I18N_DEBT_SOURCES.flatMap((source) => collectDogfoodMarkdownDocuments(source, defaultMarkdownTemplateValues(), readRepoFile));
    expect(named.length).toBeGreaterThan(20);
    expect(named.filter((document) => !(document.path in table)).map((document) => document.path)).toEqual([]);
  });

  it('answers every key as the Node adapter does, and refuses one it lacks', () => {
    for (const key of Object.keys(table)) {
      expect(readFromTable(`../../${key}`)).toBe(readFromNode(`../../${key}`));
    }
    expect(() => readFromTable('./content/no-such-document.md')).toThrow('not in the browser table');
  });

  it('records each digest, and the corpus agrees with it', () => {
    const corpus: unknown = JSON.parse(readFileSync(new URL('../docs/book/source-corpus.json', import.meta.url), 'utf8'));
    const records = new Map<string, string>();
    const list: readonly unknown[] = Array.isArray(corpus) ? corpus : [];
    for (const record of list) {
      if (typeof record === 'object' && record !== null && 'path' in record && 'sha256' in record
        && typeof record.path === 'string' && typeof record.sha256 === 'string') records.set(record.path, record.sha256);
    }
    for (const [key, text] of Object.entries(table)) {
      expect(digests[key]).toBe(sha256(text));
      const archived = records.get(key);
      if (archived !== undefined) expect(archived).toBe(digests[key]);
    }
    expect(Object.keys(digests)).toEqual(Object.keys(table));
  });

  it('resolves a path relative to examples/docs to a repository key', () => {
    expect(exampleDocsKey('./content/guides-start-here.md')).toBe('examples/docs/content/guides-start-here.md');
    expect(exampleDocsKey('../../docs/README.md')).toBe('docs/README.md');
    expect(exampleDocsKey('../../packages/bijou/README.md')).toBe('packages/bijou/README.md');
  });
});
