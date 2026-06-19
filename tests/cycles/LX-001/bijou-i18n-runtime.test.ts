import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { createI18nRuntime } from '../../../packages/bijou-i18n/src/index.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const ENTRY = resolve(ROOT, 'packages/bijou-i18n/src/index.ts');

describe('LX-001 bijou-i18n runtime cycle', () => {
  it('ships a dedicated runtime package entrypoint', () => {
    expect(existsSync(resolve(ROOT, 'packages/bijou-i18n/package.json'))).toBe(true);
    expect(existsSync(resolve(ROOT, 'packages/bijou-i18n/tsconfig.json'))).toBe(true);
    expect(existsSync(ENTRY)).toBe(true);

    expect(typeof createI18nRuntime).toBe('function');
  });

  it('supports in-memory catalog loading, locale direction, and source-locale fallback', () => {
    const runtime = createI18nRuntime({ locale: 'de', direction: 'ltr' });

    runtime.loadCatalog({
      namespace: 'shell',
      entries: [
        {
          key: { namespace: 'shell', id: 'help' },
          kind: 'message',
          sourceLocale: 'en',
          values: {
            en: 'Help',
            de: 'Hilfe',
          },
        },
        {
          key: { namespace: 'shell', id: 'quit' },
          kind: 'message',
          sourceLocale: 'en',
          values: {
            en: 'Quit',
          },
        },
      ],
    });

    expect(runtime.locale).toBe('de');
    expect(runtime.direction).toBe('ltr');
    expect(runtime.t({ namespace: 'shell', id: 'help' })).toBe('Hilfe');
    expect(runtime.t({ namespace: 'shell', id: 'quit' })).toBe('Quit');
  });

  it('supports non-string resources and unloads namespaces cleanly', () => {
    const runtime = createI18nRuntime({ locale: 'en', direction: 'rtl' });

    runtime.loadCatalog({
      namespace: 'assets',
      entries: [
        {
          key: { namespace: 'assets', id: 'logo' },
          kind: 'resource',
          sourceLocale: 'en',
          values: {
            en: { lines: ['BIJOU'] },
          },
        },
      ],
    });

    expect(runtime.direction).toBe('rtl');
    expect(runtime.resource<{ lines: string[] }>({ namespace: 'assets', id: 'logo' })).toEqual({
      lines: ['BIJOU'],
    });

    runtime.unloadCatalog('assets');
    expect(runtime.resource({ namespace: 'assets', id: 'logo' })).toBeUndefined();
  });
});
