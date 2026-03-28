import { describe, expect, it } from 'vitest';
import { compileCatalogs, hashSourceValue, markStaleTranslations, ref } from './index.js';

describe('bijou-i18n-tools', () => {
  it('hashes source values stably', () => {
    expect(hashSourceValue('Help')).toBe(hashSourceValue('Help'));
    expect(hashSourceValue('Help')).not.toBe(hashSourceValue('Quit'));
  });

  it('fails clearly on missing references during compilation', () => {
    expect(() => compileCatalogs([
      {
        namespace: 'shell',
        entries: [
          {
            key: { namespace: 'shell', id: 'help' },
            kind: 'message',
            sourceLocale: 'en',
            sourceValue: ref({ namespace: 'shell', id: 'missing' }),
            translations: {},
          },
        ],
      },
    ])).toThrow(/Missing i18n tooling reference/);
  });

  it('fails clearly on cyclic references during compilation', () => {
    expect(() => compileCatalogs([
      {
        namespace: 'shell',
        entries: [
          {
            key: { namespace: 'shell', id: 'a' },
            kind: 'message',
            sourceLocale: 'en',
            sourceValue: ref({ namespace: 'shell', id: 'b' }),
            translations: {},
          },
          {
            key: { namespace: 'shell', id: 'b' },
            kind: 'message',
            sourceLocale: 'en',
            sourceValue: ref({ namespace: 'shell', id: 'a' }),
            translations: {},
          },
        ],
      },
    ])).toThrow(/Cyclic i18n tooling reference/);
  });

  it('marks translations stale when the source hash changes', () => {
    const catalogs = markStaleTranslations([
      {
        namespace: 'shell',
        entries: [
          {
            key: { namespace: 'shell', id: 'help' },
            kind: 'message',
            sourceLocale: 'en',
            sourceValue: 'Help me now',
            translations: {
              de: {
                value: 'Hilfe',
                sourceHash: hashSourceValue('Help'),
                status: 'current',
              },
            },
          },
        ],
      },
    ]);

    expect(catalogs[0]?.entries[0]?.translations.de?.status).toBe('stale');
  });
});
