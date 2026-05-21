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

const KEY_F2 = '\x1bOQ';

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

describe('LX-014A DOGFOOD chrome catalog coverage', () => {
  it('localizes top-level DOGFOOD navigation through selected-locale catalogs', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 140, rows: 40 } });
    const app = createDocsApp(ctx, {
      initialRoute: 'docs',
      locale: 'es',
      showMissingLocalizationMarkers: true,
    });

    const result = await runScript(app, [], { ctx });
    const text = frameText(result.frames.at(-1)!);

    expect(text).toContain('[Guías]');
    expect(text).toContain('Componentes');
    expect(text).toContain('Paquetes');
    expect(text).not.toContain('<MISSING LOC STRING KEY=bijou.dogfood:docs.page.guides>');
  });

  it('localizes DOGFOOD settings chrome without relying on English fallback data', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 140, rows: 40 } });
    const app = createDocsApp(ctx, {
      initialRoute: 'docs',
      locale: 'fr',
      showMissingLocalizationMarkers: true,
    });

    const result = await runScript(app, [{ key: KEY_F2 }], { ctx });
    const text = frameText(result.frames.at(-1)!);

    expect(text).toContain('Interface');
    expect(text).toContain('Afficher les indices');
    expect(text).toContain('Qualité de lancement');
    expect(text).not.toContain('<MISSING LOC STRING KEY=bijou.dogfood:settings.section.shell>');
  });

  it('stores chrome translations in the source table and generated language catalogs', () => {
    const ids = new Set(dogfoodStringTable().rows.map((row) => row.id));

    expect(ids).toContain('docs.page.guides');
    expect(ids).toContain('settings.section.shell');
    expect(ids).toContain('settings.showHints.label');
    expect(catalogValue('de', 'docs.page.guides')).toBe('Leitfäden');
    expect(catalogValue('es', 'docs.page.components')).toBe('Componentes');
    expect(catalogValue('fr', 'settings.showHints.label')).toBe('Afficher les indices');
    expect(dogfoodI18nCatalogsForLocale('fr')[0]?.entries.find(
      (entry) => entry.key.id === 'docs.page.guides',
    )?.values.en).toBeUndefined();
  });

  it('ratchets the DOGFOOD i18n debt baseline after moving chrome strings', () => {
    const inventory = collectDogfoodI18nDebt();
    const result = evaluateDogfoodI18nDebtRatchet(inventory, DOGFOOD_I18N_DEBT_BASELINE);

    expect(result.ok).toBe(true);
    expect(result.total).toBeLessThan(2219);
    expect(result.baseline.bySurface['docs-app']).toBeLessThan(404);
  });
});
