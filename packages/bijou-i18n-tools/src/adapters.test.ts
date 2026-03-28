import { describe, expect, it } from 'vitest';
import {
  exportCatalogBundle,
  exportTranslationWorkbook,
  parseCatalogBundleJson,
  parseExchangeSheet,
  serializeCatalogBundleJson,
  serializeExchangeSheet,
} from './index.js';

describe('bijou-i18n-tools adapters', () => {
  it('serializes CSV cells with correct quoting and escaping', () => {
    const csv = serializeExchangeSheet({
      name: 'translations-de',
      columns: ['namespace', 'id', 'sourceValue'],
      rows: [
        {
          namespace: 'shell',
          id: 'help',
          sourceValue: 'Help, "now"',
        } as unknown as never,
      ],
    } as Parameters<typeof serializeExchangeSheet>[0], 'csv');

    expect(csv).toContain('"Help, ""now"""');
  });

  it('roundtrips TSV cells with tabs and newlines intact', () => {
    const sheet = exportTranslationWorkbook([
      {
        namespace: 'shell',
        entries: [
          {
            key: { namespace: 'shell', id: 'help' },
            kind: 'message',
            sourceLocale: 'en',
            sourceValue: 'Help\tme\nnow',
            translations: {},
          },
        ],
      },
    ], 'de').sheets[0]!;

    const tsv = serializeExchangeSheet(sheet, 'tsv');
    const parsed = parseExchangeSheet(sheet.name, tsv, 'tsv');

    expect(parsed.rows[0]?.sourceValue).toBe('Help\tme\nnow');
  });

  it('rejects ragged delimited rows', () => {
    expect(() => parseExchangeSheet('translations-de', 'namespace,id\nshell', 'csv'))
      .toThrow(/Invalid delimited sheet/);
  });

  it('roundtrips catalog bundles through JSON', () => {
    const json = serializeCatalogBundleJson(exportCatalogBundle([
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
    ]));

    expect(parseCatalogBundleJson(json).version).toBe(1);
  });

  it('rejects malformed catalog bundle json payloads', () => {
    expect(() => parseCatalogBundleJson('{"version":2,"catalogs":[]}'))
      .toThrow(/Invalid catalog bundle json/);
  });
});
