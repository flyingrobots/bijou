import type { CatalogBundle, ExchangeWorkbook } from './exchange.js';
import { exportCatalogBundle, exportTranslationWorkbook, importCatalogBundle, importTranslationWorkbook } from './exchange.js';
import type { AuthoringCatalog, TranslationRow } from './tools.js';

export interface ServiceExchangeSnapshot<T> {
  readonly value: T;
  readonly revision?: string;
}

export interface ServiceExchangeAdapter<T> {
  pull(): Promise<ServiceExchangeSnapshot<T>>;
  push(snapshot: ServiceExchangeSnapshot<T>): Promise<ServiceExchangeSnapshot<T>>;
}

export type ExchangeWorkbookServiceAdapter = ServiceExchangeAdapter<ExchangeWorkbook>;
export type CatalogBundleServiceAdapter = ServiceExchangeAdapter<CatalogBundle>;

export interface TranslationWorkbookServicePullResult {
  readonly snapshot: ServiceExchangeSnapshot<ExchangeWorkbook>;
  readonly rows: readonly TranslationRow[];
}

export interface CatalogBundleServicePullResult {
  readonly snapshot: ServiceExchangeSnapshot<CatalogBundle>;
  readonly catalogs: readonly AuthoringCatalog[];
}

export async function pullTranslationWorkbookFromService(
  adapter: ExchangeWorkbookServiceAdapter,
): Promise<TranslationWorkbookServicePullResult> {
  const snapshot = await adapter.pull();
  return {
    snapshot,
    rows: importTranslationWorkbook(snapshot.value),
  };
}

export async function pushTranslationWorkbookToService(
  adapter: ExchangeWorkbookServiceAdapter,
  catalogs: readonly AuthoringCatalog[],
  locale: string,
  snapshot: Omit<ServiceExchangeSnapshot<ExchangeWorkbook>, 'value'> = {},
): Promise<ServiceExchangeSnapshot<ExchangeWorkbook>> {
  return adapter.push({
    ...snapshot,
    value: exportTranslationWorkbook(catalogs, locale),
  });
}

export async function pullCatalogBundleFromService(
  adapter: CatalogBundleServiceAdapter,
): Promise<CatalogBundleServicePullResult> {
  const snapshot = await adapter.pull();
  return {
    snapshot,
    catalogs: importCatalogBundle(snapshot.value),
  };
}

export async function pushCatalogBundleToService(
  adapter: CatalogBundleServiceAdapter,
  catalogs: readonly AuthoringCatalog[],
  snapshot: Omit<ServiceExchangeSnapshot<CatalogBundle>, 'value'> = {},
): Promise<ServiceExchangeSnapshot<CatalogBundle>> {
  return adapter.push({
    ...snapshot,
    value: exportCatalogBundle(catalogs),
  });
}
