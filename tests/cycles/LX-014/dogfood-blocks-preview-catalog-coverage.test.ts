import { describe, expect, it } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { runScript } from '@flyingrobots/bijou-tui';
import { createDocsApp } from '../../../examples/docs/app.js';
import { dogfoodI18nCatalogsForLocale } from '../../../examples/docs/i18n/dogfood-catalog.js';
import { dogfoodStringTable } from '../../../examples/docs/i18n/dogfood-authoring.js';
import {
  DOGFOOD_I18N_DEBT_BASELINE,
  collectDogfoodI18nDebt,
  evaluateDogfoodI18nDebtRatchet,
} from '../../../examples/docs/i18n-debt.js';

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

function catalogValue(locale: string, id: string): unknown {
  const catalog = dogfoodI18nCatalogsForLocale(locale)[0]!;
  return catalog.entries.find((entry) => entry.key.id === id)?.values[locale];
}

describe('LX-014B DOGFOOD Blocks preview catalog coverage', () => {
  it('localizes the Blocks preview guide and live-preview chrome through selected-locale catalogs', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 220, rows: 160 } });
    const app = createDocsApp(ctx, {
      initialRoute: 'docs',
      initialPageId: 'blocks',
      locale: 'fr',
      showMissingLocalizationMarkers: true,
    });

    const result = await runScript(app, [{
      msg: {
        type: 'docs',
        msg: { type: 'select-guide', guideId: 'blocks-preview' },
      },
    }], { ctx });
    const text = frameText(result.frames.at(-1)!);

    expect(text).toContain('Prévisualisation des blocs');
    expect(text).toContain('Exemple en direct');
    expect(text).toContain("Prévisualisation de l'abaissement");
    expect(text).toContain('Documentation en direct');
    expect(text).not.toContain('<MISSING LOC STRING KEY=bijou.dogfood:blocks.preview.liveExample>');
  });

  it('stores Blocks preview translations in the source table and generated language catalogs', () => {
    const ids = new Set(dogfoodStringTable().rows.map((row) => row.id));

    expect(ids).toContain('docs.guide.blocks-preview.title');
    expect(ids).toContain('blocks.preview.liveExample');
    expect(ids).toContain('blocks.preview.doc.commandIntents');
    expect(catalogValue('de', 'blocks.preview.liveDocumentation')).toBe('Live-Dokumentation');
    expect(catalogValue('es', 'docs.guide.blocks-preview.title')).toBe('Vista previa de bloques');
    expect(catalogValue('fr', 'blocks.preview.liveExample')).toBe('Exemple en direct');
    expect(dogfoodI18nCatalogsForLocale('fr')[0]?.entries.find(
      (entry) => entry.key.id === 'blocks.preview.liveExample',
    )?.values.en).toBeUndefined();
  });

  it('ratchets the DOGFOOD i18n debt baseline after moving Blocks preview strings', () => {
    const inventory = collectDogfoodI18nDebt();
    const result = evaluateDogfoodI18nDebtRatchet(inventory, DOGFOOD_I18N_DEBT_BASELINE);

    expect(result.ok).toBe(true);
    expect(result.total).toBeLessThan(2213);
    expect(result.baseline.bySurface['docs-app']).toBeLessThan(398);
  });
});
