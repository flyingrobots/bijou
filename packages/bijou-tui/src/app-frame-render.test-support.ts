import { afterEach, describe, expect, it } from 'vitest';
import {
  createSurface,
  parseAnsiToSurface,
  setDefaultContext,
  type LayoutNode,
  type Surface,
} from '@flyingrobots/bijou';
import { createTestContext, must, _resetDefaultContextForTesting } from '@flyingrobots/bijou/adapters/test';
import type { CreateFramedAppOptions, FrameLayoutNode, FramePage } from './app-frame.js';
import type { InternalFrameModel } from './app-frame-types.js';
import { createFrameKeyMap } from './app-frame-utils.js';
import {
  framePaneOutputToSurface,
  renderFrameNode,
  renderHelpLine,
  renderMaximizedPaneInto,
  renderPageContentInto,
  renderTransition,
  resolveHeaderLine,
} from './app-frame-render.js';
import { createPanelVisibilityState } from './panel-state.js';
import { createPanelDockState } from './panel-dock.js';
import { createNotificationState } from './notification.js';
type EmptyModel = Record<string, never>;
type TestMsg = never;
type PaneRender = Extract<FrameLayoutNode, { readonly kind: 'pane' }>['render'];
function panePage<PageModel>(
  id: string,
  title: FramePage<PageModel, TestMsg>['title'],
  model: PageModel,
  render: PaneRender = () => createSurface(1, 1),
): FramePage<PageModel, TestMsg> {
  return {
    id,
    title,
    init: () => [model, []],
    update: (_msg, current) => [current, []],
    layout: () => ({ kind: 'pane', paneId: 'main', render }),
  };
}
function frameModel<PageModel>(
  overrides: Pick<InternalFrameModel<PageModel, TestMsg>, 'activePageId' | 'pageOrder' | 'pageModels'>
    & Partial<InternalFrameModel<PageModel, TestMsg>>,
): InternalFrameModel<PageModel, TestMsg> {
  return {
    warnedFrameKeyCollisionPages: {},
    focusedPaneByPage: {},
    scrollByPage: {},
    columns: 12,
    rows: 5,
    frameTimeMs: 0,
    viewTimeMs: 0,
    diffTimeMs: 0,
    frameOverBudget: false,
    perfHudOpen: false,
    helpOpen: false,
    helpScrollY: 0,
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
    ...overrides,
  };
}
function frameOptions<PageModel>(
  pages: readonly FramePage<PageModel, TestMsg>[],
  options: Omit<CreateFramedAppOptions<PageModel, TestMsg>, 'pages'> = {},
): CreateFramedAppOptions<PageModel, TestMsg> {
  return { pages, ...options };
}
function surfacePlainText(surface: Surface): string {
  const lines: string[] = [];
  for (let y = 0; y < surface.height; y++) {
    let line = '';
    for (let x = 0; x < surface.width; x++) {
      line += surface.get(x, y).char;
    }
    lines.push(line);
  }
  return lines.join('\n');
}
export {
  _resetDefaultContextForTesting,
  afterEach,
  createFrameKeyMap,
  createNotificationState,
  createPanelDockState,
  createPanelVisibilityState,
  createSurface,
  createTestContext,
  describe,
  expect,
  frameModel,
  frameOptions,
  framePaneOutputToSurface,
  it,
  must,
  panePage,
  parseAnsiToSurface,
  renderFrameNode,
  renderHelpLine,
  renderMaximizedPaneInto,
  renderPageContentInto,
  renderTransition,
  resolveHeaderLine,
  setDefaultContext,
  surfacePlainText,
};
export type {
  CreateFramedAppOptions,
  EmptyModel,
  FrameLayoutNode,
  FramePage,
  InternalFrameModel,
  LayoutNode,
  PaneRender,
  Surface,
  TestMsg,
};
