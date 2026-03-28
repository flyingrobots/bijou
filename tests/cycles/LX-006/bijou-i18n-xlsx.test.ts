import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const XLSX_TOOLS_ENTRY = resolve(ROOT, 'packages/bijou-i18n-tools-xlsx/src/index.ts');
const TOOLS_ENTRY = resolve(ROOT, 'packages/bijou-i18n-tools/src/index.ts');
const RUNTIME_ENTRY = resolve(ROOT, 'packages/bijou-i18n/src/index.ts');

describe('LX-006 xlsx localization adapters cycle', () => {
  it('ships a dedicated XLSX helper package for workbook exchange', async () => {
    expect(existsSync(resolve(ROOT, 'packages/bijou-i18n-tools-xlsx/package.json'))).toBe(true);
    expect(existsSync(resolve(ROOT, 'packages/bijou-i18n-tools-xlsx/tsconfig.json'))).toBe(true);
    expect(existsSync(XLSX_TOOLS_ENTRY)).toBe(true);

    const mod: typeof import('../../../packages/bijou-i18n-tools-xlsx/src/index.js') = await import(pathToFileURL(XLSX_TOOLS_ENTRY).href);
    expect(typeof mod.serializeExchangeWorkbookXlsx).toBe('function');
    expect(typeof mod.parseExchangeWorkbookXlsx).toBe('function');
  });

  it('roundtrips translated workbooks through XLSX bytes and back into runtime catalogs', async () => {
    const xlsxTools: typeof import('../../../packages/bijou-i18n-tools-xlsx/src/index.js') = await import(pathToFileURL(XLSX_TOOLS_ENTRY).href);
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
          {
            key: { namespace: 'shell', id: 'help-ref' },
            kind: 'resource',
            sourceLocale: 'en',
            sourceValue: tools.ref({ namespace: 'shell', id: 'help' }),
            translations: {},
          },
          {
            key: { namespace: 'shell', id: 'help-meta' },
            kind: 'data',
            sourceLocale: 'en',
            sourceValue: { shortcut: '?', tone: 'calm' },
            translations: {},
          },
        ],
      },
    ]);

    const workbook = tools.exportTranslationWorkbook(staleCatalogs, 'de');
    const parsedWorkbook = xlsxTools.parseExchangeWorkbookXlsx(
      xlsxTools.serializeExchangeWorkbookXlsx(workbook),
    );

    const editedWorkbook = {
      ...parsedWorkbook,
      sheets: parsedWorkbook.sheets.map((sheet) => ({
        ...sheet,
        rows: sheet.rows.map((row) => {
          if (row.id === 'help') {
            return {
              ...row,
              translatedValueKind: 'string',
              translatedValue: 'Hilfe',
              status: 'current',
            };
          }
          if (row.id === 'help-ref') {
            return {
              ...row,
              translatedValueKind: 'reference',
              translatedValue: JSON.stringify({ namespace: 'shell', id: 'help' }),
              status: 'current',
            };
          }
          if (row.id === 'help-meta') {
            return {
              ...row,
              translatedValueKind: 'object',
              translatedValue: JSON.stringify({ shortcut: '?', tone: 'ruhig' }),
              status: 'current',
            };
          }
          return row;
        }),
      })),
    };

    const rows = tools.importTranslationWorkbook(
      xlsxTools.parseExchangeWorkbookXlsx(
        xlsxTools.serializeExchangeWorkbookXlsx(editedWorkbook),
      ),
    );
    const merged = tools.importTranslationRows(staleCatalogs, rows);
    const compiled = tools.compileCatalogs(merged);
    const runtime = runtimeMod.createI18nRuntime({ locale: 'de', direction: 'ltr' });
    for (const catalog of compiled) {
      runtime.loadCatalog(catalog);
    }

    expect(runtime.t({ namespace: 'shell', id: 'help' })).toBe('Hilfe');
    expect(runtime.resource({ namespace: 'shell', id: 'help-ref' })).toBe('Hilfe');
    expect(runtime.resource({ namespace: 'shell', id: 'help-meta' })).toEqual({
      shortcut: '?',
      tone: 'ruhig',
    });
  });
});
