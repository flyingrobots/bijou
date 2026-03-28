import type { CatalogBundle, ExchangeSheet, TranslationWorkbookRow } from './exchange.js';
import { exportCatalogBundle, importCatalogBundle } from './exchange.js';

export type DelimitedFormat = 'csv' | 'tsv';

function delimiterFor(format: DelimitedFormat): string {
  return format === 'csv' ? ',' : '\t';
}

function escapeCell(value: string, delimiter: string): string {
  if (!value.includes(delimiter) && !value.includes('"') && !value.includes('\n') && !value.includes('\r')) {
    return value;
  }
  return `"${value.replaceAll('"', '""')}"`;
}

function serializeDelimitedRow(values: readonly string[], delimiter: string): string {
  return values.map((value) => escapeCell(value, delimiter)).join(delimiter);
}

function parseDelimited(input: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];

    if (inQuotes) {
      if (char === '"') {
        if (next === '"') {
          cell += '"';
          index += 1;
          continue;
        }
        inQuotes = false;
        continue;
      }
      cell += char;
      continue;
    }

    if (char === '"') {
      if (cell.length !== 0) {
        cell += char;
        continue;
      }
      inQuotes = true;
      continue;
    }

    if (char === delimiter) {
      row.push(cell);
      cell = '';
      continue;
    }

    if (char === '\r') {
      continue;
    }

    if (char === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
      continue;
    }

    cell += char;
  }

  if (inQuotes) {
    throw new Error('Invalid delimited sheet: unterminated quoted cell');
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}

function assertWorkbookRow(row: Record<string, string>, context: string): TranslationWorkbookRow {
  const required = [
    'namespace',
    'id',
    'kind',
    'sourceLocale',
    'targetLocale',
    'status',
    'sourceHash',
    'description',
    'sourceValueKind',
    'sourceValue',
    'translatedValueKind',
    'translatedValue',
  ] as const;

  for (const key of required) {
    if (typeof row[key] !== 'string') {
      throw new Error(`Invalid delimited sheet: missing ${key} in ${context}`);
    }
  }

  return row as unknown as TranslationWorkbookRow;
}

export function serializeExchangeSheet(sheet: ExchangeSheet, format: DelimitedFormat): string {
  const delimiter = delimiterFor(format);
  const lines = [
    serializeDelimitedRow(sheet.columns, delimiter),
    ...sheet.rows.map((row) => serializeDelimitedRow(
      sheet.columns.map((column) => {
        const value = row[column as keyof TranslationWorkbookRow];
        return typeof value === 'string' ? value : '';
      }),
      delimiter,
    )),
  ];
  return lines.join('\n');
}

export function parseExchangeSheet(
  name: string,
  input: string,
  format: DelimitedFormat,
): ExchangeSheet {
  const delimiter = delimiterFor(format);
  const rows = parseDelimited(input, delimiter);
  if (rows.length === 0) {
    throw new Error(`Invalid delimited sheet: empty ${name}`);
  }

  const [header, ...body] = rows;
  if (header === undefined) {
    throw new Error(`Invalid delimited sheet: missing header in ${name}`);
  }

  const columns = [...header];
  const parsedRows = body.map((cells, rowIndex) => {
    if (cells.length !== columns.length) {
      throw new Error(`Invalid delimited sheet: ragged row ${rowIndex + 2} in ${name}`);
    }
    const record = Object.fromEntries(columns.map((column, index) => [column, cells[index] ?? ''])) as Record<string, string>;
    return assertWorkbookRow(record, `${name}:${rowIndex + 2}`);
  });

  return {
    name,
    columns,
    rows: parsedRows,
  };
}

export function serializeCatalogBundleJson(bundle: CatalogBundle): string {
  return JSON.stringify(bundle, null, 2);
}

export function parseCatalogBundleJson(input: string): CatalogBundle {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch {
    throw new Error('Invalid catalog bundle json: malformed json');
  }

  try {
    return exportCatalogBundle(importCatalogBundle(parsed as CatalogBundle));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';
    throw new Error(`Invalid catalog bundle json: ${message}`);
  }
}
