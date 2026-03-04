import { describe, it, expect } from 'vitest';
import { visibleLength } from './viewport.js';
import {
  createSplitPaneState,
  splitPaneSetRatio,
  splitPaneResizeBy,
  splitPaneFocusNext,
  splitPaneFocusPrev,
  splitPaneLayout,
  splitPane,
} from './split-pane.js';

describe('split-pane state', () => {
  it('clamps ratio in state creation', () => {
    expect(createSplitPaneState({ ratio: -1 }).ratio).toBe(0);
    expect(createSplitPaneState({ ratio: 2 }).ratio).toBe(1);
  });

  it('setRatio clamps to [0, 1]', () => {
    const s = createSplitPaneState();
    expect(splitPaneSetRatio(s, -2).ratio).toBe(0);
    expect(splitPaneSetRatio(s, 3).ratio).toBe(1);
  });

  it('focus reducers toggle panes', () => {
    const a = createSplitPaneState({ focused: 'a' });
    expect(splitPaneFocusNext(a).focused).toBe('b');
    expect(splitPaneFocusPrev(a).focused).toBe('a');
    const b = createSplitPaneState({ focused: 'b' });
    expect(splitPaneFocusPrev(b).focused).toBe('a');
  });
});

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
});

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
});

describe('splitPane render', () => {
  it('renders exact width/height in row mode', () => {
    const state = createSplitPaneState({ ratio: 0.5 });
    const output = splitPane(state, {
      direction: 'row',
      width: 21,
      height: 4,
      paneA: (w, h) => `A(${w}x${h})`,
      paneB: (w, h) => `B(${w}x${h})`,
    });

    const lines = output.split('\n');
    expect(lines).toHaveLength(4);
    for (const line of lines) {
      expect(visibleLength(line)).toBe(21);
    }
    expect(output).toContain('A(');
    expect(output).toContain('B(');
  });

  it('renders exact width/height in column mode', () => {
    const state = createSplitPaneState({ ratio: 0.5 });
    const output = splitPane(state, {
      direction: 'column',
      width: 12,
      height: 7,
      paneA: () => 'top',
      paneB: () => 'bottom',
    });

    const lines = output.split('\n');
    expect(lines).toHaveLength(7);
    for (const line of lines) {
      expect(visibleLength(line)).toBe(12);
    }
    expect(output).toContain('top');
    expect(output).toContain('bottom');
  });
});
