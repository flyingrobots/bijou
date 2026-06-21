

import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';

import { tmpdir } from 'node:os';

import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import * as nodeTools from '../../../packages/bijou-i18n-tools-node/src/index.js';

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
it('infers formats from file extensions for sheet and bundle helpers', async () => {
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
});

describe('LX-005 rich spreadsheet and filesystem adapters cycle', () => {
it('fails clearly on malformed manifests or missing sheet files', async () => {
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
