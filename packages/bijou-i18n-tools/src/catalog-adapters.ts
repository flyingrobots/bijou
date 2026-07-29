import {
  assertCatalogBundle,
  assertWorkbookRow,
} from './adapter-guards.js';
import {
  parseDelimitedSheet,
  serializeDelimitedSheet,
  type DelimitedFormat,
} from './delimited-adapters.js';
import type { CatalogBundle, ExchangeSheet } from './exchange.js';
import {
  exportCatalogBundle,
  importCatalogBundle,
} from './exchange.js';

export function serializeExchangeSheet(
  sheet: ExchangeSheet,
  format: DelimitedFormat,
): string {
  return serializeDelimitedSheet(sheet, format);
}

export function parseExchangeSheet(
  name: string,
  input: string,
  format: DelimitedFormat,
): ExchangeSheet {
  const sheet = parseDelimitedSheet(input, format);
  const parsedRows = sheet.rows.map((row, rowIndex) =>
    assertWorkbookRow({ ...row }, `${name}:${String(rowIndex + 2)}`)
  );
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
