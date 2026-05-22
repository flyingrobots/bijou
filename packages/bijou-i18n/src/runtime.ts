import {
  freezeLocalizedObject,
  freezeLocalizedValue,
  type LocalizedObject,
  type LocalizationIssue,
  type LocalizationRequest,
  type LocalizationStatus,
} from './localization.js';

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

export type I18nCatalogLoader = (locale: string) => Promise<readonly I18nCatalog[]>;

export type I18nMissingReason = 'missing-key' | 'missing-locale';

export interface I18nMissingMessageContext {
  readonly key: I18nCatalogKey;
  readonly locale: string;
  readonly fallbackLocale: string;
  readonly sourceLocale?: string;
  readonly reason: I18nMissingReason;
}

export type I18nMissingMessageFormatter = (context: I18nMissingMessageContext) => string;

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
  localize<Value = unknown>(request: LocalizationRequest): LocalizedObject<Value>;
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

interface LocalizedResolution<T> {
  readonly status: LocalizationStatus;
  readonly value?: T;
  readonly issues: readonly LocalizationIssue[];
}

export function ref(key: I18nCatalogKey): I18nReference {
  return { $ref: key };
}

export function createI18nRuntime(options: I18nRuntimeOptions): I18nRuntime {
  const entries = new Map<string, I18nCatalogEntry>();
  const fallbackCatalogs = new Map<string, I18nCatalog>();
  const manualCatalogs = new Map<string, I18nCatalog>();
  const loaderCatalogs = new Map<string, I18nCatalog>();
  const loaderCache = new Map<string, readonly I18nCatalog[]>();
  const formatter: I18nFormatterPort = { ...DEFAULT_FORMATTER, ...(options.formatter ?? {}) };
  const fallbackLocale = options.fallbackLocale ?? 'en';
  let currentLocale = options.locale;
  let currentDirection = options.direction;

  function rememberCatalog(target: Map<string, I18nCatalog>, catalog: I18nCatalog): void {
    target.set(catalog.namespace, catalog);
  }

  function applyCatalogs(source: ReadonlyMap<string, I18nCatalog>): void {
    for (const catalog of source.values()) {
      for (const entry of catalog.entries) {
        const key = keyToString(entry.key);
        const existing = entries.get(key);
        entries.set(key, existing === undefined ? entry : mergeCatalogEntry(existing, entry));
      }
    }
  }

  function rebuildCatalogState(): void {
    entries.clear();
    applyCatalogs(fallbackCatalogs);
    applyCatalogs(manualCatalogs);
    applyCatalogs(loaderCatalogs);
  }

  function localizationIssue(
    code: LocalizationIssue['code'],
    key: I18nCatalogKey,
    message: string,
  ): LocalizationIssue {
    return {
      code,
      key,
      locale: currentLocale,
      fallbackLocale,
      message,
    };
  }

  function resolveLocalizedValueResult<T>(
    entry: I18nCatalogEntry<T>,
    seen: Set<string>,
    options: { readonly missingMessage?: I18nMissingMessageFormatter } = {},
  ): LocalizedResolution<T> {
    const localized = entry.values[currentLocale];
    if (localized !== undefined) {
      return resolveCandidateResult(localized, seen, options, 'translated');
    }

    if (
      options.missingMessage !== undefined
      && currentLocale !== entry.sourceLocale
      && currentLocale !== fallbackLocale
    ) {
      return {
        status: 'missing',
        value: options.missingMessage({
          key: entry.key,
          locale: currentLocale,
          fallbackLocale,
          sourceLocale: entry.sourceLocale,
          reason: 'missing-locale',
        }) as T,
        issues: [
          localizationIssue(
            'missing-locale',
            entry.key,
            `Missing selected-locale value for ${keyToString(entry.key)}`,
          ),
        ],
      };
    }

    const candidates = [
      entry.values[entry.sourceLocale],
      entry.values[fallbackLocale],
      entry.fallbackValue,
    ];

    for (const candidate of candidates) {
      if (candidate === undefined) {
        continue;
      }
      return resolveCandidateResult(candidate, seen, options, 'fallback');
    }

    return {
      status: 'missing',
      issues: [
        localizationIssue(
          'missing-locale',
          entry.key,
          `Missing localized value for ${keyToString(entry.key)}`,
        ),
      ],
    };
  }

  function resolveLocalizedValue<T>(
    entry: I18nCatalogEntry<T>,
    seen: Set<string>,
    options: { readonly missingMessage?: I18nMissingMessageFormatter } = {},
  ): T | undefined {
    return resolveLocalizedValueResult(entry, seen, options).value;
  }

  function mergeResolutionStatus(
    candidateStatus: LocalizationStatus,
    referencedStatus: LocalizationStatus,
  ): LocalizationStatus {
    if (candidateStatus === 'missing' || referencedStatus === 'missing') {
      return 'missing';
    }
    if (candidateStatus === 'fallback' || referencedStatus === 'fallback') {
      return 'fallback';
    }
    return 'translated';
  }

  function resolveCandidateResult<T>(
    candidate: T | I18nReference,
    seen: Set<string>,
    options: { readonly missingMessage?: I18nMissingMessageFormatter } = {},
    candidateStatus: LocalizationStatus,
  ): LocalizedResolution<T> {
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
      const resolved = resolveLocalizedValueResult<T>(referencedEntry as I18nCatalogEntry<T>, seen, options);
      seen.delete(refKey);
      if (resolved.value !== undefined) {
        return {
          status: mergeResolutionStatus(candidateStatus, resolved.status),
          value: resolved.value,
          issues: resolved.issues,
        };
      }
      throw new Error(`Missing i18n reference: ${refKey}`);
    }
    return {
      status: candidateStatus,
      value: candidate as T,
      issues: [],
    };
  }

  async function preloadLocale(locale: string): Promise<void> {
    if (options.loader === undefined || loaderCache.has(locale)) {
      return;
    }
    loaderCache.set(locale, await options.loader(locale));
  }

  async function activateLoaderLocale(locale: string): Promise<void> {
    if (options.loader === undefined) {
      return;
    }
    await preloadLocale(locale);
    loaderCatalogs.clear();
    for (const catalog of loaderCache.get(locale) ?? []) {
      rememberCatalog(loaderCatalogs, catalog);
    }
    rebuildCatalogState();
  }

  if (options.catalogs !== undefined) {
    for (const catalog of options.catalogs) {
      rememberCatalog(manualCatalogs, catalog);
    }
    rebuildCatalogState();
  }
  if (options.fallbackCatalogs !== undefined) {
    for (const catalog of options.fallbackCatalogs) {
      rememberCatalog(fallbackCatalogs, catalog);
    }
    rebuildCatalogState();
  }

  function localizeRequest<Value = unknown>(request: LocalizationRequest): LocalizedObject<Value> {
    const entry = entries.get(keyToString(request.key));
    const kind = request.kind ?? entry?.kind ?? 'message';
    const facts = [
      { kind: 'locale' as const, key: 'locale', value: currentLocale },
      { kind: 'direction' as const, key: 'direction', value: currentDirection },
    ];

    if (entry === undefined) {
      const issue = localizationIssue(
        'missing-key',
        request.key,
        `Missing i18n key: ${keyToString(request.key)}`,
      );
      const value = kind === 'message' && options.missingMessage !== undefined
        ? interpolate(options.missingMessage({
          key: request.key,
          locale: currentLocale,
          fallbackLocale,
          reason: 'missing-key',
        }), request.values ?? {}) as Value
        : undefined;

      return freezeLocalizedObject({
        key: request.key,
        locale: currentLocale,
        fallbackLocale,
        direction: currentDirection,
        kind,
        status: 'missing',
        value,
        issues: [issue],
        facts: [
          ...facts,
          { kind: 'localization-status', key: 'status', value: 'missing' },
          { kind: 'entry-kind', key: 'kind', value: kind },
        ],
      });
    }

    if (request.kind !== undefined && entry.kind !== request.kind) {
      const issue = localizationIssue(
        'kind-mismatch',
        request.key,
        `Expected ${request.kind} entry for ${keyToString(request.key)} but found ${entry.kind}`,
      );
      return freezeLocalizedObject({
        key: request.key,
        locale: currentLocale,
        fallbackLocale,
        sourceLocale: entry.sourceLocale,
        direction: currentDirection,
        kind: entry.kind,
        status: 'missing',
        issues: [issue],
        facts: [
          ...facts,
          { kind: 'localization-status', key: 'status', value: 'missing' },
          { kind: 'entry-kind', key: 'kind', value: entry.kind },
        ],
      });
    }

    const resolved = resolveLocalizedValueResult<Value>(entry as I18nCatalogEntry<Value>, new Set<string>(), {
      missingMessage: entry.kind === 'message' ? options.missingMessage : undefined,
    });
    let value = resolved.value;
    const issues = [...resolved.issues];

    if (entry.kind === 'message' && value !== undefined) {
      if (typeof value !== 'string') {
        issues.push(localizationIssue(
          'invalid-message-value',
          request.key,
          `Resolved message for ${keyToString(request.key)} was not a string`,
        ));
        value = undefined;
      } else {
        value = interpolate(value, request.values ?? {}) as Value;
      }
    }

    const status = issues.some((issue) => issue.code === 'invalid-message-value')
      ? 'missing'
      : resolved.status;

    return freezeLocalizedObject({
      key: request.key,
      locale: currentLocale,
      fallbackLocale,
      sourceLocale: entry.sourceLocale,
      direction: currentDirection,
      kind: entry.kind,
      status,
      value,
      issues,
      facts: [
        ...facts,
        { kind: 'localization-status', key: 'status', value: status },
        { kind: 'entry-kind', key: 'kind', value: entry.kind },
      ],
    });
  }

  return {
    get locale() {
      return currentLocale;
    },
    get direction() {
      return currentDirection;
    },
    loadCatalog(catalog) {
      rememberCatalog(manualCatalogs, catalog);
      rebuildCatalogState();
    },
    loadCatalogs(catalogs) {
      for (const catalog of catalogs) {
        rememberCatalog(manualCatalogs, catalog);
      }
      rebuildCatalogState();
    },
    unloadCatalog(namespace) {
      manualCatalogs.delete(namespace);
      loaderCatalogs.delete(namespace);
      rebuildCatalogState();
    },
    preloadLocale,
    async setLocale(locale, direction) {
      currentLocale = locale;
      if (direction !== undefined) {
        currentDirection = direction;
      }
      await activateLoaderLocale(locale);
    },
    localize<Value = unknown>(request: LocalizationRequest): LocalizedObject<Value> {
      return localizeRequest<Value>(request);
    },
    t(key, values = {}) {
      const entry = entries.get(keyToString(key));
      if (entry !== undefined && entry.kind !== 'message') {
        throw new Error(`Expected message entry for ${keyToString(key)} but found ${entry.kind}`);
      }
      const resolved = localizeRequest<string>({ key, kind: 'message', values });
      if (resolved.value === undefined) {
        throw new Error(`Missing i18n key: ${keyToString(key)}`);
      }
      if (typeof resolved.value !== 'string') {
        throw new Error(`Resolved message for ${keyToString(key)} was not a string`);
      }
      return resolved.value;
    },
    resource<T = unknown>(key: I18nCatalogKey): T | undefined {
      const entry = entries.get(keyToString(key));
      if (entry === undefined) {
        return undefined;
      }
      const resolved = resolveLocalizedValue(entry as I18nCatalogEntry<T>, new Set<string>());
      return resolved === undefined ? undefined : freezeLocalizedValue(resolved);
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

function mergeCatalogEntry(left: I18nCatalogEntry, right: I18nCatalogEntry): I18nCatalogEntry {
  if (left.kind !== right.kind || left.sourceLocale !== right.sourceLocale) {
    throw new Error(`Conflicting i18n catalog entry metadata for ${keyToString(left.key)}`);
  }
  return {
    key: left.key,
    kind: left.kind,
    sourceLocale: left.sourceLocale,
    values: {
      ...left.values,
      ...right.values,
    },
    fallbackValue: right.fallbackValue ?? left.fallbackValue,
  };
}

export async function createI18nRuntimeAsync(options: I18nRuntimeOptions): Promise<I18nRuntime> {
  const runtime = createI18nRuntime(options);
  if (options.loader !== undefined) {
    await runtime.setLocale(options.locale, options.direction);
  }
  return runtime;
}
