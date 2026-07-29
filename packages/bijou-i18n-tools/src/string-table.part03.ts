import type { I18nCatalog, I18nCatalogEntry } from '@flyingrobots/bijou-i18n';
import {
  hashSourceValue,
  type AuthoringCatalog,
  type AuthoringCatalogEntry,
  type AuthoringTranslation,
} from './tools.js';
import {
  type StringTable,
  decode,
  rowKey,
} from './string-table.part01.js';

export function authoringCatalogsFromStringTable(
  table: StringTable,
): readonly AuthoringCatalog[] {
  const entriesByKey = new Map<string, AuthoringCatalogEntry>();
  for (const row of table.rows) {
    const key = rowKey(row);
    const sourceValue = decode(row.sourceValueKind, row.sourceValue, key);
    const existing = entriesByKey.get(key);
    const entry: AuthoringCatalogEntry = existing ?? {
      key: { namespace: row.namespace, id: row.id },
      kind: row.kind,
      sourceLocale: row.sourceLocale,
      sourceValue,
      translations: {},
      ...(row.description === '' ? {} : { description: row.description }),
    };
    if (existing !== undefined) {
      if (
        existing.kind !== row.kind ||
        existing.sourceLocale !== row.sourceLocale
      ) {
        throw new Error(
          `Invalid string table: conflicting entry metadata for ${key}`,
        );
      }
      if (
        JSON.stringify(existing.sourceValue) !== JSON.stringify(sourceValue)
      ) {
        throw new Error(
          `Invalid string table: conflicting source value for ${key}`,
        );
      }
    }

    if (
      row.locale !== row.sourceLocale &&
      row.status !== 'missing' &&
      row.valueKind !== ''
    ) {
      const translations: Record<string, AuthoringTranslation> = {
        ...entry.translations,
      };
      translations[row.locale] = {
        value: decode(row.valueKind, row.value, `${key}:${row.locale}`),
        sourceHash: hashSourceValue(sourceValue),
        status: row.status,
      };
      entriesByKey.set(key, {
        ...entry,
        translations,
      });
    } else if (existing === undefined) {
      entriesByKey.set(key, entry);
    }
  }

  const catalogs = new Map<string, AuthoringCatalogEntry[]>();
  for (const entry of entriesByKey.values()) {
    const catalogEntries = catalogs.get(entry.key.namespace) ?? [];
    catalogEntries.push(entry);
    catalogs.set(entry.key.namespace, catalogEntries);
  }

  return Object.freeze(
    [...catalogs.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([namespace, entries]) =>
        Object.freeze({
          namespace,
          entries: Object.freeze(
            entries.sort((left, right) =>
              left.key.id.localeCompare(right.key.id),
            ),
          ),
        }),
      ),
  );
}
export function runtimeCatalogsForLocaleFromStringTable(
  table: StringTable,
  locale: string,
): readonly I18nCatalog[] {
  const catalogs = authoringCatalogsFromStringTable(table);
  return Object.freeze(
    catalogs.map((catalog) =>
      Object.freeze({
        namespace: catalog.namespace,
        entries: Object.freeze(
          catalog.entries.map((entry) => runtimeEntryForLocale(entry, locale)),
        ),
      }),
    ),
  );
}
export function runtimeCatalogsByLocaleFromStringTable(
  table: StringTable,
): Readonly<Record<string, readonly I18nCatalog[]>> {
  const locales = [...new Set(table.rows.map((row) => row.locale))].sort(
    (left, right) => left.localeCompare(right),
  );
  return Object.freeze(
    Object.fromEntries(
      locales.map((locale) => [
        locale,
        runtimeCatalogsForLocaleFromStringTable(table, locale),
      ]),
    ),
  );
}
export function runtimeEntryForLocale(
  entry: AuthoringCatalogEntry,
  locale: string,
): I18nCatalogEntry {
  const values: Record<string, unknown> = {};
  const translation = entry.translations[locale];
  if (locale === entry.sourceLocale) {
    values[entry.sourceLocale] = entry.sourceValue;
  } else if (translation?.status === 'current') {
    values[locale] = translation.value;
  }
  return Object.freeze({
    key: entry.key,
    kind: entry.kind,
    sourceLocale: entry.sourceLocale,
    values: Object.freeze(values),
  });
}
