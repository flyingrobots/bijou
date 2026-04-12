import type { I18nCatalog } from '@flyingrobots/bijou-i18n';
import { compileCatalogs, importCatalogBundle } from '@flyingrobots/bijou-i18n-tools';
import { readCatalogBundleFile } from './filesystem.js';

export interface CatalogBundleFileLoaderOptions {
  readonly resolvePath: (locale: string) => string;
}

/**
 * Create a runtime loader that reads per-locale catalog bundle files and
 * compiles them into runtime catalogs.
 */
export function createCatalogBundleFileLoader(
  options: CatalogBundleFileLoaderOptions,
): (locale: string) => Promise<readonly I18nCatalog[]> {
  return async (locale: string) => {
    const bundle = await readCatalogBundleFile(options.resolvePath(locale));
    return compileCatalogs(importCatalogBundle(bundle));
  };
}
