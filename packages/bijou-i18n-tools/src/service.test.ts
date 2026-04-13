import { describe, expect, it } from 'vitest';
import {
  pullCatalogBundleFromService,
  pullTranslationWorkbookFromService,
  pushCatalogBundleToService,
  pushTranslationWorkbookToService,
  type CatalogBundleServiceAdapter,
  type ExchangeWorkbookServiceAdapter,
} from './index.js';

const authoringCatalogs = [
  {
    namespace: 'shell',
    entries: [
      {
        key: { namespace: 'shell', id: 'help' },
        kind: 'message' as const,
        sourceLocale: 'en',
        sourceValue: 'Help',
        translations: {
          de: {
            value: 'Hilfe',
            sourceHash: 'deadbeef',
            status: 'stale' as const,
          },
        },
      },
    ],
  },
];

describe('bijou-i18n-tools service adapters', () => {
  it('pushes exported translation workbooks through a service adapter with revision metadata', async () => {
    let pushedRevision: string | undefined;
    let pushedSheetName: string | undefined;

    const adapter: ExchangeWorkbookServiceAdapter = {
      async pull() {
        throw new Error('not used');
      },
      async push(snapshot) {
        pushedRevision = snapshot.revision;
        pushedSheetName = snapshot.value.sheets[0]?.name;
        return {
          ...snapshot,
          revision: 'sheet-rev-2',
        };
      },
    };

    const result = await pushTranslationWorkbookToService(adapter, authoringCatalogs, 'de', {
      revision: 'sheet-rev-1',
    });

    expect(pushedRevision).toBe('sheet-rev-1');
    expect(pushedSheetName).toBe('translations-de');
    expect(result.revision).toBe('sheet-rev-2');
  });

  it('pulls translation workbook rows from a service adapter without losing revision metadata', async () => {
    const adapter: ExchangeWorkbookServiceAdapter = {
      async pull() {
        const pushed = await pushTranslationWorkbookToService({
          async pull() {
            throw new Error('not used');
          },
          async push(snapshot) {
            return snapshot;
          },
        }, authoringCatalogs, 'de', { revision: 'sheet-rev-9' });
        return pushed;
      },
      async push(snapshot) {
        return snapshot;
      },
    };

    const result = await pullTranslationWorkbookFromService(adapter);

    expect(result.snapshot.revision).toBe('sheet-rev-9');
    expect(result.rows).toEqual([
      expect.objectContaining({
        namespace: 'shell',
        id: 'help',
        targetLocale: 'de',
        translatedValue: 'Hilfe',
      }),
    ]);
  });

  it('pushes and pulls catalog bundles through the same service seam', async () => {
    let stored = {
      revision: 'bundle-rev-1',
      value: { version: 1 as const, catalogs: [] },
    };
    const adapter: CatalogBundleServiceAdapter = {
      async pull() {
        return stored;
      },
      async push(snapshot) {
        stored = {
          ...snapshot,
          revision: 'bundle-rev-2',
        };
        return stored;
      },
    };

    const pushed = await pushCatalogBundleToService(adapter, authoringCatalogs, {
      revision: 'bundle-rev-1',
    });
    expect(pushed.revision).toBe('bundle-rev-2');

    const pulled = await pullCatalogBundleFromService(adapter);
    expect(pulled.snapshot.revision).toBe('bundle-rev-2');
    expect(pulled.catalogs).toEqual(authoringCatalogs);
  });
});
