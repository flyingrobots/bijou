import type {
  I18nCatalog,
  I18nCatalogEntry,
  I18nEntryKind,
} from '@flyingrobots/bijou-i18n';
import {
  parseDelimitedSheet,
  serializeDelimitedSheet,
  type DelimitedFormat,
  type DelimitedSheet,
} from './adapters.js';
import {
  decodeExchangeValue,
  encodeExchangeValue,
  type ExchangeValueKind,
} from './exchange.js';
import {
  hashSourceValue,
  type AuthoringCatalog,
  type AuthoringCatalogEntry,
  type AuthoringTranslation,
  type AuthoringTranslationStatus,
} from './tools.js';

export interface StringTableRow {
  readonly namespace: string;
  readonly id: string;
  readonly kind: string;
  readonly sourceLocale: string;
  readonly sourceValueKind: string;
  readonly sourceValue: string;
  readonly locale: string;
  readonly valueKind: string;
  readonly value: string;
  readonly status: string;
  readonly description: string;
}

export interface StringTable {
  readonly columns: readonly string[];
  readonly rows: readonly StringTableRow[];
}

const STRING_TABLE_COLUMNS = [
  'namespace',
  'id',
  'kind',
  'sourceLocale',
  'sourceValueKind',
  'sourceValue',
  'locale',
  'valueKind',
  'value',
  'status',
  'description',
] as const;

function isEntryKind(value: string): value is I18nEntryKind {
  return value === 'message' || value === 'resource' || value === 'data';
}

function isTranslationStatus(value: string): value is AuthoringTranslationStatus {
  return value === 'current' || value === 'stale' || value === 'missing';
}

function assertStringTableRow(row: Readonly<Record<string, string>>, context: string): StringTableRow {
  const namespace = requiredCell(row, 'namespace', context);
  const id = requiredCell(row, 'id', context);
  const kind = requiredCell(row, 'kind', context);
  const sourceLocale = requiredCell(row, 'sourceLocale', context);
  const sourceValueKind = requiredCell(row, 'sourceValueKind', context);
  const sourceValue = requiredCell(row, 'sourceValue', context);
  const locale = requiredCell(row, 'locale', context);
  const valueKind = requiredCell(row, 'valueKind', context);
  const value = requiredCell(row, 'value', context);
  const status = requiredCell(row, 'status', context);
  const description = requiredCell(row, 'description', context);

  if (!isEntryKind(kind)) {
    throw new Error(`Invalid string table: unknown entry kind ${kind} in ${context}`);
  }
  if (!isTranslationStatus(status)) {
    throw new Error(`Invalid string table: unknown status ${status} in ${context}`);
  }
  if (valueKind === '' && value !== '' && status !== 'missing') {
    throw new Error(`Invalid string table: missing valueKind in ${context}`);
  }
  return Object.freeze({
    namespace,
    id,
    kind,
    sourceLocale,
    sourceValueKind,
    sourceValue,
    locale,
    valueKind,
    value,
    status,
    description,
  });
}

function requiredCell(
  row: Readonly<Record<string, string>>,
  column: (typeof STRING_TABLE_COLUMNS)[number],
  context: string,
): string {
  const value = row[column];
  if (typeof value !== 'string') {
    throw new Error(`Invalid string table: missing ${column} in ${context}`);
  }
  return value;
}

function decode(kind: string, payload: string, context: string): unknown {
  try {
    return decodeExchangeValue({ kind: kind as ExchangeValueKind, payload });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';
    throw new Error(`Invalid string table value in ${context}: ${message}`);
  }
}

function rowKey(row: Pick<StringTableRow, 'namespace' | 'id'>): string {
  return `${row.namespace}:${row.id}`;
}

export function exportStringTable(
  catalogs: readonly AuthoringCatalog[],
  locales: readonly string[],
): StringTable {
  const rows: StringTableRow[] = [];
  for (const catalog of catalogs) {
    for (const entry of catalog.entries) {
      const encodedSource = encodeExchangeValue(entry.sourceValue);
      const sourceLocales = new Set([entry.sourceLocale, ...locales]);
      for (const locale of sourceLocales) {
        const translation = locale === entry.sourceLocale
          ? {
              value: entry.sourceValue,
              status: 'current' as const,
            }
          : entry.translations[locale];
        const encodedValue = translation?.value === undefined
          ? undefined
          : encodeExchangeValue(translation.value);
        rows.push(Object.freeze({
          namespace: entry.key.namespace,
          id: entry.key.id,
          kind: entry.kind,
          sourceLocale: entry.sourceLocale,
          sourceValueKind: encodedSource.kind,
          sourceValue: encodedSource.payload,
          locale,
          valueKind: encodedValue?.kind ?? '',
          value: encodedValue?.payload ?? '',
          status: translation?.status ?? 'missing',
          description: entry.description ?? '',
        }));
      }
    }
  }
  return Object.freeze({
    columns: STRING_TABLE_COLUMNS,
    rows: Object.freeze(rows.sort(compareRows)),
  });
}

export function parseStringTable(input: string, format: DelimitedFormat): StringTable {
  const sheet = parseDelimitedSheet(input, format);
  return stringTableFromDelimitedSheet(sheet);
}

export function serializeStringTable(table: StringTable, format: DelimitedFormat): string {
  return serializeDelimitedSheet({
    columns: STRING_TABLE_COLUMNS,
    rows: table.rows,
  }, format);
}

export function stringTableFromDelimitedSheet(sheet: DelimitedSheet): StringTable {
  if (!STRING_TABLE_COLUMNS.every((column) => sheet.columns.includes(column))) {
    throw new Error('Invalid string table: missing required columns');
  }
  return Object.freeze({
    columns: STRING_TABLE_COLUMNS,
    rows: Object.freeze(sheet.rows.map((row, index) => assertStringTableRow(row, `row ${index + 2}`))),
  });
}

export function authoringCatalogsFromStringTable(table: StringTable): readonly AuthoringCatalog[] {
  const entriesByKey = new Map<string, AuthoringCatalogEntry>();
  for (const row of table.rows) {
    const key = rowKey(row);
    const sourceValue = decode(row.sourceValueKind, row.sourceValue, key);
    const existing = entriesByKey.get(key);
    const entry: AuthoringCatalogEntry = existing ?? {
      key: { namespace: row.namespace, id: row.id },
      kind: row.kind as I18nEntryKind,
      sourceLocale: row.sourceLocale,
      sourceValue,
      translations: {},
      ...(row.description === '' ? {} : { description: row.description }),
    };
    if (existing !== undefined) {
      if (existing.kind !== row.kind || existing.sourceLocale !== row.sourceLocale) {
        throw new Error(`Invalid string table: conflicting entry metadata for ${key}`);
      }
      if (JSON.stringify(existing.sourceValue) !== JSON.stringify(sourceValue)) {
        throw new Error(`Invalid string table: conflicting source value for ${key}`);
      }
    }

    if (row.locale !== row.sourceLocale && row.status !== 'missing' && row.valueKind !== '') {
      const translations = { ...entry.translations } as Record<string, AuthoringTranslation>;
      translations[row.locale] = {
        value: decode(row.valueKind, row.value, `${key}:${row.locale}`),
        sourceHash: hashSourceValue(sourceValue),
        status: row.status as AuthoringTranslationStatus,
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

  return Object.freeze([...catalogs.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([namespace, entries]) => Object.freeze({
      namespace,
      entries: Object.freeze(entries.sort((left, right) => left.key.id.localeCompare(right.key.id))),
    })));
}

export function runtimeCatalogsForLocaleFromStringTable(
  table: StringTable,
  locale: string,
): readonly I18nCatalog[] {
  const catalogs = authoringCatalogsFromStringTable(table);
  return Object.freeze(catalogs.map((catalog) => Object.freeze({
    namespace: catalog.namespace,
    entries: Object.freeze(catalog.entries.map((entry) => runtimeEntryForLocale(entry, locale))),
  })));
}

export function runtimeCatalogsByLocaleFromStringTable(
  table: StringTable,
): Readonly<Record<string, readonly I18nCatalog[]>> {
  const locales = [...new Set(table.rows.map((row) => row.locale))].sort((left, right) => left.localeCompare(right));
  return Object.freeze(Object.fromEntries(
    locales.map((locale) => [locale, runtimeCatalogsForLocaleFromStringTable(table, locale)]),
  ));
}

function runtimeEntryForLocale(entry: AuthoringCatalogEntry, locale: string): I18nCatalogEntry {
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

function compareRows(left: StringTableRow, right: StringTableRow): number {
  return left.namespace.localeCompare(right.namespace)
    || left.id.localeCompare(right.id)
    || left.locale.localeCompare(right.locale);
}
