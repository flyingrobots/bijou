import { describe, it, expect } from 'vitest';
import { createSurface, stringToSurface, surfaceToString } from '@flyingrobots/bijou';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { visibleLength } from './viewport.js';
import {
  createSplitPaneState,
  splitPaneSetRatio,
  splitPaneResizeBy,
  splitPaneToggleFocus,
  splitPaneFocusNext,
  splitPaneFocusPrev,
  splitPaneLayout,
  splitPane,
  splitPaneSurface,
} from './split-pane.js';

describe('split-pane state', () => {
  it('creates default state with ratio 0.5 and focus on pane A', () => {
    expect(createSplitPaneState()).toEqual({ ratio: 0.5, focused: 'a' });
  });

  it('clamps ratio in state creation', () => {
    expect(createSplitPaneState({ ratio: -1 }).ratio).toBe(0);
    expect(createSplitPaneState({ ratio: 2 }).ratio).toBe(1);
    expect(createSplitPaneState({ ratio: NaN }).ratio).toBe(0.5);
    expect(createSplitPaneState({ ratio: Infinity }).ratio).toBe(0.5);
    expect(createSplitPaneState({ ratio: -Infinity }).ratio).toBe(0.5);
  });

  it('setRatio clamps to [0, 1]', () => {
    const s = createSplitPaneState();
    expect(splitPaneSetRatio(s, -2).ratio).toBe(0);
    expect(splitPaneSetRatio(s, 3).ratio).toBe(1);
  });

  it('focus reducers toggle panes', () => {
    const a = createSplitPaneState({ focused: 'a' });
    expect(splitPaneToggleFocus(a).focused).toBe('b');
    expect(splitPaneFocusNext(a).focused).toBe('b');
    expect(splitPaneFocusPrev(a).focused).toBe('b');
    const b = createSplitPaneState({ focused: 'b' });
    expect(splitPaneToggleFocus(b).focused).toBe('a');
    expect(splitPaneFocusNext(b).focused).toBe('a');
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

  it('sanitizes multi-column dividerChar to preserve layout width', () => {
    const state = createSplitPaneState({ ratio: 0.5 });
    const output = splitPane(state, {
      direction: 'row',
      width: 16,
      height: 3,
      dividerChar: '██',
      paneA: () => 'left',
      paneB: () => 'right',
    });

    const lines = output.split('\n');
    expect(lines).toHaveLength(3);
    for (const line of lines) {
      expect(visibleLength(line)).toBe(16);
    }
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

  it('renders exact width/height on the surface path in row mode', () => {
    const ctx = createTestContext();
    const state = createSplitPaneState({ ratio: 0.5 });
    const surface = splitPaneSurface(state, {
      direction: 'row',
      width: 21,
      height: 4,
      paneA: () => stringToSurface('LEFT', 4, 1),
      paneB: () => stringToSurface('RIGHT', 5, 1),
    });

    expect(surface.width).toBe(21);
    expect(surface.height).toBe(4);

    const lines = surfaceToString(surface, ctx.style).split('\n');
    expect(lines).toHaveLength(4);
    for (const line of lines) {
      expect(visibleLength(line)).toBe(21);
    }
    expect(lines.join('\n')).toContain('LEFT');
    expect(lines.join('\n')).toContain('RIGHT');
  });

  it('preserves structured cell styling on the surface path', () => {
    const state = createSplitPaneState({ ratio: 0.5 });
    const styledPane = createSurface(2, 1, { char: 'L', fg: '#00ffff', bg: '#112233', empty: false });
    const surface = splitPaneSurface(state, {
      direction: 'row',
      width: 7,
      height: 1,
      paneA: () => styledPane,
      paneB: () => stringToSurface('R', 1, 1),
    });

    expect(surface.get(0, 0).char).toBe('L');
    expect(surface.get(0, 0).fg).toBe('#00ffff');
    expect(surface.get(0, 0).bg).toBe('#112233');
  });
});
