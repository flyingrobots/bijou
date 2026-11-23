import type { I18nCatalog } from '../../../packages/bijou-i18n/src/index.js';
import DE from './catalogs/de/bijou.dogfood.json' with { type: 'json' };
import EN from './catalogs/en/bijou.dogfood.json' with { type: 'json' };
import ES from './catalogs/es/bijou.dogfood.json' with { type: 'json' };
import FR from './catalogs/fr/bijou.dogfood.json' with { type: 'json' };

export const DOGFOOD_I18N_NAMESPACE = 'bijou.dogfood';

/**
 * Every generated catalog under `./catalogs/<locale>/`, by locale and then by
 * file name, imported so that a bundler inlines them. The drift test
 * `tests/dogfood-catalog-imports.test.ts` holds this table to the directory.
 */
export const DOGFOOD_CATALOG_FILES: Readonly<Record<string, Readonly<Record<string, unknown>>>> = {
  de: { 'bijou.dogfood.json': DE },
  en: { 'bijou.dogfood.json': EN },
  es: { 'bijou.dogfood.json': ES },
  fr: { 'bijou.dogfood.json': FR },
};

export function dogfoodI18nCatalogsForLocale(locale: string): readonly I18nCatalog[] {
  const files = Object.hasOwn(DOGFOOD_CATALOG_FILES, locale) ? DOGFOOD_CATALOG_FILES[locale] : undefined;
  if (files === undefined) throw new Error(`DOGFOOD has no i18n catalogs for locale ${locale}`);
  const catalogs = Object.keys(files)
    .sort((left, right) => left.localeCompare(right))
    .map((fileName) => readRuntimeCatalog(`${locale}/${fileName}`, files[fileName]));
  return Object.freeze(catalogs);
}

export const DOGFOOD_I18N_CATALOG: I18nCatalog = firstDogfoodI18nCatalog();

function firstDogfoodI18nCatalog(): I18nCatalog {
  const [catalog] = dogfoodI18nCatalogsForLocale('en');
  if (catalog == null) throw new Error('DOGFOOD English i18n catalog is missing');
  return catalog;
}

// Each call returns its own copy, as each read of the file did before.
function readRuntimeCatalog(file: string, imported: unknown): I18nCatalog {
  const parsed: unknown = structuredClone(imported);
  if (!isRuntimeCatalog(parsed)) {
    throw new Error(`Invalid DOGFOOD i18n catalog: missing namespace or entries at ${file}`);
  }
  return Object.freeze(parsed);
}

function isRuntimeCatalog(value: unknown): value is I18nCatalog {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  return 'namespace' in value
    && typeof value.namespace === 'string'
    && 'entries' in value
    && Array.isArray(value.entries);
}
