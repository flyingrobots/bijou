import type { I18nCatalog, I18nCatalogEntry } from '../../../packages/bijou-i18n/src/index.js';
import {
  exportCatalogBundle,
  exportTranslationWorkbook,
  hashSourceValue,
  type AuthoringCatalog,
  type AuthoringCatalogEntry,
  type AuthoringTranslation,
  type CatalogBundle,
  type ExchangeWorkbook,
} from '../../../packages/bijou-i18n-tools/src/index.js';
import { DOGFOOD_I18N_CATALOG } from './dogfood-catalog.js';
import { DOGFOOD_LOCALE_OPTIONS } from '../locale.js';

export interface DogfoodI18nLocaleCoverage {
  readonly locale: string;
  readonly translated: number;
  readonly total: number;
  readonly missing: number;
}

export function dogfoodAuthoringCatalogs(
  catalogs: readonly I18nCatalog[] = [DOGFOOD_I18N_CATALOG],
): readonly AuthoringCatalog[] {
  return catalogs.map((catalog) => ({
    namespace: catalog.namespace,
    entries: catalog.entries.map((entry) => runtimeEntryToAuthoringEntry(entry)),
  }));
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

function runtimeEntryToAuthoringEntry(entry: I18nCatalogEntry): AuthoringCatalogEntry {
  const sourceValue = entry.values[entry.sourceLocale] ?? entry.fallbackValue;
  if (sourceValue === undefined) {
    throw new Error(`Dogfood i18n catalog entry ${entry.key.id} is missing source locale ${entry.sourceLocale}`);
  }

  const sourceHash = hashSourceValue(sourceValue);
  const translations: Record<string, AuthoringTranslation> = {};
  for (const [locale, value] of Object.entries(entry.values)) {
    if (locale === entry.sourceLocale) {
      continue;
    }
    translations[locale] = {
      value,
      sourceHash,
      status: 'current',
    };
  }

  return {
    key: entry.key,
    kind: entry.kind,
    sourceLocale: entry.sourceLocale,
    sourceValue,
    translations,
  };
}
