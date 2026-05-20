import { describe, expect, it } from 'vitest';
import {
  DOGFOOD_I18N_DEBT_BASELINE,
  collectDogfoodI18nDebt,
  evaluateDogfoodI18nDebtRatchet,
} from '../../../examples/docs/i18n-debt.js';

describe('LX-012 DOGFOOD i18n debt inventory', () => {
  it('keeps DOGFOOD i18n debt counted by source surface instead of render output', () => {
    const inventory = collectDogfoodI18nDebt();

    expect(inventory.total).toBeGreaterThan(0);
    expect(inventory.bySurface.length).toBeGreaterThan(1);
    expect(inventory.bySurface.every((surface) => surface.count > 0)).toBe(true);
    expect(inventory.entries.every((entry) => entry.path.startsWith('examples/docs/'))).toBe(true);
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
});
