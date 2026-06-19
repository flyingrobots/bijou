import { describe, expect, it } from 'vitest';
import {
  pullCatalogBundleFromService,
  pullTranslationWorkbookFromService,
  pushCatalogBundleToService,
  pushTranslationWorkbookToService,
  type CatalogBundle,
  type CatalogBundleServiceAdapter,
  type ExchangeWorkbookServiceAdapter,
  type ServiceExchangeSnapshot,
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
      pull() {
        return Promise.reject(new Error('not used'));
      },
      push(snapshot) {
        pushedRevision = snapshot.revision;
        pushedSheetName = snapshot.value.sheets[0]?.name;
        return Promise.resolve({
          ...snapshot,
          revision: 'sheet-rev-2',
        });
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
          pull() {
            return Promise.reject(new Error('not used'));
          },
          push(snapshot) {
            return Promise.resolve(snapshot);
          },
        }, authoringCatalogs, 'de', { revision: 'sheet-rev-9' });
        return pushed;
      },
      push(snapshot) {
        return Promise.resolve(snapshot);
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
    let stored: ServiceExchangeSnapshot<CatalogBundle> = {
      revision: 'bundle-rev-1',
      value: { version: 1 as const, catalogs: [] },
    };
    const adapter: CatalogBundleServiceAdapter = {
      pull() {
        return Promise.resolve(stored);
      },
      push(snapshot) {
        stored = {
          ...snapshot,
          revision: 'bundle-rev-2',
        };
        return Promise.resolve(stored);
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
