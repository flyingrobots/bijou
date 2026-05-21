import { describe, expect, it } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { runScript } from '@flyingrobots/bijou-tui';
import { createDocsApp } from '../../../examples/docs/app.js';
import { dogfoodI18nCatalogsForLocale } from '../../../examples/docs/i18n/dogfood-catalog.js';
import { dogfoodMissingLocalizationMessage } from '../../../examples/docs/i18n/missing-localization.js';

function frameText(frame: { width: number; height: number; get(x: number, y: number): { char?: string } }): string {
  let text = '';
  for (let y = 0; y < frame.height; y += 1) {
    for (let x = 0; x < frame.width; x += 1) {
      text += frame.get(x, y).char || ' ';
    }
    text += '\n';
  }
  return text;
}

describe('LX-018 runtime localization fallback behavior', () => {
  it('keeps non-English generated runtime catalogs language-specific', () => {
    const catalog = dogfoodI18nCatalogsForLocale('fr')[0]!;
    const translatedEntry = catalog.entries.find((entry) => entry.key.id === 'settings.language.label');
    const missingEntry = catalog.entries.find((entry) => entry.key.id === 'docs.empty.coverage.title');

    expect(translatedEntry?.values).toEqual({ fr: 'Langue préférée' });
    expect(missingEntry?.values).toEqual({});
  });

  it('renders a high-visibility development marker for missing selected-locale strings', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 140, rows: 40 } });
    const app = createDocsApp(ctx, {
      initialRoute: 'docs',
      locale: 'fr',
      showMissingLocalizationMarkers: true,
    });
    const result = await runScript(app, [], { ctx });
    const text = frameText(result.frames.at(-1)!);

    expect(text).toContain('<MISSING LOC STRING KEY=bijou.dogfood:docs.page.guides>');
    expect(text).not.toContain('[Guides]');
  });

  it('uses English fallback strings in production mode when the selected locale is incomplete', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 140, rows: 40 } });
    const app = createDocsApp(ctx, {
      initialRoute: 'docs',
      locale: 'fr',
      showMissingLocalizationMarkers: false,
    });
    const result = await runScript(app, [], { ctx });
    const text = frameText(result.frames.at(-1)!);

    expect(text).toContain('[Guides]');
    expect(text).not.toContain('<MISSING LOC STRING KEY=');
  });

  it('styles and repeats missing localization markers for terminal visibility', () => {
    const marker = dogfoodMissingLocalizationMessage({
      key: { namespace: 'bijou.dogfood', id: 'example.missing' },
      locale: 'fr',
      fallbackLocale: 'en',
      sourceLocale: 'en',
      reason: 'missing-locale',
    });

    expect(marker).toContain('\x1b[105;92m');
    expect(marker).toContain('\x1b[0m');
    expect(marker.match(/<MISSING LOC STRING KEY=bijou\.dogfood:example\.missing>/g)?.length)
      .toBeGreaterThanOrEqual(2);
  });
});
