import { describe, it, expect } from 'vitest';
import {
  createPanelVisibilityState,
  createPanelMaximizeState,
  toggleMinimized,
  minimizePane,
  restorePane,
  isMinimized,
  toggleMaximize,
} from './panel-state.js';

describe('PanelVisibilityState', () => {
  it('starts with no minimized panes', () => {
    const state = createPanelVisibilityState();
    expect(state.minimized.size).toBe(0);
  });

  it('toggleMinimized minimizes a pane', () => {
    const state = createPanelVisibilityState();
    const next = toggleMinimized(state, 'a', ['a', 'b']);
    expect(isMinimized(next, 'a')).toBe(true);
    expect(isMinimized(next, 'b')).toBe(false);
  });

  it('toggleMinimized restores a minimized pane', () => {
    let state = createPanelVisibilityState();
    state = toggleMinimized(state, 'a', ['a', 'b']);
    expect(isMinimized(state, 'a')).toBe(true);
    state = toggleMinimized(state, 'a', ['a', 'b']);
    expect(isMinimized(state, 'a')).toBe(false);
  });

  it('cannot minimize the last visible pane', () => {
    let state = createPanelVisibilityState();
    state = minimizePane(state, 'a', ['a', 'b']);
    // Try to minimize the last remaining visible pane
    const next = minimizePane(state, 'b', ['a', 'b']);
    expect(isMinimized(next, 'b')).toBe(false);
  });

  it('toggleMinimized refuses to minimize last visible pane', () => {
    let state = createPanelVisibilityState();
    state = toggleMinimized(state, 'a', ['a', 'b']);
    const next = toggleMinimized(state, 'b', ['a', 'b']);
    expect(isMinimized(next, 'b')).toBe(false);
  });

  it('restorePane on non-minimized pane is no-op', () => {
    const state = createPanelVisibilityState();
    const next = restorePane(state, 'a');
    expect(next).toBe(state);
  });

  it('minimizePane with single pane returns unchanged state', () => {
    const state = createPanelVisibilityState();
    const next = minimizePane(state, 'a', ['a']);
    expect(isMinimized(next, 'a')).toBe(false);
  });
});

describe('PanelMaximizeState', () => {
  it('starts with no maximized pane', () => {
    const state = createPanelMaximizeState();
    expect(state.maximizedPaneId).toBeUndefined();
  });

  it('toggleMaximize sets the maximized pane', () => {
    const state = createPanelMaximizeState();
    const next = toggleMaximize(state, 'a');
    expect(next.maximizedPaneId).toBe('a');
  });

  it('toggleMaximize on same pane restores', () => {
    let state = createPanelMaximizeState();
    state = toggleMaximize(state, 'a');
    state = toggleMaximize(state, 'a');
    expect(state.maximizedPaneId).toBeUndefined();
  });

  it('toggleMaximize on different pane switches', () => {
    let state = createPanelMaximizeState();
    state = toggleMaximize(state, 'a');
    state = toggleMaximize(state, 'b');
    expect(state.maximizedPaneId).toBe('b');
  });
});
