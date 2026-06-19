import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import {
  parseExchangeWorkbookXlsx,
  serializeExchangeWorkbookXlsx,
} from './index.js';

const TRANSLATION_COLUMNS = [
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

function writeWorkbookBytes(workbook: XLSX.WorkBook): Uint8Array {
  const output: unknown = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
  if (output instanceof Uint8Array) return new Uint8Array(output);
  if (output instanceof ArrayBuffer) return new Uint8Array(output);
  throw new Error('Expected XLSX workbook bytes');
}

describe('xlsx workbook adapters', () => {
  it('preserves workbook sheet order and columns through serialization', () => {
    const workbook = {
      version: 1 as const,
      sheets: [
        {
          name: 'translated-de',
          columns: TRANSLATION_COLUMNS,
          rows: [
            {
              namespace: 'shell',
              id: 'help',
              kind: 'message',
              sourceLocale: 'en',
              targetLocale: 'de',
              status: 'missing',
              sourceHash: 'abc12345',
              description: '',
              sourceValueKind: 'string',
              sourceValue: 'Help',
              translatedValueKind: '',
              translatedValue: '',
            },
          ],
        },
        {
          name: 'translated-fr',
          columns: TRANSLATION_COLUMNS,
          rows: [],
        },
      ],
    };

    const parsed = parseExchangeWorkbookXlsx(serializeExchangeWorkbookXlsx(workbook));
    expect(parsed.sheets.map((sheet) => sheet.name)).toEqual(['translated-de', 'translated-fr']);
    expect(parsed.sheets[0]?.columns).toEqual(TRANSLATION_COLUMNS);
  });

  it('fails clearly when a workbook sheet is missing a required header cell', () => {
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([
      ['namespace', '', 'kind'],
      ['shell', 'help', 'message'],
    ]);
    XLSX.utils.book_append_sheet(workbook, sheet, 'translated-de');

    const bytes = writeWorkbookBytes(workbook);
    expect(() => parseExchangeWorkbookXlsx(bytes))
      .toThrow(/missing required header/i);
  });

  it('normalizes non-string cells back into the exchange row shape', async () => {
    const tools = await import('../../bijou-i18n-tools/src/index.js');

    const workbook = XLSX.utils.book_new();
    const sourceHash = tools.hashSourceValue('Help');
    const sheet = XLSX.utils.aoa_to_sheet([
      [
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
      ],
      [
        'shell',
        'count',
        'message',
        'en',
        'de',
        'current',
        sourceHash,
        42,
        'string',
        'Items: {itemCount}',
        'string',
        7,
      ],
    ]);
    XLSX.utils.book_append_sheet(workbook, sheet, 'translated-de');

    const bytes = writeWorkbookBytes(workbook);
    const parsed = parseExchangeWorkbookXlsx(bytes);
    expect(parsed.sheets[0]?.rows[0]?.description).toBe('42');
    expect(parsed.sheets[0]?.rows[0]?.translatedValue).toBe('7');
  });
});
