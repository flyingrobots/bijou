import { describe, expect, it } from 'vitest';
import { must, createTestContext  } from '@flyingrobots/bijou/adapters/test';
import { runScript } from '@flyingrobots/bijou-tui';
import { createDocsApp } from '../../../examples/docs/app.js';
import {
  DOGFOOD_I18N_DEBT_BASELINE,
  collectDogfoodI18nDebt,
  evaluateDogfoodI18nDebtRatchet,
} from '../../../examples/docs/i18n-debt.js';

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

describe('LX-012 DOGFOOD i18n debt inventory', () => {
  it('keeps DOGFOOD i18n debt counted by source surface instead of render output', () => {
    const inventory = collectDogfoodI18nDebt();

    expect(inventory.total).toBeGreaterThan(0);
    expect(inventory.bySurface.length).toBeGreaterThan(1);
    expect(inventory.bySurface.every((surface) => surface.count > 0)).toBe(true);
    expect(
      inventory.entries.every((entry) => entry.path.replaceAll('\\', '/').startsWith('examples/docs/')),
    ).toBe(true);
    expect(inventory.entries.every((entry) => entry.line > 0 && entry.column > 0)).toBe(true);
  });

  it('ratchets current DOGFOOD i18n debt against an explicit baseline', () => {
    const inventory = collectDogfoodI18nDebt();
    const result = evaluateDogfoodI18nDebtRatchet(inventory, DOGFOOD_I18N_DEBT_BASELINE);

    expect(result.ok).toBe(true);
    expect(result.total).toBe(inventory.total);
    expect(result.baseline.total).toBeGreaterThanOrEqual(inventory.total);
    expect(result.violations).toEqual([]);
  });

  it('publishes the string-table i18n setup workflow inside DOGFOOD', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 160, rows: 80 } });
    const app = createDocsApp(ctx, { initialRoute: 'docs', initialPageId: 'guides' });
    const result = await runScript(app, [
      { msg: { type: 'docs', msg: { type: 'select-guide', guideId: 'guides-i18n-workflow' } } },
    ], { ctx });
    const text = frameText(must(result.frames.at(-1)));
    const pageModel = result.model.docsModel.pageModels.guides;

    expect(pageModel.selectedGuideId).toBe('guides-i18n-workflow');
    expect(text).toContain('i18n Workflow');
    expect(text).toContain('source string table');
    expect(text).toContain('examples/docs/i18n/source/dogfood-strings.csv');
    expect(text).toContain('npm run dogfood:i18n:build');
    expect(text).toContain('examples/docs/i18n/catalogs/<locale>/<namespace>.json');
    expect(text).toContain('createRuntimeCatalogDirectoryLoader');
  });
});
