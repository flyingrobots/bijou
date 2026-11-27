import { describe, expect, it } from 'vitest';
import { createSplitPaneState, splitPaneLayout, splitPaneResizeBy } from './split-pane.js';
import { placeSplitPaneLayout } from './split-pane-direction.js';
import type { SplitPaneLayout } from './split-pane.js';

type Case = readonly [width: number, ratio: number, minA: number, minB: number];

// Odd and even widths, every rounding case of round(ratio * available):
// exact halves, .5 ties, near-0 and near-1, thirds, and min clamps.
const CASES: readonly Case[] = [
  [10, 0.5, 0, 0], [11, 0.5, 0, 0], [12, 0.5, 0, 0], [9, 0.25, 0, 0], [8, 0.25, 0, 0],
  [7, 1 / 3, 0, 0], [13, 2 / 3, 0, 0], [10, 0, 0, 0], [10, 1, 0, 0], [11, 0.05, 0, 0],
  [11, 0.95, 0, 0], [6, 0.999, 0, 0], [6, 0.001, 0, 0], [3, 0.5, 0, 0], [2, 0.5, 0, 0],
  [1, 0.5, 0, 0], [0, 0.5, 0, 0], [21, 0.5, 15, 0], [21, 0.5, 0, 15], [10, 0.5, 8, 8],
];

function tiles(layout: SplitPaneLayout, width: number): void {
  const cells = Array.from({ length: Math.max(width, 1) }, () => 0);
  for (const rect of [layout.paneA, layout.divider, layout.paneB]) {
    for (let col = rect.col; col < rect.col + rect.width; col++) {
      cells[col] = (cells[col] ?? 0) + 1;
    }
  }
  expect(cells.slice(0, width).every((count) => count === 1)).toBe(true);
}

describe('placeSplitPaneLayout', () => {
  it.each(CASES)('width %i ratio %f: rtl keeps ltr sizes, swaps sides and tiles exactly', (width, ratio, minA, minB) => {
    const state = createSplitPaneState({ ratio });
    const options = { width, height: 3, minA, minB };
    const ltr = placeSplitPaneLayout(state, options, false);
    const rtl = placeSplitPaneLayout(state, options, true);

    expect(ltr).toEqual(splitPaneLayout(state, options));
    expect(rtl.paneA.width).toBe(ltr.paneA.width);
    expect(rtl.paneB.width).toBe(ltr.paneB.width);
    expect(rtl.divider.width).toBe(ltr.divider.width);
    if (width >= 1) {
      tiles(ltr, width);
      tiles(rtl, width);
      expect(rtl.paneB.col).toBe(0);
      expect(rtl.divider.col).toBe(ltr.paneB.width);
      expect(rtl.paneA.col).toBe(ltr.paneB.width + ltr.divider.width);
      expect(rtl.paneA.col + rtl.paneA.width).toBe(width);
    }
    for (const key of ['paneA', 'divider', 'paneB'] as const) {
      expect(rtl[key].row).toBe(ltr[key].row);
      expect(rtl[key].height).toBe(ltr[key].height);
    }
  });

  it('mirrors a wider divider without changing its size', () => {
    const state = createSplitPaneState({ ratio: 0.3 });
    const rtl = placeSplitPaneLayout(state, { width: 20, height: 2, dividerSize: 3 }, true);
    expect(rtl.paneB).toEqual({ row: 0, col: 0, width: 12, height: 2 });
    expect(rtl.divider).toEqual({ row: 0, col: 12, width: 3, height: 2 });
    expect(rtl.paneA).toEqual({ row: 0, col: 15, width: 5, height: 2 });
  });

  it('never mirrors a column (top and bottom) split', () => {
    const state = createSplitPaneState({ ratio: 0.4 });
    const options = { direction: 'column' as const, width: 9, height: 11 };
    expect(placeSplitPaneLayout(state, options, true)).toEqual(splitPaneLayout(state, options));
  });
});

describe('splitPaneResizeBy under a mirrored layout', () => {
  const limits = { total: 21 };
  const options = { width: 21, height: 1 };

  it('a positive delta grows the start pane and moves the rtl divider left', () => {
    const before = createSplitPaneState({ ratio: 0.5 });
    const after = splitPaneResizeBy(before, 2, limits);
    expect(after.ratio).toBeGreaterThan(before.ratio);
    const a = placeSplitPaneLayout(before, options, true);
    const b = placeSplitPaneLayout(after, options, true);
    expect(b.divider.col).toBe(a.divider.col - 2);
    expect(b.paneA.width).toBe(a.paneA.width + 2);
  });

  it('a physical move right is a negative delta under rtl: the divider moves right, the start share shrinks', () => {
    const before = createSplitPaneState({ ratio: 0.5 });
    const physicalRight = 3;
    const after = splitPaneResizeBy(before, -physicalRight, limits);
    expect(after.ratio).toBeLessThan(before.ratio);
    const a = placeSplitPaneLayout(before, options, true);
    const b = placeSplitPaneLayout(after, options, true);
    expect(b.divider.col).toBe(a.divider.col + physicalRight);
    const ltrA = placeSplitPaneLayout(before, options, false);
    const ltrB = placeSplitPaneLayout(splitPaneResizeBy(before, physicalRight, limits), options, false);
    expect(ltrB.divider.col).toBe(ltrA.divider.col + physicalRight);
  });
});
