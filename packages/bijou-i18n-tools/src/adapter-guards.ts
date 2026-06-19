import type { CatalogBundle, TranslationWorkbookRow } from './exchange.js';

const WORKBOOK_COLUMNS = [
  'namespace', 'id', 'kind', 'sourceLocale', 'targetLocale', 'status', 'sourceHash', 'description',
  'sourceValueKind', 'sourceValue', 'translatedValueKind', 'translatedValue',
] as const;

export function assertWorkbookRow(row: Record<string, string>, context: string): TranslationWorkbookRow {
  for (const key of WORKBOOK_COLUMNS) {
    if (typeof row[key] !== 'string') throw new Error(`Invalid delimited sheet: missing ${key} in ${context}`);
  }
  if (!isWorkbookRow(row)) throw new Error(`Invalid delimited sheet: malformed row in ${context}`);
  return row;
}

export function serializedCell(row: object, column: string): string {
  const value: unknown = Object.getOwnPropertyDescriptor(row, column)?.value;
  return typeof value === 'string' ? value : '';
}

export function delimitedRowFromCells(
  columns: readonly string[],
  cells: readonly string[],
): Readonly<Record<string, string>> {
  const row: Record<string, string> = {};
  columns.forEach((column, index) => {
    row[column] = cells[index] ?? '';
  });
  return Object.freeze(row);
}

export function assertCatalogBundle(value: unknown): asserts value is CatalogBundle {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error('Invalid catalog bundle json: expected object');
  if (!('version' in value) || typeof value.version !== 'number') throw new Error('Invalid catalog bundle json: expected version');
  if (!('catalogs' in value) || !Array.isArray(value.catalogs)) throw new Error('Invalid catalog bundle json: expected catalogs array');
}

function isWorkbookRow(row: Readonly<Record<string, string>>): row is TranslationWorkbookRow {
  return WORKBOOK_COLUMNS.every((column) => column in row);
}
