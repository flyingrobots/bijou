import { describe, expect, it } from 'vitest';
import {
  createScriptTestContext as createTestContext,
  runScriptDeterministic as runScript,
} from '../../helpers/scripted.js';
import { must } from '@flyingrobots/bijou/adapters/test';
import { createDocsApp } from '../../../examples/docs/app.js';
import { guideDocBody } from '../../../examples/docs/app-guide-access.js';
import { dogfoodI18nCatalogsForLocale } from '../../../examples/docs/i18n/dogfood-catalog.js';
import { createI18nRuntime, createRuntimeLocalizationPort } from '@flyingrobots/bijou-i18n';

const MISSING_MARKER = '<MISSING LOC STRING KEY=';

function frameText(frame: { width: number; height: number; get(x: number, y: number): { char?: string } }): string {
  let text = '';
  for (let y = 0; y < frame.height; y += 1) {
    for (let x = 0; x < frame.width; x += 1) {
      text += frame.get(x, y).char ?? ' ';
    }
    text += '\n';
  }
  return text;
}

describe('LX-020 DOGFOOD locale demo readiness', () => {
  it('renders the French Blocks release-demo path without visible missing localization markers', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx, {
      initialRoute: 'docs',
      initialPageId: 'blocks',
      locale: 'fr',
    });

    const result = await runScript(app, [], { ctx });
    const text = frameText(must(result.frames.at(-1)));

    expect(text).toContain('CounterDemoBlock');
    expect(text).not.toContain(MISSING_MARKER);
  });

  it('labels an article without a translation as English-source documentation', () => {
    const i18n = createI18nRuntime({ locale: 'fr', direction: 'ltr' });
    for (const catalog of dogfoodI18nCatalogsForLocale('fr')) i18n.loadCatalog(catalog);
    // No content/i18n/fr file exists for this id, so the article keeps its English body under a notice.
    const body = guideDocBody({ id: 'untranslated-fixture', pageId: 'guides', title: 'Fixture', summary: '', body: 'Hello' }, createRuntimeLocalizationPort(i18n));

    expect(body).toContain('Documentation source en anglais');
    expect(body).toContain('Hello');
  });

  it('shows a translated article in the selected locale, without the English-source notice', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 140, rows: 50 } });
    const app = createDocsApp(ctx, {
      initialRoute: 'docs',
      initialPageId: 'guides',
      locale: 'fr',
    });

    const result = await runScript(app, [
      { msg: { type: 'docs', msg: { type: 'select-guide', guideId: 'start-here' } } },
    ], { ctx });
    const text = frameText(must(result.frames.at(-1)));

    expect(text).not.toContain('Documentation source en anglais');
    expect(text).toContain('Commencer ici');
    expect(text).not.toContain(MISSING_MARKER);
  });
});
