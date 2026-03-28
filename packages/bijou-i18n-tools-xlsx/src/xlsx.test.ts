import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import {
  parseExchangeWorkbookXlsx,
  serializeExchangeWorkbookXlsx,
} from './index.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const TOOLS_ENTRY = resolve(ROOT, 'packages/bijou-i18n-tools/src/index.ts');
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

    const bytes = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' }) as Uint8Array;
    expect(() => parseExchangeWorkbookXlsx(bytes))
      .toThrow(/missing required header/i);
  });

  it('normalizes non-string cells back into the exchange row shape', async () => {
    const tools: typeof import('../../bijou-i18n-tools/src/index.js') = await import(TOOLS_ENTRY);

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

    const bytes = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' }) as Uint8Array;
    const parsed = parseExchangeWorkbookXlsx(bytes);
    expect(parsed.sheets[0]?.rows[0]?.description).toBe('42');
    expect(parsed.sheets[0]?.rows[0]?.translatedValue).toBe('7');
  });
});
