import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { stringToSurface } from '@flyingrobots/bijou';
import { runScript } from '@flyingrobots/bijou-tui';
import type { I18nCatalog } from '@flyingrobots/bijou-i18n';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const FRAME_ENTRY = resolve(ROOT, 'packages/bijou-tui/src/index.ts');
const I18N_ENTRY = resolve(ROOT, 'packages/bijou-i18n/src/index.ts');
const TOOLS_ENTRY = resolve(ROOT, 'packages/bijou-i18n-tools/src/index.ts');
const DOCS_ENTRY = resolve(ROOT, 'examples/docs/app.ts');

const KEY_ENTER = '\r';
const KEY_CTRL_P = '\x10';
const KEY_F2 = '\x1bOQ';

function frameText(frame: { width: number; height: number; get(x: number, y: number): { char?: string } }) {
  let text = '';
  for (let y = 0; y < frame.height; y++) {
    for (let x = 0; x < frame.width; x++) {
      text += frame.get(x, y).char || ' ';
    }
    text += '\n';
  }
  return text;
}

function firstColumnOf(text: string, needle: string): number {
  const lines = text.split('\n');
  for (const line of lines) {
    const index = line.indexOf(needle);
    if (index >= 0) {
      return index;
    }
  }
  return -1;
}

function withLocaleValues(
  catalog: I18nCatalog,
  locale: string,
  translate: (value: string, key: string) => string,
) {
  return {
    namespace: catalog.namespace,
    entries: catalog.entries.map((entry) => ({
      ...entry,
      values: Object.fromEntries(
        Object.entries(entry.values).map(([lang, value]) => {
          if (lang !== entry.sourceLocale || typeof value !== 'string') {
            return [lang, value];
          }
          return [lang, value];
        }).concat(
          Object.entries(entry.values)
            .filter(([lang, value]) => lang === entry.sourceLocale && typeof value === 'string')
            .map(([, value]) => [locale, translate(value as string, entry.key.id)]),
        ),
      ),
    })),
  };
}

describe('LX-008 localized shell chrome and DOGFOOD cycle', () => {
  it('renders translated shell-owned titles and hints through createFramedApp', async () => {
    const tui: typeof import('../../../packages/bijou-tui/src/index.js') = await import(pathToFileURL(FRAME_ENTRY).href);
    const i18nMod: typeof import('../../../packages/bijou-i18n/src/index.js') = await import(pathToFileURL(I18N_ENTRY).href);

    const runtime = i18nMod.createI18nRuntime({ locale: 'fr', direction: 'ltr' });
    runtime.loadCatalog(tui.FRAME_I18N_CATALOG);
    runtime.loadCatalog({
      namespace: 'bijou.shell',
      entries: [
        {
          key: { namespace: 'bijou.shell', id: 'palette.title' },
          kind: 'message',
          sourceLocale: 'en',
          values: { en: 'Command Palette', fr: 'Palette de commandes' },
        },
        {
          key: { namespace: 'bijou.shell', id: 'settings.title' },
          kind: 'message',
          sourceLocale: 'en',
          values: { en: 'Settings', fr: 'Paramètres' },
        },
        {
          key: { namespace: 'bijou.shell', id: 'settings.footer' },
          kind: 'message',
          sourceLocale: 'en',
          values: { en: 'F2/Esc close • ↑/↓ rows • Enter toggle • / search • q quit', fr: 'F2/Échap fermer • ↑/↓ lignes • Entrée basculer • / chercher • q quitter' },
        },
      ],
    });

    const app = tui.createFramedApp({
      i18n: runtime,
      enableCommandPalette: true,
      pages: [{
        id: 'home',
        title: 'Home',
        init: () => [{ count: 0 }, []],
        update: (msg, model) => [model, []],
        layout: () => ({
          kind: 'pane',
          paneId: 'main',
          render: () => stringToSurface('body', 4, 1),
        }),
        searchItems: () => [{ id: 'x', label: 'Thing', action: { type: 'noop' as const } as any }],
      }],
      settings: () => ({
        sections: [{
          id: 'shell',
          title: 'Shell',
          rows: [{ id: 'show-hints', label: 'Show hints', checked: true, kind: 'toggle', action: { type: 'noop' as const } as any }],
        }],
      }),
    });

    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 100, rows: 30 } });
    const palette = await runScript(app, [{ key: KEY_CTRL_P }], { ctx });
    expect(frameText(palette.frames.at(-1)!)).toContain('Palette de commandes');

    const settings = await runScript(app, [{ key: KEY_F2 }], { ctx });
    const settingsText = frameText(settings.frames.at(-1)!);
    const footer = settingsText.split('\n')[settings.frames.at(-1)!.height - 1] ?? '';
    expect(settingsText).toContain('Paramètres');
    expect(footer).toContain('Échap fermer');
    expect(footer).toContain('Entrée basculer');
  });

  it('renders pseudo-localized DOGFOOD shell and onboarding copy when given localized catalogs', async () => {
    const tools: typeof import('../../../packages/bijou-i18n-tools/src/index.js') = await import(pathToFileURL(TOOLS_ENTRY).href);
    const docsMod: typeof import('../../../examples/docs/app.js') = await import(pathToFileURL(DOCS_ENTRY).href);

    const locale = 'qps-ploc';
    const pseudoCatalogs = [
      withLocaleValues(docsMod.DOGFOOD_I18N_CATALOG, locale, (value) => tools.pseudoLocalize(value)),
      withLocaleValues(docsMod.FRAME_I18N_CATALOG, locale, (value) => tools.pseudoLocalize(value)),
    ];

    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 140, rows: 40, refreshRate: 60 } });
    const app = docsMod.createDocsApp(ctx, {
      locale,
      direction: 'ltr',
      extraI18nCatalogs: pseudoCatalogs,
    });

    const landing = await runScript(app, [], { ctx });
    const landingText = frameText(landing.frames.at(-1)!);
    expect(landingText).not.toContain('Press [Enter]');
    expect(landingText).toContain(tools.pseudoLocalize('Press [Enter]'));

    const docs = await runScript(app, [{ key: KEY_ENTER }], { ctx });
    const docsText = frameText(docs.frames.at(-1)!);
    expect(docsText).not.toContain('What is Bijou?');
    expect(docsText).toContain(tools.pseudoLocalize('What is Bijou?'));
  });

  it('uses i18n direction metadata to mirror the settings drawer anchor', async () => {
    const tui: typeof import('../../../packages/bijou-tui/src/index.js') = await import(pathToFileURL(FRAME_ENTRY).href);
    const i18nMod: typeof import('../../../packages/bijou-i18n/src/index.js') = await import(pathToFileURL(I18N_ENTRY).href);

    function makeApp(direction: 'ltr' | 'rtl') {
      const runtime = i18nMod.createI18nRuntime({ locale: direction === 'rtl' ? 'ar' : 'en', direction });
      runtime.loadCatalog(tui.FRAME_I18N_CATALOG);
      return tui.createFramedApp({
        i18n: runtime,
        pages: [{
          id: 'home',
          title: 'Home',
          init: () => [{ count: 0 }, []],
          update: (msg, model) => [model, []],
          layout: () => ({
            kind: 'pane',
            paneId: 'main',
            render: () => stringToSurface('body', 4, 1),
          }),
        }],
        settings: () => ({
          sections: [{
            id: 'shell',
            title: 'Shell',
            rows: [{ id: 'show-hints', label: 'Show hints', checked: true, kind: 'toggle', action: { type: 'noop' as const } as any }],
          }],
        }),
      });
    }

    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 100, rows: 30 } });
    const ltr = await runScript(makeApp('ltr'), [{ key: KEY_F2 }], { ctx });
    const rtl = await runScript(makeApp('rtl'), [{ key: KEY_F2 }], { ctx });

    const ltrColumn = firstColumnOf(frameText(ltr.frames.at(-1)!), 'Settings');
    const rtlColumn = firstColumnOf(frameText(rtl.frames.at(-1)!), 'Settings');

    expect(ltrColumn).toBeGreaterThanOrEqual(0);
    expect(rtlColumn).toBeGreaterThanOrEqual(0);
    expect(ltrColumn).toBeLessThan(40);
    expect(rtlColumn).toBeGreaterThan(55);
  });
});
