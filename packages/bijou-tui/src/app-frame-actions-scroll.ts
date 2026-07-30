import type { FramePage, CreateFramedAppOptions } from './app-frame.js';
import type {
  FrameAction,
  InternalFrameModel,
} from './app-frame-types.js';
import {
  createPanelDockState,
} from './panel-dock.js';
import {
  createPanelVisibilityState,
} from './panel-state.js';
import {
  createFocusAreaStateForSurface,
  focusAreaPageDown,
  focusAreaPageUp,
  focusAreaScrollBy,
  focusAreaScrollByX,
  focusAreaScrollTo,
  focusAreaScrollToBottom,
  focusAreaScrollToTop,
  focusAreaScrollToX,
  type FocusAreaState,
} from './focus-area.js';
import { renderFrameNode } from './app-frame-render.js';
import {
  findPaneNode,
  frameBodyRect,
} from './app-frame-utils.js';
import { renderPaneSurfaceForMeasurement } from './app-frame-actions-measure.js';

type ScrollAction = Extract<
  FrameAction,
  {
    type:
      | 'scroll-up'
      | 'scroll-down'
      | 'page-up'
      | 'page-down'
      | 'top'
      | 'bottom'
      | 'scroll-left'
      | 'scroll-right';
  }
>;

export function scrollFocusedPane<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  action: ScrollAction,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
  options: CreateFramedAppOptions<PageModel, Msg>,
): InternalFrameModel<PageModel, Msg> {
  const pageId = model.activePageId;
  const focusedPaneId = model.focusedPaneByPage[pageId];
  if (focusedPaneId == null) return model;
  const page = pagesById.get(pageId);
  const pageModel = model.pageModels[pageId];
  if (page == null || pageModel === undefined) return model;
  const layoutTree = page.layout(pageModel);
  const bodyRect = frameBodyRect(
    model.columns,
    model.rows,
    options.bodyTopRows ?? 1,
    options.bodyBottomRows ?? 1,
  );
  const resolved = renderFrameNode(layoutTree, bodyRect, {
    model,
    pageId,
    focusedPaneId,
    scrollByPane: model.scrollByPage[pageId] ?? {},
    visibility:
      model.minimizedByPage[pageId] ?? createPanelVisibilityState(),
    dockState: model.dockStateByPage[pageId] ?? createPanelDockState(),
    frameBackgroundToken: undefined,
  });
  const paneRect = resolved.paneRects.get(focusedPaneId);
  if (
    paneRect == null
    || paneRect.width <= 0
    || paneRect.height <= 0
  ) {
    return model;
  }
  const paneNode = findPaneNode(layoutTree, focusedPaneId);
  if (paneNode == null) return model;
  const contentSurface = renderPaneSurfaceForMeasurement(
    paneNode.render(paneRect.width, paneRect.height),
    paneRect.width,
    paneRect.height,
  );
  let state = createFocusAreaStateForSurface(contentSurface, {
    width: paneRect.width,
    height: paneRect.height,
    overflowX: paneNode.overflowX ?? 'hidden',
  });
  const previous = model.scrollByPage[pageId]?.[focusedPaneId]
    ?? { x: 0, y: 0 };
  state = focusAreaScrollTo(state, previous.y);
  state = focusAreaScrollToX(state, previous.x);
  state = applyScrollAction(state, action);
  const pageScroll = model.scrollByPage[pageId] ?? {};
  return {
    ...model,
    scrollByPage: {
      ...model.scrollByPage,
      [pageId]: {
        ...pageScroll,
        [focusedPaneId]: { x: state.scroll.x, y: state.scroll.y },
      },
    },
  };
}

function applyScrollAction(
  state: FocusAreaState,
  action: ScrollAction,
): FocusAreaState {
  switch (action.type) {
    case 'scroll-up':
      return focusAreaScrollBy(state, -1);
    case 'scroll-down':
      return focusAreaScrollBy(state, 1);
    case 'page-up':
      return focusAreaPageUp(state);
    case 'page-down':
      return focusAreaPageDown(state);
    case 'top':
      return focusAreaScrollToTop(state);
    case 'bottom':
      return focusAreaScrollToBottom(state);
    case 'scroll-left':
      return focusAreaScrollByX(state, -1);
    case 'scroll-right':
      return focusAreaScrollByX(state, 1);
  }
}
