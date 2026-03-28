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

export interface I18nRuntimeOptions {
  readonly locale: string;
  readonly direction: I18nDirection;
  readonly fallbackLocale?: string;
  readonly formatter?: Partial<I18nFormatterPort>;
}

export interface I18nRuntime extends I18nFormatterPort {
  readonly locale: string;
  readonly direction: I18nDirection;
  loadCatalog(catalog: I18nCatalog): void;
  unloadCatalog(namespace: string): void;
  t(key: I18nCatalogKey, values?: Readonly<Record<string, unknown>>): string;
  resource<T = unknown>(key: I18nCatalogKey): T | undefined;
}

const DEFAULT_FORMATTER: I18nFormatterPort = {
  formatNumber(value, locale) {
    return new Intl.NumberFormat(locale).format(value);
  },
  formatDate(value, locale) {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(value);
  },
  formatTime(value, locale) {
    return new Intl.DateTimeFormat(locale, { timeStyle: 'short' }).format(value);
  },
  formatList(values, locale) {
    return new Intl.ListFormat(locale, { style: 'long', type: 'conjunction' }).format(values);
  },
};

function keyToString(key: I18nCatalogKey): string {
  return `${key.namespace}:${key.id}`;
}

function isReference(value: unknown): value is I18nReference {
  return typeof value === 'object'
    && value !== null
    && '$ref' in value
    && typeof (value as { $ref?: unknown }).$ref === 'object'
    && (value as { $ref?: unknown }).$ref !== null;
}

function interpolate(template: string, values: Readonly<Record<string, unknown>>): string {
  return template.replace(/\{([^}]+)\}/g, (_match, rawKey: string) => {
    const value = values[rawKey];
    return value === undefined ? `{${rawKey}}` : String(value);
  });
}

export function ref(key: I18nCatalogKey): I18nReference {
  return { $ref: key };
}

export function createI18nRuntime(options: I18nRuntimeOptions): I18nRuntime {
  const entries = new Map<string, I18nCatalogEntry>();
  const namespaces = new Map<string, string[]>();
  const formatter: I18nFormatterPort = { ...DEFAULT_FORMATTER, ...(options.formatter ?? {}) };
  const fallbackLocale = options.fallbackLocale ?? 'en';

  function getEntry(key: I18nCatalogKey): I18nCatalogEntry {
    const entry = entries.get(keyToString(key));
    if (entry === undefined) {
      throw new Error(`Missing i18n key: ${keyToString(key)}`);
    }
    return entry;
  }

  function resolveLocalizedValue<T>(
    entry: I18nCatalogEntry<T>,
    seen: Set<string>,
  ): T | undefined {
    const candidates = [
      entry.values[options.locale],
      entry.values[entry.sourceLocale],
      entry.values[fallbackLocale],
      entry.fallbackValue,
    ];

    for (const candidate of candidates) {
      if (candidate === undefined) {
        continue;
      }
      if (isReference(candidate)) {
        const refKey = keyToString(candidate.$ref);
        if (seen.has(refKey)) {
          throw new Error(`Cyclic i18n reference: ${refKey}`);
        }
        seen.add(refKey);
        const referencedEntry = entries.get(refKey);
        if (referencedEntry === undefined) {
          throw new Error(`Missing i18n reference: ${refKey}`);
        }
        const resolved = resolveLocalizedValue(referencedEntry, seen);
        seen.delete(refKey);
        if (resolved !== undefined) {
          return resolved as T;
        }
        throw new Error(`Missing i18n reference: ${refKey}`);
      }
      return candidate as T;
    }

    return undefined;
  }

  return {
    locale: options.locale,
    direction: options.direction,
    loadCatalog(catalog) {
      const scoped = namespaces.get(catalog.namespace) ?? [];
      for (const entry of catalog.entries) {
        const key = keyToString(entry.key);
        entries.set(key, entry);
        scoped.push(key);
      }
      namespaces.set(catalog.namespace, scoped);
    },
    unloadCatalog(namespace) {
      const scoped = namespaces.get(namespace);
      if (scoped === undefined) {
        return;
      }
      for (const key of scoped) {
        entries.delete(key);
      }
      namespaces.delete(namespace);
    },
    t(key, values = {}) {
      const entry = getEntry(key);
      if (entry.kind !== 'message') {
        throw new Error(`Expected message entry for ${keyToString(key)} but found ${entry.kind}`);
      }
      const resolved = resolveLocalizedValue(entry, new Set<string>());
      if (typeof resolved !== 'string') {
        throw new Error(`Resolved message for ${keyToString(key)} was not a string`);
      }
      return interpolate(resolved, values);
    },
    resource<T = unknown>(key: I18nCatalogKey): T | undefined {
      const entry = entries.get(keyToString(key));
      if (entry === undefined) {
        return undefined;
      }
      return resolveLocalizedValue(entry as I18nCatalogEntry<T>, new Set<string>());
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
