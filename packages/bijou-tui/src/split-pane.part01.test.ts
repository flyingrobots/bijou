import { describe, it, expect } from 'vitest';
import { createSplitPaneState, splitPaneSetRatio, splitPaneToggleFocus, splitPaneFocusNext, splitPaneFocusPrev } from './split-pane.js';

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
