import { describe, expect, it } from 'vitest';
import { createScriptTestContext as createTestContext, runScriptDeterministic as runScript } from '../../helpers/scripted.js';
import { createDocsApp } from '../../../examples/docs/app.js';

type DocsModel = ReturnType<ReturnType<typeof createDocsApp>['init']>[0];

const KEY_DOWN = '\x1b[B';

const KEY_ENTER = '\r';

const KEY_F2 = '\x1bOQ';

const RENDERED_LANGUAGE_CYCLE_TEST_TIMEOUT_MS = 15_000;

function frameText(frame?: { width: number; height: number; get(x: number, y: number): { char?: string } }) {
  if (!frame) throw new Error('missing frame');
  let text = '';
  for (let y = 0; y < frame.height; y++) {
    for (let x = 0; x < frame.width; x++) {
      text += frame.get(x, y).char ?? ' ';
    }
    text += '\n';
  }
  return text;
}

function pageLocales(model: DocsModel): readonly string[] {
  return Object.values(model.docsModel.pageModels).map((pageModel) => pageModel.locale);
}

function expectEveryPageLocale(model: DocsModel, locale: string): void {
  const locales = pageLocales(model);
  expect(locales.length).toBeGreaterThan(0);
  expect(locales).toEqual(Array.from({ length: locales.length }, () => locale));
}

describe('LX-011 DOGFOOD locale ratchet', () => {
  it('initializes DOGFOOD pages from the injected locale preference', async () => {
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
      const app = createDocsApp(ctx, {
        initialRoute: 'docs',
        localePort: { preferredLocale: () => 'fr_FR.UTF-8' },
      });
      const result = await runScript(app, [{ key: KEY_F2 }], { ctx });
      expectEveryPageLocale(result.model, 'fr');
      expect(frameText(result.frames.at(-1))).toContain('Langue préférée');
    });

  it('normalizes supported explicit locale aliases before rendering localized settings', async () => {
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
      const app = createDocsApp(ctx, {
        initialRoute: 'docs',
        locale: 'fr-FR',
      });
      const result = await runScript(app, [{ key: KEY_F2 }], { ctx });
      const text = frameText(result.frames.at(-1));
      expectEveryPageLocale(result.model, 'fr');
      expect(text).toContain('Langue préférée');
      expect(text).not.toContain('Preferred language');
    });

  it('keeps the language setting renderable when an extra DOGFOOD catalog is partial', async () => {
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
      const app = createDocsApp(ctx, {
        initialRoute: 'docs',
        locale: 'fr',
        extraI18nCatalogs: [{
          namespace: 'bijou.dogfood',
          entries: [{
            key: { namespace: 'bijou.dogfood', id: 'settings.language.label' },
            kind: 'message',
            sourceLocale: 'en',
            values: { en: 'Preferred language', fr: 'Langue préférée' },
          }],
        }],
      });
      const result = await runScript(app, [{ key: KEY_F2 }], { ctx });
      expect(frameText(result.frames.at(-1))).toContain('Langue préférée');
    });

  it('preserves extra DOGFOOD catalog overrides after language cycling', async () => {
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
      const app = createDocsApp(ctx, {
        initialRoute: 'docs',
        locale: 'en',
        extraI18nCatalogs: [{
          namespace: 'bijou.dogfood',
          entries: [{
            key: { namespace: 'bijou.dogfood', id: 'settings.language.label' },
            kind: 'message',
            sourceLocale: 'en',
            values: { en: 'Preferred language override', fr: 'Langue sentinelle' },
          }],
        }],
      });
      const result = await runScript(app, [
        { key: KEY_F2 },
        { key: KEY_DOWN },
        { key: KEY_DOWN },
        { key: KEY_ENTER },
      ], { ctx });
      expectEveryPageLocale(result.model, 'fr');
      expect(frameText(result.frames.at(-1))).toContain('Langue sentinelle');
    }, RENDERED_LANGUAGE_CYCLE_TEST_TIMEOUT_MS);
});
