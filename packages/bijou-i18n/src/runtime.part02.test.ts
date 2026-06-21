import { describe, expect, it, vi } from 'vitest';
import { createI18nRuntime, createI18nRuntimeAsync } from './index.js';
import type { I18nCatalogLoader } from './index.js';

describe('bijou-i18n runtime', () => {
  it('keeps message lookup independent from method receiver binding', () => {
      const runtime = createI18nRuntime({
        locale: 'en',
        direction: 'ltr',
        catalogs: [
          {
            namespace: 'shell',
            entries: [
              {
                key: { namespace: 'shell', id: 'ready' },
                kind: 'message',
                sourceLocale: 'en',
                values: {
                  en: 'Ready',
                },
              },
            ],
          },
        ],
      });

      const t = runtime.t.bind(undefined);

      expect(t({ namespace: 'shell', id: 'ready' })).toBe('Ready');
    });

  it('creates an async runtime that preloads the initial locale through the loader', async () => {
      const loader = vi.fn<I18nCatalogLoader>((locale: string) => Promise.resolve([{
        namespace: 'shell',
        entries: [
          {
            key: { namespace: 'shell', id: 'greeting' },
            kind: 'message',
            sourceLocale: 'en',
            values: {
              [locale]: `Hello from ${locale}`,
            },
          },
        ],
      }]));

      const runtime = await createI18nRuntimeAsync({
        locale: 'fr',
        direction: 'ltr',
        loader,
      });

      expect(loader).toHaveBeenCalledWith('fr');
      expect(runtime.t({ namespace: 'shell', id: 'greeting' })).toBe('Hello from fr');
    });

  it('switches loader-managed catalogs on locale change and caches prior loads', async () => {
      const loader = vi.fn<I18nCatalogLoader>((locale: string) => Promise.resolve([{
        namespace: 'shell',
        entries: [
          {
            key: { namespace: 'shell', id: 'greeting' },
            kind: 'message',
            sourceLocale: 'en',
            values: {
              [locale]: locale === 'fr' ? 'Bonjour' : 'Hello',
            },
          },
        ],
      }]));

      const runtime = await createI18nRuntimeAsync({
        locale: 'en',
        direction: 'ltr',
        loader,
      });

      await runtime.setLocale('fr');
      expect(runtime.locale).toBe('fr');
      expect(runtime.t({ namespace: 'shell', id: 'greeting' })).toBe('Bonjour');

      await runtime.setLocale('en');
      expect(runtime.t({ namespace: 'shell', id: 'greeting' })).toBe('Hello');
      expect(loader).toHaveBeenCalledTimes(2);
    });

  it('keeps the active locale stable when loader-backed locale switching fails', async () => {
      const loader = vi.fn<I18nCatalogLoader>((locale: string) => {
        if (locale === 'fr') {
          return Promise.reject(new Error('catalog loader unavailable'));
        }

        return Promise.resolve([{
          namespace: 'shell',
          entries: [
            {
              key: { namespace: 'shell', id: 'greeting' },
              kind: 'message',
              sourceLocale: 'en',
              values: {
                [locale]: `Hello from ${locale}`,
              },
            },
          ],
        }]);
      });

      const runtime = await createI18nRuntimeAsync({
        locale: 'en',
        direction: 'ltr',
        loader,
      });

      await expect(runtime.setLocale('fr', 'rtl')).rejects.toThrow('catalog loader unavailable');

      expect(runtime.locale).toBe('en');
      expect(runtime.direction).toBe('ltr');
      expect(runtime.t({ namespace: 'shell', id: 'greeting' })).toBe('Hello from en');
    });
});
