import { freezeLocalizedValue } from './localization.part02.js';
import {
  keyToString,
  RuntimeCatalogStore,
} from './runtime-catalog.js';
import type {
  I18nCatalogKey,
  I18nFormatterPort,
  I18nRuntime,
  I18nRuntimeOptions,
  RuntimeLocaleState,
} from './runtime-contract.js';
import { DEFAULT_FORMATTER } from './runtime-format.js';
import { localizeRequest } from './runtime-localize.js';
import {
  resolveLocalizedValue,
  type ResolutionContext,
} from './runtime-resolution.js';

export function createI18nRuntime(options: I18nRuntimeOptions): I18nRuntime {
  const catalogs = new RuntimeCatalogStore(options);
  const formatter: I18nFormatterPort = {
    ...DEFAULT_FORMATTER,
    ...(options.formatter ?? {}),
  };
  const state: RuntimeLocaleState = {
    locale: options.locale,
    direction: options.direction,
  };
  let localeRequestGeneration = 0;
  const context: ResolutionContext = {
    entries: catalogs.entries,
    state,
    fallbackLocale: options.fallbackLocale ?? 'en',
  };
  return {
    get locale() {
      return state.locale;
    },
    get direction() {
      return state.direction;
    },
    loadCatalog(catalog) {
      catalogs.loadCatalog(catalog);
    },
    loadCatalogs(nextCatalogs) {
      catalogs.loadCatalogs(nextCatalogs);
    },
    unloadCatalog(namespace) {
      catalogs.unloadCatalog(namespace);
    },
    preloadLocale(locale) {
      return catalogs.preloadLocale(locale);
    },
    async setLocale(locale, direction) {
      const generation = ++localeRequestGeneration;
      if (options.loader === undefined) {
        state.locale = locale;
        if (direction !== undefined) state.direction = direction;
        return;
      }
      const loaded = await catalogs.localeCatalogs(locale);
      if (generation !== localeRequestGeneration || loaded === undefined) {
        return;
      }
      catalogs.activateLoaderCatalogs(loaded);
      state.locale = locale;
      if (direction !== undefined) state.direction = direction;
    },
    localize(request) {
      return localizeRequest(request, context, options.missingMessage);
    },
    t(key, values = {}) {
      return translateMessage(key, values, catalogs, context, options);
    },
    resource(key) {
      const entry = catalogs.entries.get(keyToString(key));
      if (entry === undefined) return undefined;
      const resolved = resolveLocalizedValue(entry, context);
      return resolved === undefined
        ? undefined
        : freezeLocalizedValue(resolved);
    },
    formatNumber(value, locale) {
      return formatter.formatNumber(value, locale);
    },
    formatDate(value, locale) {
      return formatter.formatDate(value, locale);
    },
    formatTime(value, locale) {
      return formatter.formatTime(value, locale);
    },
    formatList(values, locale) {
      return formatter.formatList(values, locale);
    },
  };
}

export async function createI18nRuntimeAsync(
  options: I18nRuntimeOptions,
): Promise<I18nRuntime> {
  const runtime = createI18nRuntime(options);
  if (options.loader !== undefined) {
    await runtime.setLocale(options.locale, options.direction);
  }
  return runtime;
}

function translateMessage(
  key: I18nCatalogKey,
  values: Readonly<Record<string, unknown>>,
  catalogs: RuntimeCatalogStore,
  context: ResolutionContext,
  options: I18nRuntimeOptions,
): string {
  const entry = catalogs.entries.get(keyToString(key));
  if (entry !== undefined && entry.kind !== 'message') {
    throw new Error(
      `Expected message entry for ${keyToString(key)} but found ${entry.kind}`,
    );
  }
  const resolved = localizeRequest(
    { key, kind: 'message', values },
    context,
    options.missingMessage,
  );
  if (resolved.value === undefined) {
    throw new Error(`Missing i18n key: ${keyToString(key)}`);
  }
  if (typeof resolved.value !== 'string') {
    throw new Error(
      `Resolved message for ${keyToString(key)} was not a string`,
    );
  }
  return resolved.value;
}
