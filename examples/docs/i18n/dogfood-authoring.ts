import { readFileSync } from 'node:fs';
import {
  authoringCatalogsFromStringTable,
  exportCatalogBundle,
  exportTranslationWorkbook,
  parseStringTable,
  type AuthoringCatalog,
  type CatalogBundle,
  type ExchangeWorkbook,
  type StringTable,
} from '../../../packages/bijou-i18n-tools/src/index.js';
import { DOGFOOD_LOCALE_OPTIONS } from '../locale.js';

export interface DogfoodI18nLocaleCoverage {
  readonly locale: string;
  readonly translated: number;
  readonly total: number;
  readonly missing: number;
}

const DOGFOOD_STRING_TABLE_URL = new URL('./source/dogfood-strings.csv', import.meta.url);

export function dogfoodStringTable(): StringTable {
  return parseStringTable(readFileSync(DOGFOOD_STRING_TABLE_URL, 'utf8'), 'csv');
}

export function dogfoodAuthoringCatalogs(
  table: StringTable = dogfoodStringTable(),
): readonly AuthoringCatalog[] {
  return authoringCatalogsFromStringTable(table);
}

export function createDogfoodTranslationWorkbook(locale: string): ExchangeWorkbook {
  return exportTranslationWorkbook(dogfoodAuthoringCatalogs(), locale);
}

export function createDogfoodCatalogBundle(): CatalogBundle {
  return exportCatalogBundle(dogfoodAuthoringCatalogs());
}

export function dogfoodI18nCoverage(
  locales: readonly string[] = DOGFOOD_LOCALE_OPTIONS.map((locale) => locale.id),
  catalogs: readonly AuthoringCatalog[] = dogfoodAuthoringCatalogs(),
): readonly DogfoodI18nLocaleCoverage[] {
  const entries = catalogs.flatMap((catalog) => catalog.entries);
  return locales.map((locale) => {
    const translated = entries.filter((entry) => (
      locale === entry.sourceLocale
      || entry.translations[locale]?.status === 'current'
    )).length;
    return {
      locale,
      translated,
      total: entries.length,
      missing: entries.length - translated,
    };
  });
}
