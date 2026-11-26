import { afterEach, describe, expect, it } from 'vitest';
import { createTestContext, _resetDefaultContextForTesting } from '@flyingrobots/bijou/adapters/test';
import { runScript } from '../packages/bijou-tui/src/driver.js';
import { createDocsApp } from '../examples/docs/app-root.js';
import {
  casesOfPart, expectLocalized, LOCALE_CASES, panelText, PART_COUNT, PICKER,
} from './dogfood-book-theme-localization.test-support.js';

afterEach(() => { _resetDefaultContextForTesting(); });

describe('book theme runtime localization', () => {
  it('the locale parts together take every locale case exactly once', () => {
    const union = Array.from({ length: PART_COUNT }, (_part, index) => casesOfPart(index)).flat();
    expect(union.map(([locale]) => locale).sort()).toEqual(LOCALE_CASES.map(([locale]) => locale).sort());
  });

  it.each(casesOfPart(0))('localizes actual %s picker, mode descriptions, Theme Lab and Inspector', async (...row) => {
    await expectLocalized(...row);
  });

  it('updates existing picker labels after the actual locale activation command', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 180, rows: 56 } });
    const app = createDocsApp(ctx, { initialRoute: 'docs', initialPageId: 'themes', locale: 'en' });
    const result = await runScript(app, [
      { msg: { type: 'docs', msg: { type: 'cycle-locale' } } }, ...PICKER,
    ], { ctx });
    expect(panelText(result.frames.at(-1))).toContain('Bijou Book / Sombre');
    expect(panelText(result.frames.at(-1))).not.toContain('Bijou Book / Dark');
  });

  it('keeps separate app locales independent', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 180, rows: 56 } });
    const german = createDocsApp(ctx, { initialRoute: 'docs', initialPageId: 'themes', locale: 'de' });
    const french = createDocsApp(ctx, { initialRoute: 'docs', initialPageId: 'themes', locale: 'fr' });
    const fr = await runScript(french, PICKER, { ctx });
    expect(panelText(fr.frames.at(-1))).toContain('Bijou Book / Sombre');
    const de = await runScript(german, PICKER, { ctx });
    expect(panelText(de.frames.at(-1))).toContain('Bijou Book / Dunkel');
  });
});
