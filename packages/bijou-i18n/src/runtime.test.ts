import { describe, expect, it, vi } from 'vitest';
import { createI18nRuntime, createI18nRuntimeAsync, ref } from './index.js';

describe('bijou-i18n runtime', () => {
  it('interpolates simple scalar values in messages', () => {
    const runtime = createI18nRuntime({ locale: 'en', direction: 'ltr' });

    runtime.loadCatalog({
      namespace: 'shell',
      entries: [
        {
          key: { namespace: 'shell', id: 'items' },
          kind: 'message',
          sourceLocale: 'en',
          values: {
            en: 'Items: {itemCount}',
          },
        },
      ],
    });

    expect(runtime.t({ namespace: 'shell', id: 'items' }, { itemCount: 4 })).toBe('Items: 4');
  });

  it('resolves runtime-safe references for resources', () => {
    const runtime = createI18nRuntime({ locale: 'en', direction: 'ltr' });

    runtime.loadCatalog({
      namespace: 'assets',
      entries: [
        {
          key: { namespace: 'assets', id: 'logo.lines' },
          kind: 'resource',
          sourceLocale: 'en',
          values: {
            en: ['BIJOU'],
          },
        },
        {
          key: { namespace: 'assets', id: 'logo' },
          kind: 'resource',
          sourceLocale: 'en',
          values: {
            en: ref({ namespace: 'assets', id: 'logo.lines' }),
          },
        },
      ],
    });

    expect(runtime.resource<string[]>({ namespace: 'assets', id: 'logo' })).toEqual(['BIJOU']);
  });

  it('fails clearly on missing references and missing message keys', () => {
    const runtime = createI18nRuntime({ locale: 'en', direction: 'ltr' });

    runtime.loadCatalog({
      namespace: 'assets',
      entries: [
        {
          key: { namespace: 'assets', id: 'missing-logo' },
          kind: 'resource',
          sourceLocale: 'en',
          values: {
            en: ref({ namespace: 'assets', id: 'does-not-exist' }),
          },
        },
      ],
    });

    expect(() => runtime.t({ namespace: 'shell', id: 'does-not-exist' })).toThrow(/Missing i18n key/);
    expect(() => runtime.resource({ namespace: 'assets', id: 'missing-logo' })).toThrow(/Missing i18n reference/);
  });

  it('loads initial catalogs passed to createI18nRuntime', () => {
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

    expect(runtime.t({ namespace: 'shell', id: 'ready' })).toBe('Ready');
  });

  it('creates an async runtime that preloads the initial locale through the loader', async () => {
    const loader = vi.fn(async (locale: string) => [{
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

    const runtime = await createI18nRuntimeAsync({
      locale: 'fr',
      direction: 'ltr',
      loader,
    });

    expect(loader).toHaveBeenCalledWith('fr');
    expect(runtime.t({ namespace: 'shell', id: 'greeting' })).toBe('Hello from fr');
  });

  it('switches loader-managed catalogs on locale change and caches prior loads', async () => {
    const loader = vi.fn(async (locale: string) => [{
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
    }]);

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

  it('preloads a locale without switching until setLocale is called', async () => {
    const loader = vi.fn(async (locale: string) => [{
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
    }]);

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
});
