import { describe, expect, it } from 'vitest';
import type { I18nCatalog } from '../packages/bijou-i18n/src/index.js';
import { runScriptDeterministic as runScript } from './helpers/scripted.js';
import { createToastCompressedScriptContext } from './helpers/scripted-compressed-time.js';
import { createDocsApp } from '../examples/docs/app.js';
import type { DocsAppOptions } from '../examples/docs/app-model.js';

const KEY_DOWN = '\x1b[B';

const KEY_ENTER = '\r';

const KEY_F2 = '\x1bOQ';

const LANGUAGE_CYCLE_STEPS = [
  { key: KEY_F2 },
  { key: KEY_DOWN },
  { key: KEY_DOWN },
  { key: KEY_ENTER },
];

interface TextFrame {
  readonly width: number;
  readonly height: number;
  get(x: number, y: number): { char?: string };
}

function frameText(frame: TextFrame): string {
  let text = '';
  for (let y = 0; y < frame.height; y++) {
    for (let x = 0; x < frame.width; x++) {
      text += frame.get(x, y).char ?? ' ';
    }
    text += '\n';
  }
  return text;
}

async function cycleLanguageFrames(options: DocsAppOptions): Promise<string> {
  const ctx = createToastCompressedScriptContext({
    mode: 'interactive',
    runtime: { columns: 120, rows: 40 },
  });
  const app = createDocsApp(ctx, { initialRoute: 'docs', ...options });
  const result = await runScript(app, LANGUAGE_CYCLE_STEPS, { ctx });
  return result.frames.map((frame) => frameText(frame)).join('\n');
}

const SPANISH_FEEDBACK_OVERRIDE: I18nCatalog = {
  namespace: 'bijou.dogfood',
  entries: [{
    key: { namespace: 'bijou.dogfood', id: 'settings.language.feedback' },
    kind: 'message',
    sourceLocale: 'en',
    values: {
      en: 'Language set to {language}.',
      es: 'Idioma centinela: {language}.',
    },
  }, {
    // An extra catalog replaces the namespace, so it carries the label it uses.
    key: { namespace: 'bijou.dogfood', id: 'settings.language.es' },
    kind: 'message',
    sourceLocale: 'en',
    values: { en: 'Spanish', es: 'español' },
  }],
};

describe('DOGFOOD language-change notice (flyingrobots/bijou#582)', () => {
  // Oracle: the es catalog entries settings.language.feedback and settings.language.es.
  it('shows the notice in Spanish when cycling from French to Spanish', async () => {
    const frames = await cycleLanguageFrames({ locale: 'fr' });
    expect(frames).toContain('Idioma establecido en español / Español.');
    expect(frames).not.toContain('Langue définie sur');
  });

  it('localizes the notice with the app catalogs, including extra ones', async () => {
    const frames = await cycleLanguageFrames({
      locale: 'fr',
      extraI18nCatalogs: [SPANISH_FEEDBACK_OVERRIDE],
    });
    expect(frames).toContain('Idioma centinela: español / Español.');
  });
});
