import { describe, expect, it } from 'vitest';
import {
  collectDogfoodI18nDebt,
  discoverDogfoodI18nDebtSources,
} from '../examples/docs/i18n-debt.js';
import { evaluateDogfoodTouchedI18nDebt } from '../examples/docs/i18n-debt-touched.js';

describe('DOGFOOD touched-file i18n debt: change-scoped added copy (DL-037)', () => {
  it('rejects a touched DOGFOOD source that adds a raw string even when net debt falls', () => {
    const [baseSource] = discoverDogfoodI18nDebtSources({
      paths: ['examples/docs/fixture.ts'],
    }).map((source) => ({
      ...source,
      text: [
        "export const label = 'Fresh DOGFOOD Label';",
        "export const summary = 'Raw English Summary';",
      ].join('\n'),
    }));
    const [currentSource] = discoverDogfoodI18nDebtSources({
      paths: ['examples/docs/fixture.ts'],
    }).map((source) => ({
      ...source,
      text: "export const added = 'Brand New Visible Copy';",
    }));
    const inventory = collectDogfoodI18nDebt({ sources: currentSource === undefined ? [] : [currentSource] });
    const baseInventory = collectDogfoodI18nDebt({ sources: baseSource === undefined ? [] : [baseSource] });
    const result = evaluateDogfoodTouchedI18nDebt(inventory, ['examples/docs/fixture.ts'], baseInventory);

    expect(result.ok).toBe(false);
    expect(result.violations).toEqual([
      'touched DOGFOOD source examples/docs/fixture.ts adds raw string "Brand New Visible Copy"; localize added or modified copy',
    ]);
  });

  it('allows a one-entry reduction without localizing the rest of the touched file', () => {
    const [baseSource] = discoverDogfoodI18nDebtSources({
      paths: ['examples/docs/fixture.ts'],
    }).map((source) => ({
      ...source,
      text: [
        "export const first = 'Visible First';",
        "export const second = 'Visible Second';",
        "export const third = 'Visible Third';",
      ].join('\n'),
    }));
    const [currentSource] = discoverDogfoodI18nDebtSources({
      paths: ['examples/docs/fixture.ts'],
    }).map((source) => ({
      ...source,
      text: [
        "export const family = 'guided-flow';",
        "export const second = 'Visible Second';",
        "export const third = 'Visible Third';",
        "export const first = dogfoodText(i18n, 'fixture.first', 'Visible First');",
      ].join('\n'),
    }));
    const inventory = collectDogfoodI18nDebt({ sources: currentSource === undefined ? [] : [currentSource] });
    const baseInventory = collectDogfoodI18nDebt({ sources: baseSource === undefined ? [] : [baseSource] });
    const result = evaluateDogfoodTouchedI18nDebt(inventory, ['examples/docs/fixture.ts'], baseInventory);

    expect(result.ok).toBe(true);
  });
});
