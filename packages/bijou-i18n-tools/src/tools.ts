import {
  type I18nCatalog,
  type I18nCatalogEntry,
  type I18nCatalogKey,
  type I18nEntryKind,
  type I18nReference,
} from '@flyingrobots/bijou-i18n';

export { ref } from '@flyingrobots/bijou-i18n';

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

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }
  if (typeof value === 'object' && value !== null) {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entryValue]) => `${JSON.stringify(key)}:${stableStringify(entryValue)}`);
    return `{${entries.join(',')}}`;
  }
  return JSON.stringify(value);
}

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

export function hashSourceValue(value: unknown): string {
  const source = stableStringify(value);
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function markStaleTranslations(catalogs: readonly AuthoringCatalog[]): readonly AuthoringCatalog[] {
  return catalogs.map((catalog) => ({
    ...catalog,
    entries: catalog.entries.map((entry) => {
      const currentSourceHash = hashSourceValue(entry.sourceValue);
      const translations = Object.fromEntries(
        Object.entries(entry.translations).map(([locale, translation]) => [
          locale,
          {
            ...translation,
            status: translation.sourceHash === currentSourceHash ? 'current' : 'stale',
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

export function exportTranslationRows(
  catalogs: readonly AuthoringCatalog[],
  locale: string,
): readonly TranslationRow[] {
  const rows: TranslationRow[] = [];
  for (const catalog of catalogs) {
    for (const entry of catalog.entries) {
      const sourceHash = hashSourceValue(entry.sourceValue);
      const translation = entry.translations[locale];
      if (translation === undefined) {
        rows.push({
          namespace: entry.key.namespace,
          id: entry.key.id,
          kind: entry.kind,
          sourceLocale: entry.sourceLocale,
          targetLocale: locale,
          sourceValue: entry.sourceValue,
          status: 'missing',
          sourceHash,
          description: entry.description,
        });
        continue;
      }
      if (translation.status === 'current') {
        continue;
      }
      rows.push({
        namespace: entry.key.namespace,
        id: entry.key.id,
        kind: entry.kind,
        sourceLocale: entry.sourceLocale,
        targetLocale: locale,
        sourceValue: entry.sourceValue,
        translatedValue: translation.value,
        status: translation.status,
        sourceHash,
        description: entry.description,
      });
    }
  }
  return rows;
}

export function importTranslationRows(
  catalogs: readonly AuthoringCatalog[],
  rows: readonly TranslationRow[],
): readonly AuthoringCatalog[] {
  const rowsByKey = new Map<string, TranslationRow>();
  for (const row of rows) {
    rowsByKey.set(`${row.namespace}:${row.id}:${row.targetLocale}`, row);
  }

  return catalogs.map((catalog) => ({
    ...catalog,
    entries: catalog.entries.map((entry) => {
      const translations = { ...entry.translations } as Record<string, AuthoringTranslation>;
      for (const [rowKey, row] of rowsByKey.entries()) {
        const expectedPrefix = `${entry.key.namespace}:${entry.key.id}:`;
        if (!rowKey.startsWith(expectedPrefix)) {
          continue;
        }
        if (row.translatedValue === undefined) {
          continue;
        }
        translations[row.targetLocale] = {
          value: row.translatedValue,
          sourceHash: row.sourceHash,
          status: 'current',
        };
      }
      return {
        ...entry,
        translations,
      };
    }),
  }));
}

function validateAndResolve(
  entryMap: Map<string, AuthoringCatalogEntry>,
  value: unknown,
  seen: Set<string>,
): unknown {
  if (!isReference(value)) {
    return value;
  }
  const refKey = keyToString(value.$ref);
  if (seen.has(refKey)) {
    throw new Error(`Cyclic i18n tooling reference: ${refKey}`);
  }
  const referencedEntry = entryMap.get(refKey);
  if (referencedEntry === undefined) {
    throw new Error(`Missing i18n tooling reference: ${refKey}`);
  }
  seen.add(refKey);
  const resolved = validateAndResolve(entryMap, referencedEntry.sourceValue, seen);
  seen.delete(refKey);
  return resolved;
}

export function compileCatalogs(catalogs: readonly AuthoringCatalog[]): readonly I18nCatalog[] {
  const entryMap = new Map<string, AuthoringCatalogEntry>();
  for (const catalog of catalogs) {
    for (const entry of catalog.entries) {
      entryMap.set(keyToString(entry.key), entry);
    }
  }

  return catalogs.map((catalog) => ({
    namespace: catalog.namespace,
    entries: catalog.entries.map((entry) => {
      validateAndResolve(entryMap, entry.sourceValue, new Set<string>([keyToString(entry.key)]));
      for (const translation of Object.values(entry.translations)) {
        validateAndResolve(entryMap, translation.value, new Set<string>([keyToString(entry.key)]));
      }

      const values: Record<string, unknown> = {
        [entry.sourceLocale]: entry.sourceValue,
      };
      for (const [locale, translation] of Object.entries(entry.translations)) {
        values[locale] = translation.value;
      }
      const compiledEntry: I18nCatalogEntry = {
        key: entry.key,
        kind: entry.kind,
        sourceLocale: entry.sourceLocale,
        values,
      };
      return compiledEntry;
    }),
  }));
}

const PSEUDO_MAP: Readonly<Record<string, string>> = {
  a: 'à',
  b: 'ƀ',
  c: 'ç',
  d: 'đ',
  e: 'ë',
  f: 'ƒ',
  g: 'ğ',
  h: 'ħ',
  i: 'ï',
  j: 'ĵ',
  k: 'ķ',
  l: 'ľ',
  m: 'ɱ',
  n: 'ñ',
  o: 'ø',
  p: 'þ',
  q: 'ʠ',
  r: 'ř',
  s: 'š',
  t: 'ŧ',
  u: 'ü',
  v: 'ṽ',
  w: 'ŵ',
  x: 'ẋ',
  y: 'ÿ',
  z: 'ž',
  A: 'Å',
  B: 'ß',
  C: 'Ç',
  D: 'Ð',
  E: 'Ë',
  F: 'Ƒ',
  G: 'Ĝ',
  H: 'Ħ',
  I: 'Ï',
  J: 'Ĵ',
  K: 'Ҡ',
  L: 'Ŀ',
  M: 'Ṁ',
  N: 'Ń',
  O: 'Ø',
  P: 'Þ',
  Q: 'Ǫ',
  R: 'Ř',
  S: 'Š',
  T: 'Ŧ',
  U: 'Ü',
  V: 'Ṽ',
  W: 'Ŵ',
  X: 'Ẍ',
  Y: 'Ÿ',
  Z: 'Ž',
};

export function pseudoLocalize(value: string): string {
  let inPlaceholder = false;
  let result = '';
  for (const char of value) {
    if (char === '{') {
      inPlaceholder = true;
      result += char;
      continue;
    }
    if (char === '}') {
      inPlaceholder = false;
      result += char;
      continue;
    }
    if (inPlaceholder) {
      result += char;
      continue;
    }
    result += PSEUDO_MAP[char] ?? char;
  }
  return `[¡¡ ${result} ~~~ !!]`;
}
