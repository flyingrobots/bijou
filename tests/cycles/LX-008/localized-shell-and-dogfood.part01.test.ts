import { describe, expect, it } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { stringToSurface } from '@flyingrobots/bijou';
import type { I18nCatalog } from '@flyingrobots/bijou-i18n';
import * as docsMod from '../../../examples/docs/app.js';
import * as i18nMod from '../../../packages/bijou-i18n/src/index.js';
import * as tools from '../../../packages/bijou-i18n-tools/src/index.js';
import * as tui from '../../../packages/bijou-tui/src/index.js';

const KEY_ENTER = '\r';

const KEY_CTRL_P = '\x10';

const KEY_F2 = '\x1bOQ';

interface TestMsg { readonly type: 'noop' }

interface TestModel { readonly count: number }

interface TestFrame { readonly width: number; readonly height: number; get(x: number, y: number): { readonly char?: string } }

const noopAction: TestMsg = { type: 'noop' };

function frameText(frame: TestFrame): string {
  let text = '';
  for (let y = 0; y < frame.height; y += 1) {
    for (let x = 0; x < frame.width; x += 1) {
      text += frame.get(x, y).char ?? ' ';
    }
    text += '\n';
  }
  return text;
}

function lastFrame(frames: readonly TestFrame[]): TestFrame {
  const frame = frames.at(-1);
  if (frame == null) throw new Error('expected rendered frame');
  return frame;
}

function withLocaleValues(
  catalog: I18nCatalog,
  locale: string,
  translate: (value: string, key: string) => string,
): I18nCatalog {
  return {
    namespace: catalog.namespace,
    entries: catalog.entries.map((entry) => {
      const values: Record<string, unknown> = {};
      for (const [lang, value] of Object.entries(entry.values)) {
        values[lang] = value;
        if (lang === entry.sourceLocale && typeof value === 'string') {
          values[locale] = translate(value, entry.key.id);
        }
      }
      return { ...entry, values };
    }),
  };
}

describe('LX-008 localized shell chrome and DOGFOOD cycle', () => {
  it('renders translated shell-owned titles and hints through createFramedApp', async () => {
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
      const app = tui.createFramedApp<TestModel, TestMsg>({
        i18n: runtime,
        enableCommandPalette: true,
        pages: [{
          id: 'home',
          title: 'Home',
          init: () => [{ count: 0 }, []],
          update: (_msg, model) => [model, []],
          layout: () => ({
            kind: 'pane',
            paneId: 'main',
            render: () => stringToSurface('body', 4, 1),
          }),
          searchItems: () => [{ id: 'x', label: 'Thing', action: noopAction }],
        }],
        settings: () => ({
          sections: [{
            id: 'shell',
            title: 'Shell',
            rows: [{ id: 'show-hints', label: 'Show hints', checked: true, kind: 'toggle', action: noopAction }],
          }],
        }),
      });
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 100, rows: 30 } });
      const palette = await tui.runScript(app, [{ key: KEY_CTRL_P }], { ctx });
      expect(frameText(lastFrame(palette.frames))).toContain('Palette de commandes');
      const settings = await tui.runScript(app, [{ key: KEY_F2 }], { ctx });
      const frame = lastFrame(settings.frames);
      const settingsText = frameText(frame);
      const footer = settingsText.split('\n')[frame.height - 1] ?? '';
      expect(settingsText).toContain('Paramètres');
      expect(footer).toContain('Échap fermer');
      expect(footer).toContain('Entrée basculer');
    });

  it('renders pseudo-localized DOGFOOD shell and landing copy when given localized catalogs', async () => {
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
      const landing = await tui.runScript(app, [], { ctx });
      const landingText = frameText(lastFrame(landing.frames));
      expect(landingText).not.toContain('Press [Enter]');
      expect(landingText).toContain(tools.pseudoLocalize('Press [Enter]'));
      const docs = await tui.runScript(app, [{ key: KEY_ENTER }], { ctx });
      const docsText = frameText(lastFrame(docs.frames));
      expect(docsText).not.toContain('Tab next pane');
      expect(docsText).toContain(tools.pseudoLocalize('Tab next pane'));
    });
});
