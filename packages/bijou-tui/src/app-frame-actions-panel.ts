import type { FramePage } from './app-frame.js';
import type { InternalFrameModel } from './app-frame-types.js';
import type { DockDirection } from './panel-dock.js';
import {
  createPanelDockState,
  findPaneContainer,
  movePaneInContainer,
  resolveChildOrder,
} from './panel-dock.js';
import {
  createPanelMaximizeState,
  createPanelVisibilityState,
  isMinimized,
  restorePane,
  toggleMaximize,
  toggleMinimized,
} from './panel-state.js';
import { collectPaneIds } from './app-frame-utils.js';

export function applyToggleMinimize<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
): InternalFrameModel<PageModel, Msg> {
  const pageId = model.activePageId;
  const focusedPaneId = model.focusedPaneByPage[pageId];
  if (focusedPaneId == null) return model;
  const page = pagesById.get(pageId);
  const pageModel = model.pageModels[pageId];
  if (page == null || pageModel === undefined) return model;
  const allPaneIds = collectPaneIds(page.layout(pageModel));
  const current =
    model.minimizedByPage[pageId] ?? createPanelVisibilityState();
  const next = toggleMinimized(current, focusedPaneId, allPaneIds);
  let newFocused = focusedPaneId;
  if (isMinimized(next, focusedPaneId)) {
    const visible = allPaneIds.filter((id) => !isMinimized(next, id));
    newFocused = visible[0] ?? focusedPaneId;
  }
  return {
    ...model,
    minimizedByPage: { ...model.minimizedByPage, [pageId]: next },
    focusedPaneByPage: {
      ...model.focusedPaneByPage,
      [pageId]: newFocused,
    },
  };
}

export function applyToggleMaximize<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
): InternalFrameModel<PageModel, Msg> {
  const pageId = model.activePageId;
  const focusedPaneId = model.focusedPaneByPage[pageId];
  if (focusedPaneId == null) return model;
  const current =
    model.maximizedPaneByPage[pageId] ?? createPanelMaximizeState();
  const next = toggleMaximize(current, focusedPaneId);
  let visibility =
    model.minimizedByPage[pageId] ?? createPanelVisibilityState();
  if (
    next.maximizedPaneId != null
    && isMinimized(visibility, next.maximizedPaneId)
  ) {
    visibility = restorePane(visibility, next.maximizedPaneId);
  }
  return {
    ...model,
    maximizedPaneByPage: { ...model.maximizedPaneByPage, [pageId]: next },
    minimizedByPage: { ...model.minimizedByPage, [pageId]: visibility },
  };
}

export function applyDockMove<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  direction: DockDirection,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
): InternalFrameModel<PageModel, Msg> {
  const pageId = model.activePageId;
  const focusedPaneId = model.focusedPaneByPage[pageId];
  if (focusedPaneId == null) return model;
  const page = pagesById.get(pageId);
  const pageModel = model.pageModels[pageId];
  if (page == null || pageModel === undefined) return model;
  const container = findPaneContainer(page.layout(pageModel), focusedPaneId);
  if (container == null) return model;
  const dockState =
    model.dockStateByPage[pageId] ?? createPanelDockState();
  const currentOrder = resolveChildOrder(
    dockState,
    container.containerId,
    container.childIds,
  );
  const next = movePaneInContainer(
    dockState,
    container.containerId,
    focusedPaneId,
    direction,
    currentOrder,
  );
  return {
    ...model,
    dockStateByPage: { ...model.dockStateByPage, [pageId]: next },
  };
}
