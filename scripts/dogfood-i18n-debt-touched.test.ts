import { describe, expect, it } from 'vitest';
import {
  collectDogfoodI18nDebt,
  discoverDogfoodI18nDebtSources,
} from '../examples/docs/i18n-debt.js';
import { evaluateDogfoodTouchedI18nDebt } from '../examples/docs/i18n-debt-touched.js';

describe('DOGFOOD touched-file i18n debt ratchet', () => {
  it('fails when a changed DOGFOOD source does not reduce raw string debt', () => {
    const sources = discoverDogfoodI18nDebtSources({
      paths: ['examples/docs/fixture.ts', 'examples/docs/clean.ts'],
    }).map((source) => ({
      ...source,
      text: source.path.endsWith('fixture.ts')
        ? "export const label = 'Fresh DOGFOOD Label';"
        : "export const id = 'machine-id';",
    }));
    const inventory = collectDogfoodI18nDebt({ sources });
    const result = evaluateDogfoodTouchedI18nDebt(inventory, ['examples/docs/fixture.ts'], inventory);

    expect(result.ok).toBe(false);
    expect(result.violations).toEqual([
      'touched DOGFOOD source examples/docs/fixture.ts has 1 raw string debt entries; expected fewer than base 1',
    ]);
  });

  it('allows touched DOGFOOD sources when their raw string debt is lower than base', () => {
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
      text: "export const label = dogfoodText(i18n, 'fixture.label', 'Fresh DOGFOOD Label');",
    }));
    const inventory = collectDogfoodI18nDebt({ sources: currentSource === undefined ? [] : [currentSource] });
    const baseInventory = collectDogfoodI18nDebt({ sources: baseSource === undefined ? [] : [baseSource] });
    const result = evaluateDogfoodTouchedI18nDebt(inventory, ['examples/docs/fixture.ts'], baseInventory);

    expect(result.ok).toBe(true);
    expect(result.violations).toEqual([]);
  });

  it('allows touched DOGFOOD sources once their raw string debt is cleared', () => {
    const sources = discoverDogfoodI18nDebtSources({
      paths: ['examples/docs/clean.ts'],
    }).map((source) => ({
      ...source,
      text: "export const id = 'machine-id';",
    }));
    const inventory = collectDogfoodI18nDebt({ sources });
    const result = evaluateDogfoodTouchedI18nDebt(inventory, ['examples/docs/clean.ts']);

    expect(result.ok).toBe(true);
    expect(result.violations).toEqual([]);
  });
});
