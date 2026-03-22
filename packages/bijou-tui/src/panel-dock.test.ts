import { describe, it, expect } from 'vitest';
import { stringToSurface } from '@flyingrobots/bijou';
import {
  createPanelDockState,
  movePaneInContainer,
  resolveChildOrder,
  findPaneContainer,
} from './panel-dock.js';
import type { FrameLayoutNode } from './app-frame.js';

function emptyView() {
  return stringToSurface('', 1, 1);
}

describe('PanelDockState', () => {
  it('starts with empty order overrides', () => {
    const state = createPanelDockState();
    expect(Object.keys(state.orderByContainer)).toHaveLength(0);
  });

  it('movePaneInContainer swaps panes on move right', () => {
    const state = createPanelDockState();
    const next = movePaneInContainer(state, 'split-1', 'a', 'right', ['a', 'b']);
    expect(resolveChildOrder(next, 'split-1', ['a', 'b'])).toEqual(['b', 'a']);
  });

  it('movePaneInContainer swaps panes on move left', () => {
    const state = createPanelDockState();
    const next = movePaneInContainer(state, 'split-1', 'b', 'left', ['a', 'b']);
    expect(resolveChildOrder(next, 'split-1', ['a', 'b'])).toEqual(['b', 'a']);
  });

  it('movePaneInContainer does nothing at boundary', () => {
    const state = createPanelDockState();
    const next = movePaneInContainer(state, 'split-1', 'a', 'left', ['a', 'b']);
    expect(resolveChildOrder(next, 'split-1', ['a', 'b'])).toEqual(['a', 'b']);
  });

  it('movePaneInContainer handles down/up direction', () => {
    const state = createPanelDockState();
    const next = movePaneInContainer(state, 'split-1', 'a', 'down', ['a', 'b']);
    expect(resolveChildOrder(next, 'split-1', ['a', 'b'])).toEqual(['b', 'a']);
  });

  it('movePaneInContainer ignores unknown paneId', () => {
    const state = createPanelDockState();
    const next = movePaneInContainer(state, 'split-1', 'unknown', 'right', ['a', 'b']);
    expect(next).toBe(state);
  });
});

describe('resolveChildOrder', () => {
  it('returns default order when no override', () => {
    const state = createPanelDockState();
    expect(resolveChildOrder(state, 'split-1', ['a', 'b'])).toEqual(['a', 'b']);
  });

  it('returns override order when set', () => {
    const state = { orderByContainer: { 'split-1': ['b', 'a'] } };
    expect(resolveChildOrder(state, 'split-1', ['a', 'b'])).toEqual(['b', 'a']);
  });

  it('falls back to default on length mismatch', () => {
    const state = { orderByContainer: { 'split-1': ['a', 'b', 'c'] } };
    expect(resolveChildOrder(state, 'split-1', ['a', 'b'])).toEqual(['a', 'b']);
  });

  it('falls back to default on ID mismatch', () => {
    const state = { orderByContainer: { 'split-1': ['a', 'c'] } };
    expect(resolveChildOrder(state, 'split-1', ['a', 'b'])).toEqual(['a', 'b']);
  });
});

describe('findPaneContainer', () => {
  const paneA: FrameLayoutNode = { kind: 'pane', paneId: 'a', render: () => emptyView() };
  const paneB: FrameLayoutNode = { kind: 'pane', paneId: 'b', render: () => emptyView() };

  it('finds pane in split container', () => {
    const tree: FrameLayoutNode = {
      kind: 'split',
      splitId: 'split-1',
      state: { ratio: 0.5, focused: 'a' },
      paneA,
      paneB,
    };
    const result = findPaneContainer(tree, 'a');
    expect(result).toEqual({ containerId: 'split-1', childIds: ['a', 'b'] });
  });

  it('finds pane in nested split', () => {
    const inner: FrameLayoutNode = {
      kind: 'split',
      splitId: 'inner',
      state: { ratio: 0.5, focused: 'a' },
      paneA,
      paneB,
    };
    const outer: FrameLayoutNode = {
      kind: 'split',
      splitId: 'outer',
      state: { ratio: 0.5, focused: 'a' },
      paneA: inner,
      paneB: { kind: 'pane', paneId: 'c', render: () => emptyView() },
    };
    const result = findPaneContainer(outer, 'b');
    expect(result).toEqual({ containerId: 'inner', childIds: ['a', 'b'] });
  });

  it('returns pane IDs (not area names) for grid containers', () => {
    const tree: FrameLayoutNode = {
      kind: 'grid',
      gridId: 'grid-1',
      columns: ['1fr', '1fr'],
      rows: ['1fr'],
      areas: ['left right'],
      cells: {
        left: { kind: 'pane', paneId: 'editor', render: () => emptyView() },
        right: { kind: 'pane', paneId: 'preview', render: () => emptyView() },
      },
    };
    const result = findPaneContainer(tree, 'editor');
    expect(result).toEqual({ containerId: 'grid-1', childIds: ['editor', 'preview'] });
  });

  it('returns undefined for root pane', () => {
    const result = findPaneContainer(paneA, 'a');
    expect(result).toBeUndefined();
  });

  it('returns undefined for unknown pane', () => {
    const tree: FrameLayoutNode = {
      kind: 'split',
      splitId: 'split-1',
      state: { ratio: 0.5, focused: 'a' },
      paneA,
      paneB,
    };
    const result = findPaneContainer(tree, 'nonexistent');
    expect(result).toBeUndefined();
  });
});
