import type {
  LocalizedObject,
  LocalizationRequest,
} from './localization.part01.js';

export type I18nDirection = 'ltr' | 'rtl' | 'auto';

export interface I18nCatalogKey {
  readonly namespace: string;
  readonly id: string;
}

export type I18nEntryKind = 'message' | 'resource' | 'data';

export interface I18nReference {
  readonly $ref: I18nCatalogKey;
}

export interface I18nCatalogEntry<T = unknown> {
  readonly key: I18nCatalogKey;
  readonly kind: I18nEntryKind;
  readonly sourceLocale: string;
  readonly values: Readonly<Record<string, T | I18nReference>>;
  readonly fallbackValue?: T;
}

export interface I18nCatalog {
  readonly namespace: string;
  readonly entries: readonly I18nCatalogEntry[];
}

export interface I18nFormatterPort {
  formatNumber(value: number, locale: string): string;
  formatDate(value: Date, locale: string): string;
  formatTime(value: Date, locale: string): string;
  formatList(values: readonly string[], locale: string): string;
}

export type I18nCatalogLoader = (
  locale: string,
) => Promise<readonly I18nCatalog[]>;

export type I18nMissingReason = 'missing-key' | 'missing-locale';

export interface I18nMissingMessageContext {
  readonly key: I18nCatalogKey;
  readonly locale: string;
  readonly fallbackLocale: string;
  readonly sourceLocale?: string;
  readonly reason: I18nMissingReason;
}

export type I18nMissingMessageFormatter = (
  context: I18nMissingMessageContext,
) => string;

export interface I18nRuntimeOptions {
  readonly locale: string;
  readonly direction: I18nDirection;
  readonly fallbackLocale?: string;
  readonly formatter?: Partial<I18nFormatterPort>;
  readonly fallbackCatalogs?: readonly I18nCatalog[];
  readonly catalogs?: readonly I18nCatalog[];
  readonly loader?: I18nCatalogLoader;
  readonly missingMessage?: I18nMissingMessageFormatter;
}

export interface I18nRuntime extends I18nFormatterPort {
  readonly locale: string;
  readonly direction: I18nDirection;
  loadCatalog(catalog: I18nCatalog): void;
  loadCatalogs(catalogs: readonly I18nCatalog[]): void;
  unloadCatalog(namespace: string): void;
  preloadLocale(locale: string): Promise<void>;
  setLocale(locale: string, direction?: I18nDirection): Promise<void>;
  localize(request: LocalizationRequest): LocalizedObject;
  t(key: I18nCatalogKey, values?: Readonly<Record<string, unknown>>): string;
  resource(key: I18nCatalogKey): unknown;
}

export interface RuntimeLocaleState {
  locale: string;
  direction: I18nDirection;
}
