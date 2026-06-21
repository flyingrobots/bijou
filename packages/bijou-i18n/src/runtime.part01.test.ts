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

      expect(runtime.resource({ namespace: 'assets', id: 'logo' })).toEqual(['BIJOU']);
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

      const resolved = runtime.resource({
        namespace: 'assets',
        id: 'logo',
      });
      if (resolved === null || typeof resolved !== 'object' || !('lines' in resolved)) {
        throw new Error('Expected logo resource object');
      }

      expect(resolved).toEqual({ label: 'Logo', lines: ['BIJOU'] });
      expect(Object.isFrozen(resolved)).toBe(true);
      expect(Object.isFrozen(resolved.lines)).toBe(true);

      try {
        Reflect.apply(Array.prototype.push, resolved.lines, ['MUTATED']);
      } catch {
        // frozen
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
});
