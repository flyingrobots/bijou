import { describe, it, expect } from 'vitest';
import { serializeLayoutState } from './layout-preset.js';
import type { FrameModel } from './app-frame-types.js';
import { createNotificationState } from './notification.js';

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
      frameTimeMs: 0,
      viewTimeMs: 0,
      diffTimeMs: 0,
      frameBudgetMs: undefined,
      frameOverBudget: false,
      perfHudOpen: false,
      helpOpen: false,
      settingsOpen: false,
      notificationCenterOpen: false,
      quitConfirmOpen: false,
      settingsFocusIndex: 0,
      settingsScrollY: 0,
      notificationCenterScrollY: 0,
      transitionProgress: 1,
      transitionGeneration: 0,
      transitionFrame: 0,
      minimizedByPage: {},
      maximizedPaneByPage: {},
      dockStateByPage: {},
      splitRatioOverrides: {},
      runtimeNotifications: createNotificationState(),
      runtimeNotificationHistoryFilter: 'ALL',
      runtimeNotificationLoopActive: false,
    };

    const result = serializeLayoutState(model, ['page1']);
    expect(result.version).toBe(1);
    expect(result.activePageId).toBe('page1');
    expect(result.pages['page1']?.focusedPane).toBe('a');
    expect(result.pages['page1']?.minimized).toEqual([]);
    expect(result.pages['page1']?.maximizedPane).toBeUndefined();
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
      frameTimeMs: 0,
      viewTimeMs: 0,
      diffTimeMs: 0,
      frameBudgetMs: undefined,
      frameOverBudget: false,
      perfHudOpen: false,
      helpOpen: false,
      settingsOpen: false,
      notificationCenterOpen: false,
      quitConfirmOpen: false,
      settingsFocusIndex: 0,
      settingsScrollY: 0,
      notificationCenterScrollY: 0,
      transitionProgress: 1,
      transitionGeneration: 0,
      transitionFrame: 0,
      minimizedByPage: { page1: { minimized: new Set(['b']) } },
      maximizedPaneByPage: { page1: { maximizedPaneId: 'a' } },
      dockStateByPage: { page1: { orderByContainer: { 'split-1': ['b', 'a'] } } },
      splitRatioOverrides: { page1: { 'split-1': 0.3 } },
      runtimeNotifications: createNotificationState(),
      runtimeNotificationHistoryFilter: 'ALL',
      runtimeNotificationLoopActive: false,
    };

    const result = serializeLayoutState(model, ['page1']);
    expect(result.pages['page1']?.minimized).toEqual(['b']);
    expect(result.pages['page1']?.maximizedPane).toBe('a');
    expect(result.pages['page1']?.dockOrder).toEqual({ 'split-1': ['b', 'a'] });
    expect(result.pages['page1']?.splitRatios).toEqual({ 'split-1': 0.3 });
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
      frameTimeMs: 0,
      viewTimeMs: 0,
      diffTimeMs: 0,
      frameBudgetMs: undefined,
      frameOverBudget: false,
      perfHudOpen: false,
      helpOpen: false,
      settingsOpen: false,
      notificationCenterOpen: false,
      quitConfirmOpen: false,
      settingsFocusIndex: 0,
      settingsScrollY: 0,
      notificationCenterScrollY: 0,
      transitionProgress: 1,
      transitionGeneration: 0,
      transitionFrame: 0,
      minimizedByPage: {},
      maximizedPaneByPage: {},
      dockStateByPage: {},
      splitRatioOverrides: {},
      runtimeNotifications: createNotificationState(),
      runtimeNotificationHistoryFilter: 'ALL',
      runtimeNotificationLoopActive: false,
    };

    const result = serializeLayoutState(model, ['page1'], {
      minimizedByPage: { page1: { minimized: new Set(['a']) } },
      maximizedPaneByPage: { page1: { maximizedPaneId: 'b' } },
      splitRatiosByPage: { page1: { 'split-1': 0.7 } },
      dockStateByPage: { page1: { orderByContainer: { 'split-1': ['b', 'a'] } } },
    });

    expect(result.pages['page1']?.minimized).toEqual(['a']);
    expect(result.pages['page1']?.maximizedPane).toBe('b');
    expect(result.pages['page1']?.splitRatios).toEqual({ 'split-1': 0.7 });
    expect(result.pages['page1']?.dockOrder).toEqual({ 'split-1': ['b', 'a'] });
  });
});
