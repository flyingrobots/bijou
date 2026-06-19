import * as XLSX from 'xlsx';
import type { ExchangeWorkbook, TranslationWorkbookRow } from '@flyingrobots/bijou-i18n-tools';

const REQUIRED_TRANSLATION_COLUMNS = [
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
type TranslationWorkbookColumn = typeof REQUIRED_TRANSLATION_COLUMNS[number];
const TRANSLATION_COLUMN_SET = new Set<string>(REQUIRED_TRANSLATION_COLUMNS);

function normalizeCell(value: unknown): string {
  if (value === undefined || value === null) {
    return '';
  }
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') return String(value);
  if (value instanceof Date) return value.toISOString();
  return '';
}

function toWorkbookInput(input: Uint8Array | ArrayBuffer): Uint8Array {
  return input instanceof Uint8Array ? input : new Uint8Array(input);
}

function assertWorkbookHeaders(columns: readonly string[], sheetName: string): void {
  if (columns.length === 0) {
    throw new Error(`Invalid XLSX workbook sheet: missing header row in ${sheetName}`);
  }

  const seen = new Set<string>();
  for (const [index, column] of columns.entries()) {
    if (column.trim() === '') {
      throw new Error(`Invalid XLSX workbook sheet: missing required header at column ${String(index + 1)} in ${sheetName}`);
    }
    if (seen.has(column)) {
      throw new Error(`Invalid XLSX workbook sheet: duplicate header ${column} in ${sheetName}`);
    }
    seen.add(column);
  }

  for (const required of REQUIRED_TRANSLATION_COLUMNS) {
    if (!seen.has(required)) {
      throw new Error(`Invalid XLSX workbook sheet: missing required header ${required} in ${sheetName}`);
    }
  }
}

function assertWorkbookRow(
  row: Record<string, string>,
  context: string,
): TranslationWorkbookRow {
  const cell = (key: TranslationWorkbookColumn): string => {
    const value = row[key];
    if (typeof value === 'string') return value;
    throw new Error(`Invalid XLSX workbook sheet: missing ${key} in ${context}`);
  }

  return {
    namespace: cell('namespace'), id: cell('id'), kind: cell('kind'),
    sourceLocale: cell('sourceLocale'), targetLocale: cell('targetLocale'), status: cell('status'),
    sourceHash: cell('sourceHash'), description: cell('description'),
    sourceValueKind: cell('sourceValueKind'), sourceValue: cell('sourceValue'),
    translatedValueKind: cell('translatedValueKind'), translatedValue: cell('translatedValue'),
  };
}

function isTranslationWorkbookColumn(column: string): column is TranslationWorkbookColumn {
  return TRANSLATION_COLUMN_SET.has(column);
}

function workbookCell(row: TranslationWorkbookRow, column: string): string {
  return isTranslationWorkbookColumn(column) ? row[column] : '';
}

export function serializeExchangeWorkbookXlsx(workbook: ExchangeWorkbook): Uint8Array {
  const book = XLSX.utils.book_new();

  for (const sheet of workbook.sheets) {
    const rows = [
      [...sheet.columns],
      ...sheet.rows.map((row) => sheet.columns.map((column) => workbookCell(row, column))),
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(book, worksheet, sheet.name);
  }

  const output: unknown = XLSX.write(book, { bookType: 'xlsx', type: 'array' });
  if (output instanceof Uint8Array) return new Uint8Array(output);
  if (output instanceof ArrayBuffer) return new Uint8Array(output);
  throw new Error('Invalid XLSX serializer output: expected binary workbook bytes');
}

export function parseExchangeWorkbookXlsx(input: Uint8Array | ArrayBuffer): ExchangeWorkbook {
  const workbook = XLSX.read(toWorkbookInput(input), { type: 'array' });
  const sheets = workbook.SheetNames.map((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    if (worksheet === undefined) {
      throw new Error(`Invalid XLSX workbook: missing sheet ${sheetName}`);
    }

    const matrix = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      raw: false,
      defval: '',
    });

    if (matrix.length === 0) {
      throw new Error(`Invalid XLSX workbook sheet: missing header row in ${sheetName}`);
    }

    const header = matrix[0];
    if (!Array.isArray(header)) {
      throw new Error(`Invalid XLSX workbook sheet: malformed header row in ${sheetName}`);
    }
    const columns = header.map((value) => normalizeCell(value));
    assertWorkbookHeaders(columns, sheetName);

    const rows = matrix.slice(1).map((entry, rowIndex) => {
      const cells = Array.isArray(entry) ? entry : [];
      const record = Object.fromEntries(
        columns.map((column, index) => [column, normalizeCell(cells[index])]),
      ) as Record<string, string>;
      return assertWorkbookRow(record, `${sheetName}:${String(rowIndex + 2)}`);
    });

    return {
      name: sheetName,
      columns,
      rows,
    };
  });

  return { version: 1, sheets };
}
