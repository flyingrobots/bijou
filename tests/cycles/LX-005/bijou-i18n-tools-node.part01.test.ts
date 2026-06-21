import { existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';

import { tmpdir } from 'node:os';

import { dirname, join, resolve } from 'node:path';

import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it } from 'vitest';

import * as runtimeMod from '../../../packages/bijou-i18n/src/index.js';

import * as tools from '../../../packages/bijou-i18n-tools/src/index.js';

import * as nodeTools from '../../../packages/bijou-i18n-tools-node/src/index.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

const NODE_TOOLS_ENTRY = resolve(ROOT, 'packages/bijou-i18n-tools-node/src/index.ts');

const tempDirs: string[] = [];

async function makeTempDir(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'bijou-i18n-node-'));
  tempDirs.push(dir);
  return dir;
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map(async (dir) => {
    await rm(dir, { recursive: true, force: true });
  }));
});

describe('LX-005 rich spreadsheet and filesystem adapters cycle', () => {
it('ships a dedicated Node helper package for workbook and bundle files', () => {
    expect(existsSync(resolve(ROOT, 'packages/bijou-i18n-tools-node/package.json'))).toBe(true);
    expect(existsSync(resolve(ROOT, 'packages/bijou-i18n-tools-node/tsconfig.json'))).toBe(true);
    expect(existsSync(NODE_TOOLS_ENTRY)).toBe(true);

    expect(typeof nodeTools.writeExchangeSheetFile).toBe('function');
    expect(typeof nodeTools.readExchangeSheetFile).toBe('function');
    expect(typeof nodeTools.writeCatalogBundleFile).toBe('function');
    expect(typeof nodeTools.readCatalogBundleFile).toBe('function');
    expect(typeof nodeTools.writeExchangeWorkbookDirectory).toBe('function');
    expect(typeof nodeTools.readExchangeWorkbookDirectory).toBe('function');
  });
});

describe('LX-005 rich spreadsheet and filesystem adapters cycle', () => {
it('roundtrips workbook directories through disk and back into runtime-consumable catalogs', async () => {
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
    const dir = await makeTempDir();
    const workbookDir = join(dir, 'de-workbook');
    await nodeTools.writeExchangeWorkbookDirectory(workbookDir, workbook, 'tsv');

    const parsedWorkbook = await nodeTools.readExchangeWorkbookDirectory(workbookDir);
    const editedWorkbook = {
      ...parsedWorkbook,
      sheets: parsedWorkbook.sheets.map((sheet) => ({
        ...sheet,
        rows: sheet.rows.map((row) => ({
          ...row,
          translatedValueKind: 'string',
          translatedValue: 'Hilfe',
          status: 'current',
        })),
      })),
    };

    const rows = tools.importTranslationWorkbook(editedWorkbook);
    const merged = tools.importTranslationRows(staleCatalogs, rows);
    const compiled = tools.compileCatalogs(merged);
    const runtime = runtimeMod.createI18nRuntime({ locale: 'de', direction: 'ltr' });
    for (const catalog of compiled) {
      runtime.loadCatalog(catalog);
    }

    expect(runtime.t({ namespace: 'shell', id: 'help' })).toBe('Hilfe');
  });
});

describe('LX-005 rich spreadsheet and filesystem adapters cycle', () => {
it('roundtrips catalog bundle files through disk without losing typed values or refs', async () => {
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
        ],
      },
    ] as const;

    const bundle = tools.exportCatalogBundle(catalogs);
    const dir = await makeTempDir();
    const path = join(dir, 'bundle.json');
    await nodeTools.writeCatalogBundleFile(path, bundle);
    const restoredBundle = await nodeTools.readCatalogBundleFile(path);
    const roundtripped = tools.importCatalogBundle(restoredBundle);

    expect(roundtripped).toEqual(catalogs);
  });
});
