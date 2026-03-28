import { existsSync } from 'node:fs';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { rm } from 'node:fs/promises';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const NODE_TOOLS_ENTRY = resolve(ROOT, 'packages/bijou-i18n-tools-node/src/index.ts');
const TOOLS_ENTRY = resolve(ROOT, 'packages/bijou-i18n-tools/src/index.ts');
const RUNTIME_ENTRY = resolve(ROOT, 'packages/bijou-i18n/src/index.ts');

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
  it('ships a dedicated Node helper package for workbook and bundle files', async () => {
    expect(existsSync(resolve(ROOT, 'packages/bijou-i18n-tools-node/package.json'))).toBe(true);
    expect(existsSync(resolve(ROOT, 'packages/bijou-i18n-tools-node/tsconfig.json'))).toBe(true);
    expect(existsSync(NODE_TOOLS_ENTRY)).toBe(true);

    const mod: typeof import('../../../packages/bijou-i18n-tools-node/src/index.js') = await import(pathToFileURL(NODE_TOOLS_ENTRY).href);
    expect(typeof mod.writeExchangeSheetFile).toBe('function');
    expect(typeof mod.readExchangeSheetFile).toBe('function');
    expect(typeof mod.writeCatalogBundleFile).toBe('function');
    expect(typeof mod.readCatalogBundleFile).toBe('function');
    expect(typeof mod.writeExchangeWorkbookDirectory).toBe('function');
    expect(typeof mod.readExchangeWorkbookDirectory).toBe('function');
  });

  it('roundtrips workbook directories through disk and back into runtime-consumable catalogs', async () => {
    const nodeTools: typeof import('../../../packages/bijou-i18n-tools-node/src/index.js') = await import(pathToFileURL(NODE_TOOLS_ENTRY).href);
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

  it('roundtrips catalog bundle files through disk without losing typed values or refs', async () => {
    const nodeTools: typeof import('../../../packages/bijou-i18n-tools-node/src/index.js') = await import(pathToFileURL(NODE_TOOLS_ENTRY).href);
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

  it('infers formats from file extensions for sheet and bundle helpers', async () => {
    const nodeTools: typeof import('../../../packages/bijou-i18n-tools-node/src/index.js') = await import(pathToFileURL(NODE_TOOLS_ENTRY).href);

    const dir = await makeTempDir();
    const sheetPath = join(dir, 'translations-de.csv');
    await writeFile(
      sheetPath,
      [
        'namespace,id,kind,sourceLocale,targetLocale,status,sourceHash,description,sourceValueKind,sourceValue,translatedValueKind,translatedValue',
        'shell,help,message,en,de,missing,abc12345,,string,Help,,',
      ].join('\n'),
      'utf8',
    );
    const sheet = await nodeTools.readExchangeSheetFile(sheetPath);
    expect(sheet.rows[0]?.id).toBe('help');

    const bundlePath = join(dir, 'bundle.json');
    await writeFile(bundlePath, JSON.stringify({ version: 1, catalogs: [] }), 'utf8');
    const bundle = await nodeTools.readCatalogBundleFile(bundlePath);
    expect(bundle.version).toBe(1);
  });

  it('fails clearly on malformed manifests or missing sheet files', async () => {
    const nodeTools: typeof import('../../../packages/bijou-i18n-tools-node/src/index.js') = await import(pathToFileURL(NODE_TOOLS_ENTRY).href);

    const dir = await makeTempDir();
    const workbookDir = join(dir, 'broken');
    await nodeTools.writeExchangeWorkbookDirectory(workbookDir, {
      version: 1,
      sheets: [
        {
          name: 'translations-de',
          columns: [
            'namespace',
            'id',
            'kind',
            'sourceLocale',
            'targetLocale',
            'status',
            'sourceHash',
            'description',
            'sourceValueKind',
            'sourceValue',
            'translatedValueKind',
            'translatedValue',
          ],
          rows: [],
        },
      ],
    }, 'tsv');

    const manifestPath = join(workbookDir, 'workbook.json');
    const manifest = await readFile(manifestPath, 'utf8');
    const brokenManifest = manifest.replace('translations-de.tsv', 'missing.tsv');
    await writeFile(manifestPath, brokenManifest, 'utf8');

    await expect(nodeTools.readExchangeWorkbookDirectory(workbookDir))
      .rejects.toThrow(/Missing workbook sheet file/);
  });
});
