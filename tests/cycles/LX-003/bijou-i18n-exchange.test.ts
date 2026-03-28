import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const TOOLS_ENTRY = resolve(ROOT, 'packages/bijou-i18n-tools/src/index.ts');
const RUNTIME_ENTRY = resolve(ROOT, 'packages/bijou-i18n/src/index.ts');

describe('LX-003 spreadsheet adapters and catalog exchange workflows cycle', () => {
  it('ships workbook and bundle exchange APIs from bijou-i18n-tools', async () => {
    expect(existsSync(TOOLS_ENTRY)).toBe(true);

    const mod: typeof import('../../../packages/bijou-i18n-tools/src/index.js') = await import(pathToFileURL(TOOLS_ENTRY).href);
    expect(typeof mod.exportTranslationWorkbook).toBe('function');
    expect(typeof mod.importTranslationWorkbook).toBe('function');
    expect(typeof mod.exportCatalogBundle).toBe('function');
    expect(typeof mod.importCatalogBundle).toBe('function');
    expect(typeof mod.encodeExchangeValue).toBe('function');
    expect(typeof mod.decodeExchangeValue).toBe('function');
  });

  it('roundtrips workbook exchange back into runtime-consumable catalogs', async () => {
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
    expect(workbook.sheets).toHaveLength(1);
    expect(workbook.sheets[0]?.rows[0]?.sourceValueKind).toBe('string');
    expect(workbook.sheets[0]?.rows[0]?.sourceValue).toBe('Help');

    const editedWorkbook = {
      ...workbook,
      sheets: workbook.sheets.map((sheet) => ({
        ...sheet,
        rows: sheet.rows.map((row) => ({
          ...row,
          translatedValueKind: 'string',
          translatedValue: 'Hilfe',
          status: 'current',
        })),
      })),
    };

    const importedRows = tools.importTranslationWorkbook(editedWorkbook);
    const mergedCatalogs = tools.importTranslationRows(staleCatalogs, importedRows);
    const compiled = tools.compileCatalogs(mergedCatalogs);

    const runtime = runtimeMod.createI18nRuntime({ locale: 'de', direction: 'ltr' });
    for (const catalog of compiled) {
      runtime.loadCatalog(catalog);
    }

    expect(runtime.t({ namespace: 'shell', id: 'help' })).toBe('Hilfe');
  });

  it('roundtrips full authoring catalogs through a serializable bundle without losing refs or typed values', async () => {
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
            translations: {
              de: {
                value: 'Hilfe',
                sourceHash: tools.hashSourceValue('Help'),
                status: 'current',
              },
            },
          },
          {
            key: { namespace: 'shell', id: 'help-label' },
            kind: 'resource',
            sourceLocale: 'en',
            sourceValue: tools.ref({ namespace: 'shell', id: 'help' }),
            translations: {
              de: {
                value: tools.ref({ namespace: 'shell', id: 'help' }),
                sourceHash: tools.hashSourceValue(tools.ref({ namespace: 'shell', id: 'help' })),
                status: 'current',
              },
            },
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

    const bundle = tools.exportCatalogBundle(catalogs);
    const roundtripped = tools.importCatalogBundle(bundle);

    expect(roundtripped).toEqual(catalogs);
  });

  it('fails clearly on malformed workbook payloads', async () => {
    const tools: typeof import('../../../packages/bijou-i18n-tools/src/index.js') = await import(pathToFileURL(TOOLS_ENTRY).href);

    expect(() => tools.importTranslationWorkbook({
      version: 1,
      sheets: [
        {
          name: 'translations-de',
          columns: ['namespace', 'id'],
          rows: [{ namespace: 'shell', id: 'help' }] as unknown as never[],
        },
      ],
    })).toThrow(/Invalid translation workbook/);
  });
});
