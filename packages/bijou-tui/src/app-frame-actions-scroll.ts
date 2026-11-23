import type { FramePage, CreateFramedAppOptions } from './app-frame.js';
import type {
  FrameAction,
  InternalFrameModel,
} from './app-frame-types.js';
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
import { measureFocusedPane } from './app-frame-actions-scroll-measure.js';
import {
  createFocusedPaneMeasureCache,
  type FocusedPaneMeasureCache,
} from './app-frame-scroll-measure-cache.js';

export type ScrollAction = Extract<
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
  cache: FocusedPaneMeasureCache = createFocusedPaneMeasureCache(),
): InternalFrameModel<PageModel, Msg> {
  const pageId = model.activePageId;
  const focusedPaneId = model.focusedPaneByPage[pageId];
  if (focusedPaneId == null) return model;
  const page = pagesById.get(pageId);
  const pageModel = model.pageModels[pageId];
  if (page == null || pageModel === undefined) return model;
  const key = {
    revision: cache.revision(),
    pageId,
    paneId: focusedPaneId,
    columns: model.columns,
    rows: model.rows,
  };
  const measurement = cache.lookup(key)
    ?? measureFocusedPane(model, key, page, pageModel, options, cache);
  if (measurement === undefined) return model;
  let state = createFocusAreaStateForSurface(
    { width: measurement.contentWidth, height: measurement.contentHeight },
    {
      width: measurement.paneWidth,
      height: measurement.paneHeight,
      overflowX: measurement.overflowX,
    },
  );
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
