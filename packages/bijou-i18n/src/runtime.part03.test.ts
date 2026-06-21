import { describe, expect, it, vi } from 'vitest';
import { createI18nRuntime, createI18nRuntimeAsync } from './index.js';
import type { I18nCatalog, I18nCatalogLoader } from './index.js';

describe('bijou-i18n runtime', () => {
  it('keeps third-party loader activation atomic when staged catalogs conflict', async () => {
      const englishCatalog: I18nCatalog = {
        namespace: 'shell',
        entries: [
          {
            key: { namespace: 'shell', id: 'greeting' },
            kind: 'message',
            sourceLocale: 'en',
            values: {
              en: 'Hello',
            },
          },
        ],
      };
      const conflictingFrenchCatalog: I18nCatalog = {
        namespace: 'shell',
        entries: [
          {
            key: { namespace: 'shell', id: 'greeting' },
            kind: 'resource',
            sourceLocale: 'en',
            values: {
              fr: { text: 'Bonjour' },
            },
          },
        ],
      };
      const loader = vi.fn<I18nCatalogLoader>((locale: string) => Promise.resolve(
        locale === 'fr' ? [conflictingFrenchCatalog] : [englishCatalog],
      ));
      const runtime = await createI18nRuntimeAsync({
        locale: 'en',
        direction: 'ltr',
        catalogs: [englishCatalog],
        loader,
      });

      await expect(runtime.setLocale('fr', 'rtl')).rejects.toThrow(
        'Conflicting i18n catalog entry metadata for shell:greeting',
      );

      expect(runtime.locale).toBe('en');
      expect(runtime.direction).toBe('ltr');
      expect(runtime.t({ namespace: 'shell', id: 'greeting' })).toBe('Hello');
      expect(runtime.localize({
        key: { namespace: 'shell', id: 'greeting' },
        kind: 'resource',
      }).status).toBe('missing');
    });

  it('preloads a locale without switching until setLocale is called', async () => {
      const loader = vi.fn<I18nCatalogLoader>((locale: string) => Promise.resolve([{
        namespace: 'shell',
        entries: [
          {
            key: { namespace: 'shell', id: 'greeting' },
            kind: 'message',
            sourceLocale: 'en',
            values: {
              [locale]: locale === 'de' ? 'Hallo' : 'Hello',
            },
          },
        ],
      }]));

      const runtime = createI18nRuntime({
        locale: 'en',
        direction: 'ltr',
        catalogs: [
          {
            namespace: 'shell',
            entries: [
              {
                key: { namespace: 'shell', id: 'greeting' },
                kind: 'message',
                sourceLocale: 'en',
                values: {
                  en: 'Hello',
                },
              },
            ],
          },
        ],
        loader,
      });

      await runtime.preloadLocale('de');
      expect(runtime.t({ namespace: 'shell', id: 'greeting' })).toBe('Hello');

      await runtime.setLocale('de');
      expect(runtime.t({ namespace: 'shell', id: 'greeting' })).toBe('Hallo');
      expect(loader).toHaveBeenCalledTimes(1);
    });

  it('commits no-loader locale switches synchronously for frame update loops', async () => {
      const runtime = createI18nRuntime({
        locale: 'en',
        direction: 'ltr',
      });

      const localeSwitch = runtime.setLocale('fr', 'rtl');

      expect(runtime.locale).toBe('fr');
      expect(runtime.direction).toBe('rtl');
      await expect(localeSwitch).resolves.toBeUndefined();
    });
});
