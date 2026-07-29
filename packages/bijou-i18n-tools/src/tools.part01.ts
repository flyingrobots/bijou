import {
  type I18nCatalogKey,
  type I18nEntryKind,
  type I18nReference,
} from '@flyingrobots/bijou-i18n';

export type AuthoringTranslationStatus = 'current' | 'stale' | 'missing';
export interface AuthoringTranslation<T = unknown> {
  readonly value: T | I18nReference;
  readonly sourceHash: string;
  readonly status: AuthoringTranslationStatus;
}
export interface AuthoringCatalogEntry<T = unknown> {
  readonly key: I18nCatalogKey;
  readonly kind: I18nEntryKind;
  readonly sourceLocale: string;
  readonly sourceValue: T | I18nReference;
  readonly translations: Readonly<Record<string, AuthoringTranslation<T>>>;
  readonly description?: string;
}
export interface AuthoringCatalog {
  readonly namespace: string;
  readonly entries: readonly AuthoringCatalogEntry[];
}
export interface TranslationRow {
  readonly namespace: string;
  readonly id: string;
  readonly kind: I18nEntryKind;
  readonly sourceLocale: string;
  readonly targetLocale: string;
  readonly sourceValue: unknown;
  readonly translatedValue?: unknown;
  readonly status: AuthoringTranslationStatus;
  readonly sourceHash: string;
  readonly description?: string;
}
export function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }
  if (isJsonRecord(value)) {
    const entries = Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(
        ([key, entryValue]) =>
          `${JSON.stringify(key)}:${stableStringify(entryValue)}`,
      );
    return `{${entries.join(',')}}`;
  }
  return JSON.stringify(value);
}
export function isJsonRecord(
  value: unknown,
): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
export function keyToString(key: I18nCatalogKey): string {
  return `${key.namespace}:${key.id}`;
}
export function isReference(value: unknown): value is I18nReference {
  return (
    typeof value === 'object' &&
    value !== null &&
    '$ref' in value &&
    typeof (value as { $ref?: unknown }).$ref === 'object' &&
    (value as { $ref?: unknown }).$ref !== null
  );
}
export function hashSourceValue(value: unknown): string {
  const source = stableStringify(value);
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}
export function markStaleTranslations(
  catalogs: readonly AuthoringCatalog[],
): readonly AuthoringCatalog[] {
  return catalogs.map((catalog) => ({
    ...catalog,
    entries: catalog.entries.map((entry) => {
      const currentSourceHash = hashSourceValue(entry.sourceValue);
      const translations = Object.fromEntries(
        Object.entries(entry.translations).map(([locale, translation]) => [
          locale,
          {
            ...translation,
            status:
              translation.sourceHash === currentSourceHash
                ? 'current'
                : 'stale',
          } satisfies AuthoringTranslation,
        ]),
      );
      return {
        ...entry,
        translations,
      };
    }),
  }));
}
