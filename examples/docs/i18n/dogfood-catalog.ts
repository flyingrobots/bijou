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

export const DOGFOOD_I18N_CATALOG: I18nCatalog = dogfoodI18nCatalogsForLocale('en')[0]!;

function readRuntimeCatalog(url: URL): I18nCatalog {
  const parsed = JSON.parse(readFileSync(url, 'utf8')) as unknown;
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error(`Invalid DOGFOOD i18n catalog: expected object at ${url.pathname}`);
  }
  const namespace = (parsed as { namespace?: unknown }).namespace;
  const entries = (parsed as { entries?: unknown }).entries;
  if (typeof namespace !== 'string' || !Array.isArray(entries)) {
    throw new Error(`Invalid DOGFOOD i18n catalog: missing namespace or entries at ${url.pathname}`);
  }
  return Object.freeze(parsed as I18nCatalog);
}
