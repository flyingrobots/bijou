import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const TOOLS_ENTRY = resolve(ROOT, 'packages/bijou-i18n-tools/src/index.ts');
const RUNTIME_ENTRY = resolve(ROOT, 'packages/bijou-i18n/src/index.ts');

describe('LX-004 provider adapters for workbook and bundle exchange cycle', () => {
  it('ships delimited-sheet and JSON-bundle adapter APIs', async () => {
    expect(existsSync(TOOLS_ENTRY)).toBe(true);

    const mod: typeof import('../../../packages/bijou-i18n-tools/src/index.js') = await import(pathToFileURL(TOOLS_ENTRY).href);
    expect(typeof mod.serializeExchangeSheet).toBe('function');
    expect(typeof mod.parseExchangeSheet).toBe('function');
    expect(typeof mod.serializeCatalogBundleJson).toBe('function');
    expect(typeof mod.parseCatalogBundleJson).toBe('function');
  });

  it('roundtrips exported workbook sheets through TSV and back into runtime-consumable catalogs', async () => {
    const tools: typeof import('../../../packages/bijou-i18n-tools/src/index.js') = await import(pathToFileURL(TOOLS_ENTRY).href);
    const runtimeMod: typeof import('../../../packages/bijou-i18n/src/index.js') = await import(pathToFileURL(RUNTIME_ENTRY).href);

    const staleCatalogs = tools.markStaleTranslations([
      {
        namespace: 'shell',
        entries: [
          {
            key: { namespace: 'shell', id: 'help' },
            kind: 'message',
            sourceLocale: 'en',
            sourceValue: 'Help',
            translations: {},
          },
        ],
      },
    ]);

    const workbook = tools.exportTranslationWorkbook(staleCatalogs, 'de');
    const tsv = tools.serializeExchangeSheet(workbook.sheets[0]!, 'tsv');
    const parsedSheet = tools.parseExchangeSheet(workbook.sheets[0]!.name, tsv, 'tsv');
    const importedRows = tools.importTranslationWorkbook({
      version: 1,
      sheets: [
        {
          ...parsedSheet,
          rows: parsedSheet.rows.map((row) => ({
            ...row,
            translatedValueKind: 'string',
            translatedValue: 'Hilfe',
            status: 'current',
          })),
        },
      ],
    });

    const mergedCatalogs = tools.importTranslationRows(staleCatalogs, importedRows);
    const compiled = tools.compileCatalogs(mergedCatalogs);
    const runtime = runtimeMod.createI18nRuntime({ locale: 'de', direction: 'ltr' });
    for (const catalog of compiled) {
      runtime.loadCatalog(catalog);
    }

    expect(runtime.t({ namespace: 'shell', id: 'help' })).toBe('Hilfe');
  });

  it('roundtrips CSV sheets with commas, quotes, and newlines intact', async () => {
    const tools: typeof import('../../../packages/bijou-i18n-tools/src/index.js') = await import(pathToFileURL(TOOLS_ENTRY).href);

    const workbook = tools.exportTranslationWorkbook([
      {
        namespace: 'shell',
        entries: [
          {
            key: { namespace: 'shell', id: 'help' },
            kind: 'message',
            sourceLocale: 'en',
            sourceValue: 'Help, "now"\nplease',
            translations: {
              de: {
                value: 'Hilfe, "jetzt"\nbitte',
                sourceHash: tools.hashSourceValue('Help, "now"\nplease'),
                status: 'stale',
              },
            },
          },
        ],
      },
    ], 'de');

    const csv = tools.serializeExchangeSheet(workbook.sheets[0]!, 'csv');
    const parsed = tools.parseExchangeSheet(workbook.sheets[0]!.name, csv, 'csv');

    expect(parsed.rows[0]?.sourceValue).toBe('Help, "now"\nplease');
    expect(parsed.rows[0]?.translatedValue).toBe('Hilfe, "jetzt"\nbitte');
  });

  it('roundtrips catalog bundles through JSON without losing refs or typed values', async () => {
    const tools: typeof import('../../../packages/bijou-i18n-tools/src/index.js') = await import(pathToFileURL(TOOLS_ENTRY).href);

    const catalogs = [
      {
        namespace: 'shell',
        entries: [
          {
            key: { namespace: 'shell', id: 'help' },
            kind: 'message',
            sourceLocale: 'en',
            sourceValue: 'Help',
            translations: {},
          },
          {
            key: { namespace: 'shell', id: 'help-ref' },
            kind: 'resource',
            sourceLocale: 'en',
            sourceValue: tools.ref({ namespace: 'shell', id: 'help' }),
            translations: {},
          },
          {
            key: { namespace: 'shell', id: 'meta' },
            kind: 'data',
            sourceLocale: 'en',
            sourceValue: { hotkey: '?', visible: true },
            translations: {},
          },
        ],
      },
    ] as const;

    const json = tools.serializeCatalogBundleJson(tools.exportCatalogBundle(catalogs));
    const parsedBundle = tools.parseCatalogBundleJson(json);
    const roundtripped = tools.importCatalogBundle(parsedBundle);

    expect(roundtripped).toEqual(catalogs);
  });

  it('fails clearly on malformed delimited or JSON adapter payloads', async () => {
    const tools: typeof import('../../../packages/bijou-i18n-tools/src/index.js') = await import(pathToFileURL(TOOLS_ENTRY).href);

    expect(() => tools.parseExchangeSheet('translations-de', 'namespace,id\nshell', 'csv'))
      .toThrow(/Invalid delimited sheet/);
    expect(() => tools.parseCatalogBundleJson('{"version":2,"catalogs":[]}'))
      .toThrow(/Invalid catalog bundle json/);
  });
});
