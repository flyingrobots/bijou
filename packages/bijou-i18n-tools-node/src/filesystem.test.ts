import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { rm } from 'node:fs/promises';
import {
  readCatalogBundleFile,
  readExchangeSheetFile,
  readExchangeWorkbookDirectory,
  writeCatalogBundleFile,
  writeExchangeWorkbookDirectory,
} from './index.js';

const tempDirs: string[] = [];

async function makeTempDir(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'bijou-i18n-tools-node-'));
  tempDirs.push(dir);
  return dir;
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map(async (dir) => {
    await rm(dir, { recursive: true, force: true });
  }));
});

describe('bijou-i18n-tools-node filesystem helpers', () => {
  it('writes deterministic workbook manifests', async () => {
    const dir = await makeTempDir();
    const workbookDir = join(dir, 'workbook');
    await writeExchangeWorkbookDirectory(workbookDir, {
      version: 1,
      sheets: [
        {
          name: 'b-sheet',
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
        {
          name: 'a-sheet',
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

    const manifest = await readFile(join(workbookDir, 'workbook.json'), 'utf8');
    expect(manifest).toContain('"version": 1');
    expect(manifest).toContain('"fileName": "a-sheet.tsv"');
    expect(manifest).toContain('"fileName": "b-sheet.tsv"');
  });

  it('rejects unsupported file extensions', async () => {
    const dir = await makeTempDir();
    const path = join(dir, 'translations-de.xlsx');
    await writeFile(path, '', 'utf8');
    await expect(readExchangeSheetFile(path)).rejects.toThrow(/Unsupported sheet file extension/);
  });

  it('rejects missing workbook manifests', async () => {
    const dir = await makeTempDir();
    await expect(readExchangeWorkbookDirectory(join(dir, 'missing-workbook')))
      .rejects.toThrow(/Missing workbook manifest/);
  });

  it('writes and reads catalog bundle files', async () => {
    const dir = await makeTempDir();
    const path = join(dir, 'bundle.json');
    await writeCatalogBundleFile(path, { version: 1, catalogs: [] });
    expect(await readCatalogBundleFile(path)).toEqual({ version: 1, catalogs: [] });
  });
});
