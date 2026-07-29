import { describe, expect, it } from 'vitest';
import { collectDogfoodI18nDebt } from '../examples/docs/i18n-debt.js';
import { evaluateDogfoodTouchedI18nDebt } from '../examples/docs/i18n-debt-touched.js';

describe('DOGFOOD touched-file i18n split lineage lifecycle', () => {
  it('compares numbered split modules with their canonical base source', () => {
    const rootPath = 'examples/docs/release-title.ts';
    const firstPart = 'examples/docs/release-title.part01.ts';
    const secondPart = 'examples/docs/release-title.part02.ts';
    const baseInventory = collectDogfoodI18nDebt({
      sources: [{
        surface: 'release-title',
        path: rootPath,
        text: [
          "export const first = 'Visible First';",
          "export const second = 'Visible Second';",
          "export const third = 'Visible Third';",
        ].join('\n'),
      }],
    });
    const inventory = collectDogfoodI18nDebt({
      sources: [
        {
          surface: 'release-title',
          path: firstPart,
          text: "export const first = 'Visible First';",
        },
        {
          surface: 'release-title',
          path: secondPart,
          text: "export const second = 'Visible Second';",
        },
      ],
    });

    const result = evaluateDogfoodTouchedI18nDebt(
      inventory,
      [rootPath, firstPart, secondPart],
      baseInventory,
    );

    expect(result.ok).toBe(true);
    expect(result.violations).toEqual([]);
    expect(result.touchedPaths).toEqual([firstPart, secondPart, rootPath]);
  });

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
