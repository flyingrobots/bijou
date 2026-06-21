import { describe, it, expect } from 'vitest';
import { restoreLayoutState, type SerializedLayoutState } from './layout-preset.js';

describe('restoreLayoutState', () => {
  it('round-trips through serialize/restore', () => {
    const serialized: SerializedLayoutState = {
      version: 1,
      activePageId: 'page1',
      pages: {
        page1: {
          splitRatios: { 'split-1': 0.6 },
          focusedPane: 'b',
          minimized: ['a'],
          dockOrder: { 'split-1': ['b', 'a'] },
          maximizedPane: 'b',
        },
      },
    };

    const restored = restoreLayoutState(serialized);
    expect(restored.activePageId).toBe('page1');
    expect(restored.focusedPaneByPage['page1']).toBe('b');
    expect(restored.minimizedByPage['page1']?.minimized.has('a')).toBe(true);
    expect(restored.maximizedPaneByPage['page1']?.maximizedPaneId).toBe('b');
    expect(restored.dockStateByPage['page1']?.orderByContainer['split-1']).toEqual(['b', 'a']);
    expect(restored.splitRatiosByPage['page1']?.['split-1']).toBe(0.6);
  });

  it('handles empty pages', () => {
    const serialized: SerializedLayoutState = {
      version: 1,
      activePageId: 'page1',
      pages: {},
    };

    const restored = restoreLayoutState(serialized);
    expect(Object.keys(restored.focusedPaneByPage)).toHaveLength(0);
  });
});
