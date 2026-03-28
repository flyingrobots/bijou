import { describe, expect, it } from 'vitest';
import { createI18nRuntime, ref } from './index.js';

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
});
