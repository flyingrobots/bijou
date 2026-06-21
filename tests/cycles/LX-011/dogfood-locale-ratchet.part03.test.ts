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
  it('refreshes frame page labels from the selected locale after language cycling', async () => {
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
      const app = createDocsApp(ctx, {
        initialRoute: 'docs',
        locale: 'en',
        extraI18nCatalogs: [{
          namespace: 'bijou.dogfood',
          entries: [
            {
              key: { namespace: 'bijou.dogfood', id: 'docs.page.guides' },
              kind: 'message',
              sourceLocale: 'en',
              values: { en: 'Guides', fr: 'Guides sentinelle' },
            },
            {
              key: { namespace: 'bijou.dogfood', id: 'docs.page.blocks' },
              kind: 'message',
              sourceLocale: 'en',
              values: { en: 'Blocks', fr: 'Blocs sentinelle' },
            },
            {
              key: { namespace: 'bijou.dogfood', id: 'docs.page.components' },
              kind: 'message',
              sourceLocale: 'en',
              values: { en: 'Components', fr: 'Composants sentinelle' },
            },
            {
              key: { namespace: 'bijou.dogfood', id: 'docs.page.packages' },
              kind: 'message',
              sourceLocale: 'en',
              values: { en: 'Packages', fr: 'Paquets sentinelle' },
            },
            {
              key: { namespace: 'bijou.dogfood', id: 'docs.page.philosophy' },
              kind: 'message',
              sourceLocale: 'en',
              values: { en: 'Philosophy', fr: 'Philosophie sentinelle' },
            },
            {
              key: { namespace: 'bijou.dogfood', id: 'docs.page.release' },
              kind: 'message',
              sourceLocale: 'en',
              values: { en: 'Release', fr: 'Publication sentinelle' },
            },
          ],
        }],
      });
      const result = await runScript(app, [
        { key: KEY_F2 },
        { key: KEY_DOWN },
        { key: KEY_DOWN },
        { key: KEY_ENTER },
      ], { ctx });
      const text = frameText(result.frames.at(-1));
      expect(text).toContain('Blocs sentinelle');
      expect(text).toContain('Paquets sentinelle');
      expect(text).not.toContain('[Guides]  Components  Blocks');
    }, RENDERED_LANGUAGE_CYCLE_TEST_TIMEOUT_MS);

  it('cycles the preferred language through settings and syncs every DOGFOOD page model', async () => {
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
      const savedLocales: string[] = [];
      const app = createDocsApp(ctx, {
        initialRoute: 'docs',
        locale: 'en',
        localePort: {
          preferredLocale: () => 'en',
          savePreferredLocale(locale) {
            savedLocales.push(locale);
          },
        },
      });
      const result = await runScript(app, [
        { key: KEY_F2 },
        { key: KEY_DOWN },
        { key: KEY_DOWN },
        { key: KEY_ENTER },
      ], { ctx });
      expectEveryPageLocale(result.model, 'fr');
      expect(frameText(result.frames.at(-1))).toContain('Langue préférée');
      expect(savedLocales).toEqual(['fr']);
    }, RENDERED_LANGUAGE_CYCLE_TEST_TIMEOUT_MS);

  it('keeps locale activation when preference persistence fails', async () => {
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
      const attemptedSaves: string[] = [];
      const app = createDocsApp(ctx, {
        initialRoute: 'docs',
        locale: 'en',
        localePort: {
          preferredLocale: () => 'en',
          savePreferredLocale(locale) {
            attemptedSaves.push(locale);
            throw new Error('preference store unavailable');
          },
        },
      });
      const result = await runScript(app, [
        { key: KEY_F2 },
        { key: KEY_DOWN },
        { key: KEY_DOWN },
        { key: KEY_ENTER },
      ], { ctx });
      expectEveryPageLocale(result.model, 'fr');
      expect(frameText(result.frames.at(-1))).toContain('Langue préférée');
      expect(attemptedSaves).toEqual(['fr']);
    }, RENDERED_LANGUAGE_CYCLE_TEST_TIMEOUT_MS);
});
