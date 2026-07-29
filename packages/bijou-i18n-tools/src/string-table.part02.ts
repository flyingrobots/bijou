import {
  parseDelimitedSheet,
  serializeDelimitedSheet,
  type DelimitedFormat,
  type DelimitedSheet,
} from './adapters.js';
import { encodeExchangeValue } from './exchange.js';
import { type AuthoringCatalog } from './tools.js';
import {
  type StringTable,
  type StringTableRow,
  STRING_TABLE_COLUMNS,
  assertStringTableRow,
} from './string-table.part01.js';

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
        const translation =
          locale === entry.sourceLocale
            ? {
                value: entry.sourceValue,
                status: 'current' as const,
              }
            : entry.translations[locale];
        const encodedValue =
          translation?.value === undefined
            ? undefined
            : encodeExchangeValue(translation.value);
        rows.push(
          Object.freeze({
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
          }),
        );
      }
    }
  }
  return Object.freeze({
    columns: STRING_TABLE_COLUMNS,
    rows: Object.freeze(rows.sort(compareRows)),
  });
}
export function parseStringTable(
  input: string,
  format: DelimitedFormat,
): StringTable {
  const sheet = parseDelimitedSheet(input, format);
  return stringTableFromDelimitedSheet(sheet);
}
export function serializeStringTable(
  table: StringTable,
  format: DelimitedFormat,
): string {
  return serializeDelimitedSheet(
    {
      columns: STRING_TABLE_COLUMNS,
      rows: table.rows,
    },
    format,
  );
}
export function stringTableFromDelimitedSheet(
  sheet: DelimitedSheet,
): StringTable {
  if (!STRING_TABLE_COLUMNS.every((column) => sheet.columns.includes(column))) {
    throw new Error('Invalid string table: missing required columns');
  }
  return Object.freeze({
    columns: STRING_TABLE_COLUMNS,
    rows: Object.freeze(
      sheet.rows.map((row, index) =>
        assertStringTableRow(row, `row ${String(index + 2)}`),
      ),
    ),
  });
}

export function compareRows(
  left: StringTableRow,
  right: StringTableRow,
): number {
  return (
    left.namespace.localeCompare(right.namespace) ||
    left.id.localeCompare(right.id) ||
    left.locale.localeCompare(right.locale)
  );
}
