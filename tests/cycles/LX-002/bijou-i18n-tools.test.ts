import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const TOOLS_ENTRY = resolve(ROOT, 'packages/bijou-i18n-tools/src/index.ts');
const RUNTIME_ENTRY = resolve(ROOT, 'packages/bijou-i18n/src/index.ts');

describe('LX-002 bijou-i18n tools cycle', () => {
  it('ships a dedicated tooling package entrypoint', async () => {
    expect(existsSync(resolve(ROOT, 'packages/bijou-i18n-tools/package.json'))).toBe(true);
    expect(existsSync(resolve(ROOT, 'packages/bijou-i18n-tools/tsconfig.json'))).toBe(true);
    expect(existsSync(TOOLS_ENTRY)).toBe(true);

    const mod: typeof import('../../../packages/bijou-i18n-tools/src/index.js') = await import(pathToFileURL(TOOLS_ENTRY).href);
    expect(typeof mod.markStaleTranslations).toBe('function');
    expect(typeof mod.exportTranslationRows).toBe('function');
    expect(typeof mod.importTranslationRows).toBe('function');
    expect(typeof mod.compileCatalogs).toBe('function');
    expect(typeof mod.pseudoLocalize).toBe('function');
  });

  it('marks changed source strings stale and exports only stale or missing rows', async () => {
    const tools: typeof import('../../../packages/bijou-i18n-tools/src/index.js') = await import(pathToFileURL(TOOLS_ENTRY).href);

    const catalogs = tools.markStaleTranslations([
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
                sourceHash: tools.hashSourceValue('Help'),
                status: 'current',
              },
            },
          },
          {
            key: { namespace: 'shell', id: 'quit' },
            kind: 'message',
            sourceLocale: 'en',
            sourceValue: 'Quit',
            translations: {},
          },
        ],
      },
    ]);

    const rows = tools.exportTranslationRows(catalogs, 'de');
    expect(rows).toHaveLength(2);
    expect(rows.every((row) => row.targetLocale === 'de')).toBe(true);
    expect(rows.map((row) => row.status).sort()).toEqual(['missing', 'stale']);
  });

  it('imports translated rows and compiles them into runtime catalogs consumable by bijou-i18n', async () => {
    const tools: typeof import('../../../packages/bijou-i18n-tools/src/index.js') = await import(pathToFileURL(TOOLS_ENTRY).href);
    const runtimeMod: typeof import('../../../packages/bijou-i18n/src/index.js') = await import(pathToFileURL(RUNTIME_ENTRY).href);

    const staleCatalogs = tools.markStaleTranslations([
      {
        namespace: 'shell',
        entries: [
          {
            key: { namespace: 'shell', id: 'help' },
            kind: 'message',
            sourceLocale: 'en',
            sourceValue: 'Help',
            translations: {},
          },
        ],
      },
    ]);

    const imported = tools.importTranslationRows(staleCatalogs, [
      {
        namespace: 'shell',
        id: 'help',
        kind: 'message',
        sourceLocale: 'en',
        targetLocale: 'de',
        sourceValue: 'Help',
        translatedValue: 'Hilfe',
        status: 'current',
        sourceHash: tools.hashSourceValue('Help'),
      },
    ]);

    const compiled = tools.compileCatalogs(imported);
    const runtime = runtimeMod.createI18nRuntime({ locale: 'de', direction: 'ltr' });
    for (const catalog of compiled) {
      runtime.loadCatalog(catalog);
    }

    expect(runtime.t({ namespace: 'shell', id: 'help' })).toBe('Hilfe');
  });

  it('pseudolocalizes text for layout stress', async () => {
    const tools: typeof import('../../../packages/bijou-i18n-tools/src/index.js') = await import(pathToFileURL(TOOLS_ENTRY).href);

    const pseudo = tools.pseudoLocalize('Landing quality');
    expect(pseudo.length).toBeGreaterThan('Landing quality'.length);
    expect(pseudo).not.toBe('Landing quality');
  });
});
