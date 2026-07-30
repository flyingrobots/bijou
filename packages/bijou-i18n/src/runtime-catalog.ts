import type {
  I18nCatalog,
  I18nCatalogEntry,
  I18nCatalogKey,
  I18nCatalogLoader,
  I18nReference,
  I18nRuntimeOptions,
} from './runtime-contract.js';

export class RuntimeCatalogStore {
  readonly entries = new Map<string, I18nCatalogEntry>();
  readonly #fallback = new Map<string, I18nCatalog>();
  readonly #manual = new Map<string, I18nCatalog>();
  readonly #loader = new Map<string, I18nCatalog>();
  readonly #cache = new Map<string, readonly I18nCatalog[]>();
  readonly #load: I18nCatalogLoader | undefined;

  constructor(options: I18nRuntimeOptions) {
    this.#load = options.loader;
    this.#rememberAll(this.#manual, options.catalogs ?? []);
    this.#rememberAll(this.#fallback, options.fallbackCatalogs ?? []);
    this.#rebuild();
  }

  loadCatalog(catalog: I18nCatalog): void {
    this.#manual.set(catalog.namespace, catalog);
    this.#rebuild();
  }

  loadCatalogs(catalogs: readonly I18nCatalog[]): void {
    this.#rememberAll(this.#manual, catalogs);
    this.#rebuild();
  }

  unloadCatalog(namespace: string): void {
    this.#manual.delete(namespace);
    this.#loader.delete(namespace);
    this.#rebuild();
  }

  async preloadLocale(locale: string): Promise<void> {
    if (this.#load === undefined || this.#cache.has(locale)) return;
    this.#cache.set(locale, await this.#load(locale));
  }

  async loadLocale(locale: string): Promise<boolean> {
    if (this.#load === undefined) return false;
    await this.preloadLocale(locale);
    this.#activateLoaderCatalogs(this.#cache.get(locale) ?? []);
    return true;
  }

  #activateLoaderCatalogs(catalogs: readonly I18nCatalog[]): void {
    const staged = new Map<string, I18nCatalog>();
    this.#rememberAll(staged, catalogs);
    const nextEntries = this.#buildEntries(staged);
    this.#loader.clear();
    this.#rememberAll(this.#loader, catalogs);
    this.#commit(nextEntries);
  }

  #rebuild(): void {
    this.#commit(this.#buildEntries(this.#loader));
  }

  #buildEntries(
    loaderCatalogs: ReadonlyMap<string, I18nCatalog>,
  ): Map<string, I18nCatalogEntry> {
    const entries = new Map<string, I18nCatalogEntry>();
    this.#apply(entries, this.#fallback);
    this.#apply(entries, this.#manual);
    this.#apply(entries, loaderCatalogs);
    return entries;
  }

  #apply(
    target: Map<string, I18nCatalogEntry>,
    source: ReadonlyMap<string, I18nCatalog>,
  ): void {
    for (const catalog of source.values()) {
      for (const entry of catalog.entries) {
        const key = keyToString(entry.key);
        const existing = target.get(key);
        target.set(
          key,
          existing === undefined ? entry : mergeCatalogEntry(existing, entry),
        );
      }
    }
  }

  #commit(nextEntries: ReadonlyMap<string, I18nCatalogEntry>): void {
    this.entries.clear();
    for (const [key, entry] of nextEntries) this.entries.set(key, entry);
  }

  #rememberAll(
    target: Map<string, I18nCatalog>,
    catalogs: readonly I18nCatalog[],
  ): void {
    for (const catalog of catalogs) target.set(catalog.namespace, catalog);
  }
}

export function keyToString(key: I18nCatalogKey): string {
  return `${key.namespace}:${key.id}`;
}

export function isReference(value: unknown): value is I18nReference {
  return typeof value === 'object'
    && value !== null
    && '$ref' in value
    && typeof (value as { $ref?: unknown }).$ref === 'object'
    && (value as { $ref?: unknown }).$ref !== null;
}

export function ref(key: I18nCatalogKey): I18nReference {
  return { $ref: key };
}

function mergeCatalogEntry(
  left: I18nCatalogEntry,
  right: I18nCatalogEntry,
): I18nCatalogEntry {
  if (left.kind !== right.kind || left.sourceLocale !== right.sourceLocale) {
    throw new Error(
      `Conflicting i18n catalog entry metadata for ${keyToString(left.key)}`,
    );
  }
  return {
    key: left.key,
    kind: left.kind,
    sourceLocale: left.sourceLocale,
    values: { ...left.values, ...right.values },
    fallbackValue: right.fallbackValue ?? left.fallbackValue,
  };
}
