import { describe, expect, it } from 'vitest';
import {
  decodeExchangeValue,
  encodeExchangeValue,
  exportCatalogBundle,
  exportTranslationWorkbook,
  importCatalogBundle,
  importTranslationWorkbook,
  ref,
} from './index.js';

describe('bijou-i18n-tools exchange layer', () => {
  it('encodes and decodes typed values without losing refs or structured data', () => {
    expect(decodeExchangeValue(encodeExchangeValue('Help'))).toBe('Help');
    expect(decodeExchangeValue(encodeExchangeValue(true))).toBe(true);
    expect(decodeExchangeValue(encodeExchangeValue(null))).toBeNull();
    expect(decodeExchangeValue(encodeExchangeValue({ hotkey: '?', visible: true }))).toEqual({
      hotkey: '?',
      visible: true,
    });
    expect(decodeExchangeValue(encodeExchangeValue(ref({ namespace: 'shell', id: 'help' })))).toEqual(
      ref({ namespace: 'shell', id: 'help' }),
    );
  });

  it('keeps workbook rows string-cell-safe', () => {
    const workbook = exportTranslationWorkbook([
      {
        namespace: 'shell',
        entries: [
          {
            key: { namespace: 'shell', id: 'meta' },
            kind: 'data',
            sourceLocale: 'en',
            sourceValue: { hotkey: '?', visible: true },
            translations: {},
          },
        ],
      },
    ], 'de');

    for (const sheet of workbook.sheets) {
      for (const row of sheet.rows) {
        for (const value of Object.values(row)) {
          expect(typeof value).toBe('string');
        }
      }
    }
  });

  it('rejects malformed workbook rows', () => {
    expect(() => importTranslationWorkbook({
      version: 1,
      sheets: [
        {
          name: 'translations-de',
          columns: [
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
          rows: [
            {
              namespace: 'shell',
              id: 'help',
              kind: 'message',
              sourceLocale: 'en',
              targetLocale: 'de',
              status: 'stale',
              sourceHash: 'abc12345',
              description: '',
              sourceValueKind: 'reference',
              sourceValue: 'bad-ref-format',
              translatedValueKind: '',
              translatedValue: '',
            },
          ],
        },
      ],
    })).toThrow(/Invalid exchange value/);
  });

  it('rejects malformed catalog bundles', () => {
    expect(() => importCatalogBundle({
      version: 1,
      catalogs: [
        {
          namespace: 'shell',
          entries: [
            {
              key: { namespace: 'shell', id: 'help' },
              kind: 'message',
              sourceLocale: 'en',
              sourceValue: { kind: 'reference', payload: 'bad-ref-format' },
              translations: {},
            },
          ],
        },
      ],
    })).toThrow(/Invalid exchange value/);
  });

  it('exports catalog bundles with explicit typed values', () => {
    const bundle = exportCatalogBundle([
      {
        namespace: 'shell',
        entries: [
          {
            key: { namespace: 'shell', id: 'help' },
            kind: 'message',
            sourceLocale: 'en',
            sourceValue: 'Help',
            translations: {},
          },
        ],
      },
    ]);

    expect(bundle.version).toBe(1);
    expect(bundle.catalogs[0]?.entries[0]?.sourceValue).toEqual({
      kind: 'string',
      payload: 'Help',
    });
  });
});
