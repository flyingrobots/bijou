import type { CatalogBundle, ExchangeSheet } from './exchange.js';
import { exportCatalogBundle, importCatalogBundle } from './exchange.js';
import { assertCatalogBundle, assertWorkbookRow, delimitedRowFromCells, serializedCell } from './adapter-guards.js';

export type DelimitedFormat = 'csv' | 'tsv';

export interface DelimitedSheet {
  readonly columns: readonly string[];
  readonly rows: readonly Readonly<Record<string, string>>[];
}

export interface DelimitedSheetInput {
  readonly columns: readonly string[];
  readonly rows: readonly object[];
}

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
    const char = input.charAt(index);
    const next = input.charAt(index + 1);

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

export function serializeDelimitedSheet(sheet: DelimitedSheetInput, format: DelimitedFormat): string {
  const delimiter = delimiterFor(format);
  const lines = [
    serializeDelimitedRow(sheet.columns, delimiter),
    ...sheet.rows.map((row) => serializeDelimitedRow(
      sheet.columns.map((column) => serializedCell(row, column)),
      delimiter,
    )),
  ];
  return lines.join('\n');
}

export function parseDelimitedSheet(input: string, format: DelimitedFormat): DelimitedSheet {
  const delimiter = delimiterFor(format);
  const rows = parseDelimited(input, delimiter);
  if (rows.length === 0) {
    throw new Error('Invalid delimited sheet: empty input');
  }

  const [header, ...body] = rows;
  if (header === undefined) {
    throw new Error('Invalid delimited sheet: missing header');
  }

  const columns = [...header];
  const parsedRows = body.map((cells, rowIndex) => {
    if (cells.length !== columns.length) {
      throw new Error(`Invalid delimited sheet: ragged row ${String(rowIndex + 2)}`);
    }
    return delimitedRowFromCells(columns, cells);
  });

  return Object.freeze({
    columns: Object.freeze(columns),
    rows: Object.freeze(parsedRows),
  });
}

export function serializeExchangeSheet(sheet: ExchangeSheet, format: DelimitedFormat): string {
  return serializeDelimitedSheet(sheet, format);
}

export function parseExchangeSheet(
  name: string,
  input: string,
  format: DelimitedFormat,
): ExchangeSheet {
  const sheet = parseDelimitedSheet(input, format);
  const parsedRows = sheet.rows.map((row, rowIndex) => {
    const record = { ...row };
    return assertWorkbookRow(record, `${name}:${String(rowIndex + 2)}`);
  });

  return {
    name,
    columns: sheet.columns,
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
    assertCatalogBundle(parsed);
    return exportCatalogBundle(importCatalogBundle(parsed));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';
    throw new Error(`Invalid catalog bundle json: ${message}`, { cause: error });
  }
}
