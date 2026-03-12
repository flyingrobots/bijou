import { describe, it, expect } from 'vitest';
import {
  serializeLayoutState,
  restoreLayoutState,
  presetSideBySide,
  presetStacked,
  presetFocused,
  type SerializedLayoutState,
} from './layout-preset.js';
import type { FrameModel } from './app-frame.js';

describe('serializeLayoutState', () => {
  it('serializes empty state', () => {
    const model: FrameModel<unknown> = {
      activePageId: 'page1',
      pageOrder: ['page1'],
      pageModels: { page1: {} },
      focusedPaneByPage: { page1: 'a' },
      scrollByPage: {},
      columns: 80,
      rows: 24,
      helpOpen: false,
      transitionProgress: 1,
      transitionGeneration: 0,
      transitionFrame: 0,
      minimizedByPage: {},
      maximizedPaneByPage: {},
      dockStateByPage: {},
      splitRatioOverrides: {},
    };

    const result = serializeLayoutState(model, ['page1']);
    expect(result.version).toBe(1);
    expect(result.activePageId).toBe('page1');
    expect(result.pages['page1']!.focusedPane).toBe('a');
    expect(result.pages['page1']!.minimized).toEqual([]);
    expect(result.pages['page1']!.maximizedPane).toBeUndefined();
  });

  it('reads panel state from model when perPage is omitted', () => {
    const model: FrameModel<unknown> = {
      activePageId: 'page1',
      pageOrder: ['page1'],
      pageModels: { page1: {} },
      focusedPaneByPage: { page1: 'a' },
      scrollByPage: {},
      columns: 80,
      rows: 24,
      helpOpen: false,
      transitionProgress: 1,
      transitionGeneration: 0,
      transitionFrame: 0,
      minimizedByPage: { page1: { minimized: new Set(['b']) } },
      maximizedPaneByPage: { page1: { maximizedPaneId: 'a' } },
      dockStateByPage: { page1: { orderByContainer: { 'split-1': ['b', 'a'] } } },
      splitRatioOverrides: { page1: { 'split-1': 0.3 } },
    };

    const result = serializeLayoutState(model, ['page1']);
    expect(result.pages['page1']!.minimized).toEqual(['b']);
    expect(result.pages['page1']!.maximizedPane).toBe('a');
    expect(result.pages['page1']!.dockOrder).toEqual({ 'split-1': ['b', 'a'] });
    expect(result.pages['page1']!.splitRatios).toEqual({ 'split-1': 0.3 });
  });

  it('serializes with per-page state', () => {
    const model: FrameModel<unknown> = {
      activePageId: 'page1',
      pageOrder: ['page1'],
      pageModels: { page1: {} },
      focusedPaneByPage: { page1: 'b' },
      scrollByPage: {},
      columns: 80,
      rows: 24,
      helpOpen: false,
      transitionProgress: 1,
      transitionGeneration: 0,
      transitionFrame: 0,
      minimizedByPage: {},
      maximizedPaneByPage: {},
      dockStateByPage: {},
      splitRatioOverrides: {},
    };

    const result = serializeLayoutState(model, ['page1'], {
      minimizedByPage: { page1: { minimized: new Set(['a']) } },
      maximizedPaneByPage: { page1: { maximizedPaneId: 'b' } },
      splitRatiosByPage: { page1: { 'split-1': 0.7 } },
      dockStateByPage: { page1: { orderByContainer: { 'split-1': ['b', 'a'] } } },
    });

    expect(result.pages['page1']!.minimized).toEqual(['a']);
    expect(result.pages['page1']!.maximizedPane).toBe('b');
    expect(result.pages['page1']!.splitRatios).toEqual({ 'split-1': 0.7 });
    expect(result.pages['page1']!.dockOrder).toEqual({ 'split-1': ['b', 'a'] });
  });
});

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
    expect(restored.minimizedByPage['page1']!.minimized.has('a')).toBe(true);
    expect(restored.maximizedPaneByPage['page1']!.maximizedPaneId).toBe('b');
    expect(restored.dockStateByPage['page1']!.orderByContainer['split-1']).toEqual(['b', 'a']);
    expect(restored.splitRatiosByPage['page1']!['split-1']).toBe(0.6);
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

describe('preset helpers', () => {
  it('presetSideBySide creates equal split', () => {
    const preset = presetSideBySide('split-1');
    expect(preset.splitRatios['split-1']).toBe(0.5);
    expect(preset.maximizedPane).toBeUndefined();
    expect(preset.minimized).toEqual([]);
  });

  it('presetStacked creates equal split', () => {
    const preset = presetStacked('split-1');
    expect(preset.splitRatios['split-1']).toBe(0.5);
  });

  it('presetFocused maximizes the given pane', () => {
    const preset = presetFocused('editor');
    expect(preset.maximizedPane).toBe('editor');
    expect(preset.focusedPane).toBe('editor');
  });
});
