import { describe, it, expect } from 'vitest';
import { createSplitPaneState, splitPaneResizeBy, splitPaneLayout } from './split-pane.js';

describe('splitPaneResizeBy', () => {
  it('adjusts ratio based on delta', () => {
    const state = createSplitPaneState({ ratio: 0.5 });
    const biggerA = splitPaneResizeBy(state, 5, { total: 21, dividerSize: 1 });
    const smallerA = splitPaneResizeBy(state, -5, { total: 21, dividerSize: 1 });
    expect(biggerA.ratio).toBeGreaterThan(state.ratio);
    expect(smallerA.ratio).toBeLessThan(state.ratio);
  });

  it('honors min constraints during resize', () => {
    const state = createSplitPaneState({ ratio: 0.9 });
    const next = splitPaneResizeBy(state, 50, { total: 40, dividerSize: 1, minA: 5, minB: 20 });
    const layout = splitPaneLayout(next, { direction: 'row', width: 40, height: 2, dividerSize: 1, minA: 5, minB: 20 });
    expect(layout.paneB.width).toBeGreaterThanOrEqual(20);
  });

  it('ignores non-finite resize delta and sanitizes limit inputs', () => {
    const state = createSplitPaneState({ ratio: 0.5 });
    const next = splitPaneResizeBy(state, Number.NaN, {
      total: 21.8,
      dividerSize: Number.NaN,
      minA: 2.9,
      minB: Number.POSITIVE_INFINITY,
    });

    expect(next.ratio).toBe(state.ratio);
  });
});
