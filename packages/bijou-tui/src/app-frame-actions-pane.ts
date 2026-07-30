import type { FramePage } from './app-frame.js';
import type {
  FramePaneScroll,
  InternalFrameModel,
} from './app-frame-types.js';
import {
  assertUniquePaneIds,
  collectPaneIds,
} from './app-frame-utils.js';

export function cyclePane<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  delta: number,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
): InternalFrameModel<PageModel, Msg> {
  const page = pagesById.get(model.activePageId);
  const pageModel = model.pageModels[model.activePageId];
  if (page == null || pageModel === undefined) return model;
  const paneIds = collectPaneIds(page.layout(pageModel));
  if (paneIds.length === 0) return model;
  const current = model.focusedPaneByPage[model.activePageId];
  const index = current == null ? 0 : paneIds.indexOf(current);
  const nextIndex = index < 0
    ? 0
    : (index + delta + paneIds.length) % paneIds.length;
  const next = paneIds[nextIndex];
  if (next === undefined) return model;
  return {
    ...model,
    focusedPaneByPage: {
      ...model.focusedPaneByPage,
      [model.activePageId]: next,
    },
  };
}

export function syncPageFrameState<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  pageId: string,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
): InternalFrameModel<PageModel, Msg> {
  const page = pagesById.get(pageId);
  const pageModel = model.pageModels[pageId];
  if (page == null || pageModel === undefined) return model;
  const paneIds = collectPaneIds(page.layout(pageModel));
  assertUniquePaneIds(paneIds, `page "${pageId}" layout`);
  const previousScroll = model.scrollByPage[pageId] ?? {};
  const nextScroll: Record<string, FramePaneScroll> = {};
  for (const paneId of paneIds) {
    nextScroll[paneId] = previousScroll[paneId] ?? { x: 0, y: 0 };
  }
  const previousFocused = model.focusedPaneByPage[pageId];
  const focused = (
    previousFocused != null && paneIds.includes(previousFocused)
  )
    ? previousFocused
    : paneIds[0];
  return {
    ...model,
    focusedPaneByPage: { ...model.focusedPaneByPage, [pageId]: focused },
    scrollByPage: { ...model.scrollByPage, [pageId]: nextScroll },
  };
}
