import { describe, it, expect } from 'vitest';
import { createSplitPaneState, splitPaneLayout } from './split-pane.js';

describe('splitPaneLayout', () => {
  it('solves row layout with divider', () => {
    const state = createSplitPaneState({ ratio: 0.5 });
    const layout = splitPaneLayout(state, { direction: 'row', width: 80, height: 20, dividerSize: 1 });
    expect(layout.paneA.width + layout.divider.width + layout.paneB.width).toBe(80);
    expect(layout.paneA.height).toBe(20);
    expect(layout.paneB.col).toBe(layout.paneA.width + 1);
  });

  it('solves column layout with divider', () => {
    const state = createSplitPaneState({ ratio: 0.25 });
    const layout = splitPaneLayout(state, { direction: 'column', width: 50, height: 40, dividerSize: 1 });
    expect(layout.paneA.height + layout.divider.height + layout.paneB.height).toBe(40);
    expect(layout.paneA.width).toBe(50);
    expect(layout.paneB.row).toBe(layout.paneA.height + 1);
  });

  it('enforces min constraints', () => {
    const state = createSplitPaneState({ ratio: 0.1 });
    const layout = splitPaneLayout(state, {
      direction: 'row',
      width: 30,
      height: 5,
      dividerSize: 1,
      minA: 10,
      minB: 15,
    });
    expect(layout.paneA.width).toBeGreaterThanOrEqual(10);
    expect(layout.paneB.width).toBeGreaterThanOrEqual(15);
  });

  it('sanitizes non-finite and fractional geometry inputs', () => {
    const state = createSplitPaneState({ ratio: 0.5 });
    const layout = splitPaneLayout(state, {
      direction: 'row',
      width: Number.NaN,
      height: 9.8,
      dividerSize: Number.POSITIVE_INFINITY,
      minA: 3.9,
      minB: Number.NaN,
    });

    expect(layout.paneA.height).toBe(9);
    expect(layout.divider.width).toBe(1);
    expect(layout.paneA.width).toBe(0);
    expect(layout.paneB.width).toBe(0);
  });

  it('prioritizes minB when constraints conflict', () => {
    const state = createSplitPaneState({ ratio: 0.9 });
    const layout = splitPaneLayout(state, {
      direction: 'row',
      width: 21,
      height: 5,
      dividerSize: 1,
      minA: 15,
      minB: 15,
    });
    expect(layout.paneB.width).toBe(15);
    expect(layout.paneA.width).toBe(5);
  });
});
