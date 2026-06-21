import { describe, expect, it } from 'vitest';
import { createI18nRuntime, ref } from './index.js';

describe('bijou-i18n runtime', () => {
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

      const resolved = runtime.localize({
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
