import { describe, expect, it } from 'vitest';
import { collectDogfoodI18nDebt } from '../examples/docs/i18n-debt.js';
import { evaluateDogfoodTouchedI18nDebt } from '../examples/docs/i18n-debt-touched.js';

describe('DOGFOOD touched-file i18n split lineage lifecycle', () => {
  it('does not keep split lineage active after the root debt is cleared', () => {
    const rootPath = 'examples/docs/legacy.ts';
    const childPath = 'examples/docs/legacy-child.ts';
    const baseInventory = collectDogfoodI18nDebt({
      sources: [{ surface: 'legacy', path: rootPath, text: 'export {};' }],
    });
    const inventory = collectDogfoodI18nDebt({
      sources: [
        { surface: 'legacy', path: rootPath, text: 'export {};' },
        { surface: 'legacy-child', path: childPath, text: "export const label = 'Visible Child';" },
      ],
    });
    const result = evaluateDogfoodTouchedI18nDebt(
      inventory,
      [rootPath],
      baseInventory,
      [{ rootPath, childPaths: [childPath] }],
    );

    expect(result.ok).toBe(true);
    expect(result.violations).toEqual([]);
  });
});
