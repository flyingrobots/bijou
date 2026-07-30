import { describe, expect, it } from 'vitest';
import { createI18nRuntime, ref } from './index.js';

describe('bijou-i18n runtime', () => {
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

      const resolved = runtime.localize({
        key: { namespace: 'assets', id: 'logo' },
        kind: 'resource',
      });

      expect(resolved.status).toBe('fallback');
      expect(resolved.value).toEqual(['BIJOU']);
      expect(resolved.value).not.toBe('<MISSING LOC STRING KEY=assets:logo>');
    });
});
