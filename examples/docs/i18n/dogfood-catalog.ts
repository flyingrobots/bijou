import { readdirSync, readFileSync } from 'node:fs';
import type { I18nCatalog } from '../../../packages/bijou-i18n/src/index.js';

export const DOGFOOD_I18N_NAMESPACE = 'bijou.dogfood';

const DOGFOOD_CATALOG_ROOT = new URL('./catalogs/', import.meta.url);

export function dogfoodI18nCatalogsForLocale(locale: string): readonly I18nCatalog[] {
  const localeRoot = new URL(`${encodeURIComponent(locale)}/`, DOGFOOD_CATALOG_ROOT);
  const catalogs = readdirSync(localeRoot)
    .filter((fileName) => fileName.endsWith('.json'))
    .sort((left, right) => left.localeCompare(right))
    .map((fileName) => readRuntimeCatalog(new URL(fileName, localeRoot)));
  return Object.freeze(catalogs);
}

export const DOGFOOD_I18N_CATALOG: I18nCatalog = firstDogfoodI18nCatalog();

function firstDogfoodI18nCatalog(): I18nCatalog {
  const [catalog] = dogfoodI18nCatalogsForLocale('en');
  if (catalog == null) throw new Error('DOGFOOD English i18n catalog is missing');
  return catalog;
}

function readRuntimeCatalog(url: URL): I18nCatalog {
  const parsed = JSON.parse(readFileSync(url, 'utf8')) as unknown;
  if (!isRuntimeCatalog(parsed)) {
    throw new Error(`Invalid DOGFOOD i18n catalog: missing namespace or entries at ${url.pathname}`);
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
