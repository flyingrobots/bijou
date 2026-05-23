import { describe, expect, it, vi } from 'vitest';
import { createI18nRuntime, createI18nRuntimeAsync, ref } from './index.js';
import type { I18nCatalog, I18nCatalogLoader } from './index.js';

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

  it('returns frozen resource values without leaking catalog state', () => {
    const runtime = createI18nRuntime({ locale: 'en', direction: 'ltr' });

    runtime.loadCatalog({
      namespace: 'assets',
      entries: [
        {
          key: { namespace: 'assets', id: 'logo' },
          kind: 'resource',
          sourceLocale: 'en',
          values: {
            en: {
              label: 'Logo',
              lines: ['BIJOU'],
            },
          },
        },
      ],
    });

    const resolved = runtime.resource<{ readonly label: string; readonly lines: readonly string[] }>({
      namespace: 'assets',
      id: 'logo',
    });

    expect(resolved).toEqual({ label: 'Logo', lines: ['BIJOU'] });
    expect(Object.isFrozen(resolved)).toBe(true);
    expect(Object.isFrozen(resolved?.lines)).toBe(true);

    try {
      (resolved?.lines as string[] | undefined)?.push('MUTATED');
    } catch {
      // Frozen values should reject mutation; old mutable values should still
      // fail the final catalog-state assertion below.
    }

    expect(runtime.resource({ namespace: 'assets', id: 'logo' })).toEqual({
      label: 'Logo',
      lines: ['BIJOU'],
    });
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

    const { t } = runtime;

    expect(t({ namespace: 'shell', id: 'ready' })).toBe('Ready');
  });

  it('creates an async runtime that preloads the initial locale through the loader', async () => {
    const loader = vi.fn<I18nCatalogLoader>(async (locale: string) => [{
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
    const loader = vi.fn<I18nCatalogLoader>(async (locale: string) => [{
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

  it('keeps the active locale stable when loader-backed locale switching fails', async () => {
    const loader = vi.fn<I18nCatalogLoader>(async (locale: string) => {
      if (locale === 'fr') {
        throw new Error('catalog loader unavailable');
      }

      return [{
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
      }];
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
    const loader = vi.fn<I18nCatalogLoader>(async (locale: string) => (
      locale === 'fr' ? [conflictingFrenchCatalog] : [englishCatalog]
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
    const loader = vi.fn<I18nCatalogLoader>(async (locale: string) => [{
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

  it('uses explicit fallback catalogs when selected-locale catalogs omit source strings', () => {
    const runtime = createI18nRuntime({
      locale: 'fr',
      direction: 'ltr',
      fallbackLocale: 'en',
      fallbackCatalogs: [{
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
          {
            key: { namespace: 'shell', id: 'farewell' },
            kind: 'message',
            sourceLocale: 'en',
            values: {
              en: 'Bye',
            },
          },
        ],
      }],
      catalogs: [{
        namespace: 'shell',
        entries: [{
          key: { namespace: 'shell', id: 'greeting' },
          kind: 'message',
          sourceLocale: 'en',
          values: {
            fr: 'Bonjour',
          },
        }],
      }],
    });

    expect(runtime.t({ namespace: 'shell', id: 'greeting' })).toBe('Bonjour');
    expect(runtime.t({ namespace: 'shell', id: 'farewell' })).toBe('Bye');
  });

  it('can render an explicit missing-locale message instead of falling back', () => {
    const runtime = createI18nRuntime({
      locale: 'fr',
      direction: 'ltr',
      fallbackLocale: 'en',
      missingMessage: ({ key }) => `<MISSING LOC STRING KEY=${key.namespace}:${key.id}>`,
      fallbackCatalogs: [{
        namespace: 'shell',
        entries: [{
          key: { namespace: 'shell', id: 'greeting' },
          kind: 'message',
          sourceLocale: 'en',
          values: {
            en: 'Hello',
          },
        }],
      }],
    });

    expect(runtime.t({ namespace: 'shell', id: 'greeting' }))
      .toBe('<MISSING LOC STRING KEY=shell:greeting>');
  });

  it('keeps missing-locale markers when resolving referenced messages', () => {
    const runtime = createI18nRuntime({
      locale: 'fr',
      direction: 'ltr',
      fallbackLocale: 'en',
      missingMessage: ({ key }) => `<MISSING LOC STRING KEY=${key.namespace}:${key.id}>`,
      fallbackCatalogs: [{
        namespace: 'shell',
        entries: [
          {
            key: { namespace: 'shell', id: 'label' },
            kind: 'message',
            sourceLocale: 'en',
            values: {
              en: ref({ namespace: 'shell', id: 'greeting' }),
            },
          },
          {
            key: { namespace: 'shell', id: 'greeting' },
            kind: 'message',
            sourceLocale: 'en',
            values: {
              en: 'Hello',
            },
          },
        ],
      }],
      catalogs: [{
        namespace: 'shell',
        entries: [{
          key: { namespace: 'shell', id: 'label' },
          kind: 'message',
          sourceLocale: 'en',
          values: {
            fr: ref({ namespace: 'shell', id: 'greeting' }),
          },
        }],
      }],
    });

    expect(runtime.t({ namespace: 'shell', id: 'label' }))
      .toBe('<MISSING LOC STRING KEY=shell:greeting>');
  });

  it('does not use missing-message markers as resource values', () => {
    const runtime = createI18nRuntime({
      locale: 'fr',
      direction: 'ltr',
      fallbackLocale: 'en',
      missingMessage: ({ key }) => `<MISSING LOC STRING KEY=${key.namespace}:${key.id}>`,
      fallbackCatalogs: [{
        namespace: 'assets',
        entries: [{
          key: { namespace: 'assets', id: 'logo' },
          kind: 'resource',
          sourceLocale: 'en',
          values: {
            en: ['BIJOU'],
          },
        }],
      }],
    });

    const resolved = runtime.localize<readonly string[]>({
      key: { namespace: 'assets', id: 'logo' },
      kind: 'resource',
    });

    expect(resolved.status).toBe('fallback');
    expect(resolved.value).toEqual(['BIJOU']);
    expect(resolved.value).not.toBe('<MISSING LOC STRING KEY=assets:logo>');
  });

  it('propagates referenced message status and issues through localize', () => {
    const runtime = createI18nRuntime({
      locale: 'fr',
      direction: 'ltr',
      fallbackLocale: 'en',
      missingMessage: ({ key }) => `<MISSING LOC STRING KEY=${key.namespace}:${key.id}>`,
      fallbackCatalogs: [{
        namespace: 'shell',
        entries: [
          {
            key: { namespace: 'shell', id: 'label' },
            kind: 'message',
            sourceLocale: 'en',
            values: {
              en: ref({ namespace: 'shell', id: 'greeting' }),
            },
          },
          {
            key: { namespace: 'shell', id: 'greeting' },
            kind: 'message',
            sourceLocale: 'en',
            values: {
              en: 'Hello',
            },
          },
        ],
      }],
      catalogs: [{
        namespace: 'shell',
        entries: [{
          key: { namespace: 'shell', id: 'label' },
          kind: 'message',
          sourceLocale: 'en',
          values: {
            fr: ref({ namespace: 'shell', id: 'greeting' }),
          },
        }],
      }],
    });

    const resolved = runtime.localize<string>({
      key: { namespace: 'shell', id: 'label' },
      kind: 'message',
    });

    expect(resolved.status).toBe('missing');
    expect(resolved.value).toBe('<MISSING LOC STRING KEY=shell:greeting>');
    expect(resolved.issues.map((issue) => issue.key)).toEqual([
      { namespace: 'shell', id: 'greeting' },
    ]);
  });
});
