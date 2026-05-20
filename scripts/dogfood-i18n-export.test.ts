import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createI18nRuntime } from '../packages/bijou-i18n/src/index.js';
import {
  compileCatalogs,
  importCatalogBundle,
  importTranslationWorkbook,
  parseExchangeSheet,
} from '../packages/bijou-i18n-tools/src/index.js';
import {
  DOGFOOD_I18N_CATALOG,
  dogfoodI18nCatalogsForLocale,
} from '../examples/docs/i18n/dogfood-catalog.js';
import {
  createDogfoodCatalogBundle,
  createDogfoodTranslationWorkbook,
  dogfoodAuthoringCatalogs,
  dogfoodStringTable,
} from '../examples/docs/i18n/dogfood-authoring.js';
import { runDogfoodI18nBuild } from './dogfood-i18n-build.js';
import { runDogfoodI18nExport } from './dogfood-i18n-export.js';

const tempDirs: string[] = [];

async function makeTempDir(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'bijou-dogfood-i18n-'));
  tempDirs.push(dir);
  return dir;
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map(async (dir) => {
    await rm(dir, { recursive: true, force: true });
  }));
});

describe('DOGFOOD i18n export workflow', () => {
  it('keeps Dogfood runtime strings in generated selected-locale catalog files', () => {
    const languageEntry = DOGFOOD_I18N_CATALOG.entries.find(
      (entry) => entry.key.id === 'settings.language.label',
    );
    const frLanguageEntry = dogfoodI18nCatalogsForLocale('fr')[0]?.entries.find(
      (entry) => entry.key.id === 'settings.language.label',
    );

    expect(DOGFOOD_I18N_CATALOG.namespace).toBe('bijou.dogfood');
    expect(languageEntry?.values.en).toBe('Preferred language');
    expect(languageEntry?.values.fr).toBeUndefined();
    expect(frLanguageEntry?.values).toEqual({
      en: 'Preferred language',
      fr: 'Langue préférée',
    });
    expect(frLanguageEntry?.values.es).toBeUndefined();
  });

  it('uses the committed Dogfood CSV string table as the authoring source', () => {
    const table = dogfoodStringTable();
    const authoring = dogfoodAuthoringCatalogs();
    const compiled = compileCatalogs(authoring);
    const runtime = createI18nRuntime({ locale: 'fr', direction: 'ltr' });

    for (const catalog of compiled) {
      runtime.loadCatalog(catalog);
    }

    expect(table.rows.length).toBeGreaterThan(DOGFOOD_I18N_CATALOG.entries.length);
    expect(authoring[0]?.entries.length).toBe(DOGFOOD_I18N_CATALOG.entries.length);
    expect(runtime.t({ namespace: 'bijou.dogfood', id: 'settings.language.label' }))
      .toBe('Langue préférée');
  });

  it('exports Dogfood translations through the existing CSV workbook adapter', async () => {
    const workbook = createDogfoodTranslationWorkbook('it');
    const sheet = workbook.sheets[0]!;
    const csv = (await runDogfoodI18nExport({
      args: ['--locale', 'it', '--format', 'csv'],
      stdout: (text) => text,
      stderr: () => undefined,
    })).stdout;
    const parsed = parseExchangeSheet(sheet.name, csv, 'csv');
    const rows = importTranslationWorkbook({ version: 1, sheets: [parsed] });

    expect(sheet.name).toBe('translations-it');
    expect(rows.length).toBe(DOGFOOD_I18N_CATALOG.entries.length);
    expect(rows.find((row) => row.id === 'settings.language.description')?.sourceValue)
      .toBe('Current language: {language}. Options: {options}.');
  });

  it('exports Dogfood authoring catalogs as JSON bundles without losing translations', () => {
    const bundle = createDogfoodCatalogBundle();
    const restored = importCatalogBundle(bundle);
    const runtime = createI18nRuntime({ locale: 'de', direction: 'ltr' });

    for (const catalog of compileCatalogs(restored)) {
      runtime.loadCatalog(catalog);
    }

    expect(bundle.catalogs[0]?.entries[0]?.sourceValue.kind).toBe('string');
    expect(runtime.t({ namespace: 'bijou.dogfood', id: 'settings.language.label' }))
      .toBe('Bevorzugte Sprache');
  });

  it('prints help as a successful usage path', async () => {
    const result = await runDogfoodI18nExport({
      args: ['--help'],
      stdout: (text) => text,
      stderr: () => undefined,
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Usage: npm run dogfood:i18n:export');
    expect(result.stderr).toBe('');
  });

  it('can write CSV workbooks and JSON bundles to explicit filesystem targets', async () => {
    const dir = await makeTempDir();
    const result = await runDogfoodI18nExport({
      args: ['--locale', 'fr', '--format', 'csv', '--out', join(dir, 'fr'), '--bundle', join(dir, 'bundle.json')],
      stdout: (text) => text,
      stderr: () => undefined,
    });

    const manifest = await readFile(join(dir, 'fr', 'workbook.json'), 'utf8');
    const bundle = await readFile(join(dir, 'bundle.json'), 'utf8');

    expect(result.exitCode).toBe(0);
    expect(manifest).toContain('"format": "csv"');
    expect(bundle).toContain('"namespace": "bijou.dogfood"');
  });

  it('builds per-locale runtime catalog JSON files from the committed CSV source', async () => {
    const dir = await makeTempDir();
    const result = runDogfoodI18nBuild({
      outDir: join(dir, 'catalogs'),
      stdout: () => undefined,
      stderr: () => undefined,
    });
    const frCatalog = await readFile(join(dir, 'catalogs', 'fr', 'bijou.dogfood.json'), 'utf8');

    expect(result.exitCode).toBe(0);
    expect(result.files).toEqual([
      join(dir, 'catalogs', 'de', 'bijou.dogfood.json'),
      join(dir, 'catalogs', 'en', 'bijou.dogfood.json'),
      join(dir, 'catalogs', 'es', 'bijou.dogfood.json'),
      join(dir, 'catalogs', 'fr', 'bijou.dogfood.json'),
    ]);
    expect(JSON.parse(frCatalog).entries.find(
      (entry: { key: { id: string } }) => entry.key.id === 'settings.language.label',
    ).values).toEqual({
      en: 'Preferred language',
      fr: 'Langue préférée',
    });
    expect(runDogfoodI18nBuild({
      outDir: join(dir, 'catalogs'),
      check: true,
      stdout: () => undefined,
      stderr: () => undefined,
    }).exitCode).toBe(0);
  });
});
