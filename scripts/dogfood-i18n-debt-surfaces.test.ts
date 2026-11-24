import { describe, expect, it } from 'vitest';
import { collectDogfoodI18nDebt } from '../examples/docs/i18n-debt.js';

const RAW = "const title = 'Raw English Title';";

function part(surface: string, name: string, copies: number) {
  return {
    surface,
    path: `examples/docs/${name}.ts`,
    text: Array.from({ length: copies }, () => RAW).join('\n'),
  };
}

describe('DOGFOOD i18n debt surface aggregation', () => {
  it('counts a surface split across part files once, with the sum of its parts', () => {
    const parts = [
      part('split-surface', 'split-surface.part01', 2),
      part('split-surface', 'split-surface.part02', 3),
      part('split-surface', 'split-surface.part03', 4),
    ];
    const inventory = collectDogfoodI18nDebt({ sources: parts });

    expect(inventory.bySurface).toEqual([{ surface: 'split-surface', count: 9 }]);
    expect(inventory.total).toBe(9);
  });

  it('keeps surfaces that share a prefix distinct, in source order', () => {
    const inventory = collectDogfoodI18nDebt({
      sources: [
        part('storybook', 'storybook', 1),
        part('storybook-app', 'storybook-app.part01', 2),
        part('storybook-app', 'storybook-app.part02', 2),
        part('storybook-workstation', 'storybook-workstation', 3),
      ],
    });

    expect(inventory.bySurface).toEqual([
      { surface: 'storybook', count: 1 },
      { surface: 'storybook-app', count: 4 },
      { surface: 'storybook-workstation', count: 3 },
    ]);
  });

  it('keeps the total when a part file moves between groups', () => {
    const before = collectDogfoodI18nDebt({
      sources: [part('alpha', 'one', 2), part('alpha', 'two', 3), part('beta', 'three', 4)],
    });
    const after = collectDogfoodI18nDebt({
      sources: [part('alpha', 'one', 2), part('beta', 'two', 3), part('beta', 'three', 4)],
    });
    const sum = (counts: readonly { readonly count: number }[]): number =>
      counts.reduce((total, entry) => total + entry.count, 0);

    expect(after.total).toBe(before.total);
    expect(sum(before.bySurface)).toBe(before.total);
    expect(sum(after.bySurface)).toBe(after.total);
    expect(after.bySurface).toEqual([
      { surface: 'alpha', count: 2 },
      { surface: 'beta', count: 7 },
    ]);
  });

  it('reports a part file of an unknown surface instead of dropping it', () => {
    const inventory = collectDogfoodI18nDebt({
      sources: [part('known', 'known', 1), part('mystery', 'mystery.part07', 5)],
    });

    expect(inventory.bySurface).toContainEqual({ surface: 'mystery', count: 5 });
    expect(inventory.total).toBe(6);
  });
});
