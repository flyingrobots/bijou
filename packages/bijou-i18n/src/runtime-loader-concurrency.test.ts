import { describe, expect, it, vi } from 'vitest';
import { createI18nRuntime } from './index.js';
import type { I18nCatalog, I18nCatalogLoader } from './index.js';

describe('bijou-i18n runtime loader concurrency', () => {
  it('keeps the newest locale request when an older load finishes last', async () => {
    const resolvers = new Map<
      string,
      (catalogs: readonly I18nCatalog[]) => void
    >();
    const loader = vi.fn<I18nCatalogLoader>((locale) =>
      new Promise((resolve) => {
        resolvers.set(locale, resolve);
      })
    );
    const runtime = createI18nRuntime({
      locale: 'en',
      direction: 'ltr',
      loader,
    });
    const french = runtime.setLocale('fr', 'ltr');
    const german = runtime.setLocale('de', 'rtl');

    resolvers.get('de')?.([catalog('de', 'Hallo')]);
    await german;
    resolvers.get('fr')?.([catalog('fr', 'Bonjour')]);
    await french;

    expect(runtime.locale).toBe('de');
    expect(runtime.direction).toBe('rtl');
    expect(runtime.t({ namespace: 'shell', id: 'greeting' })).toBe('Hallo');
  });

  it('coalesces concurrent locale loads and retries after rejection', async () => {
    let resolveFirst: ((catalogs: readonly I18nCatalog[]) => void) | undefined;
    const firstLoad = new Promise<readonly I18nCatalog[]>((resolve) => {
      resolveFirst = resolve;
    });
    const loader = vi.fn<I18nCatalogLoader>()
      .mockReturnValueOnce(firstLoad)
      .mockRejectedValueOnce(new Error('temporary loader failure'))
      .mockResolvedValueOnce([]);
    const runtime = createI18nRuntime({
      locale: 'en',
      direction: 'ltr',
      loader,
    });

    const preload = runtime.preloadLocale('fr');
    const duplicate = runtime.preloadLocale('fr');
    expect(loader).toHaveBeenCalledTimes(1);
    resolveFirst?.([]);
    await Promise.all([preload, duplicate]);

    await expect(runtime.preloadLocale('de')).rejects.toThrow(
      'temporary loader failure',
    );
    await expect(runtime.preloadLocale('de')).resolves.toBeUndefined();
    expect(loader).toHaveBeenCalledTimes(3);
  });
});

function catalog(locale: string, message: string): I18nCatalog {
  return {
    namespace: 'shell',
    entries: [{
      key: { namespace: 'shell', id: 'greeting' },
      kind: 'message',
      sourceLocale: 'en',
      values: { [locale]: message },
    }],
  };
}
