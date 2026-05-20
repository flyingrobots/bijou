import type { I18nCatalog } from '@flyingrobots/bijou-i18n';
import { compileCatalogs, importCatalogBundle } from '@flyingrobots/bijou-i18n-tools';
import {
  readCatalogBundleFile,
  readRuntimeCatalogFilesForLocale,
} from './filesystem.js';

export interface CatalogBundleFileLoaderOptions {
  readonly resolvePath: (locale: string) => string;
}

export interface RuntimeCatalogDirectoryLoaderOptions {
  readonly rootDir: string;
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

/**
 * Create a runtime loader that reads only the selected locale directory of
 * generated per-catalog JSON files.
 */
export function createRuntimeCatalogDirectoryLoader(
  options: RuntimeCatalogDirectoryLoaderOptions,
): (locale: string) => Promise<readonly I18nCatalog[]> {
  return async (locale: string) => readRuntimeCatalogFilesForLocale(options.rootDir, locale);
}
