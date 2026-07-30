import {
  createSurface,
  type BijouContext,
  type Surface,
} from '@flyingrobots/bijou';
import type { FramePage } from './app-frame.js';
import type { FramePaneGeometryResult } from './app-frame-render-contract.js';
import { paintFrameNodeInto } from './app-frame-render-node.js';
import {
  createFramePaneScratchPool,
  type FramePaneScratchPool,
} from './app-frame-render-scratch.js';
import {
  fillSurfaceBackground,
  resolveFrameBackgroundToken,
  resolveRenderCtx,
} from './app-frame-render-surface.js';
import type {
  InternalFrameModel,
  RenderContext,
  RenderResult,
} from './app-frame-types.js';
import type { LayoutRect } from './layout-rect.js';
import { createPanelDockState } from './panel-dock.js';
import { createPanelVisibilityState } from './panel-state.js';
import { required } from './app-frame-render-scratch.js';

/** Render a page's layout tree within the frame body rect. */
export function renderPageContent<PageModel, Msg>(
  pageId: string,
  model: InternalFrameModel<PageModel, Msg>,
  bodyRect: LayoutRect,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
  ctx?: BijouContext,
): RenderResult {
  const surface = createSurface(bodyRect.width, bodyRect.height);
  const geometry = renderPageContentInto(
    pageId,
    model,
    bodyRect,
    pagesById,
    surface,
    0,
    0,
    createFramePaneScratchPool(),
    ctx,
  );
  return {
    surface,
    paneRects: geometry.paneRects,
    paneOrder: geometry.paneOrder,
  };
}

/** Paint a page's layout tree directly into an existing target surface. */
export function renderPageContentInto<PageModel, Msg>(
  pageId: string,
  model: InternalFrameModel<PageModel, Msg>,
  bodyRect: LayoutRect,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
  target: Surface,
  offsetRow = bodyRect.row,
  offsetCol = bodyRect.col,
  scratchPool: FramePaneScratchPool = createFramePaneScratchPool(),
  ctx?: BijouContext,
): FramePaneGeometryResult {
  const themeCtx = resolveRenderCtx(ctx);
  const frameBackgroundToken = resolveFrameBackgroundToken(themeCtx);
  fillSurfaceBackground(
    target,
    offsetCol,
    offsetRow,
    bodyRect.width,
    bodyRect.height,
    frameBackgroundToken,
  );
  const page = required(pagesById.get(pageId), `page "${pageId}"`);
  const pageModel = required(
    model.pageModels[pageId],
    `page model "${pageId}"`,
  );
  const renderCtx: RenderContext<PageModel, Msg> = {
    model,
    pageId,
    focusedPaneId: model.focusedPaneByPage[pageId],
    scrollByPane: model.scrollByPage[pageId] ?? {},
    visibility: model.minimizedByPage[pageId] ?? createPanelVisibilityState(),
    dockState: model.dockStateByPage[pageId] ?? createPanelDockState(),
    frameBackgroundToken,
    ctx: themeCtx,
  };
  return paintFrameNodeInto(
    page.layout(pageModel),
    {
      row: offsetRow,
      col: offsetCol,
      width: bodyRect.width,
      height: bodyRect.height,
    },
    bodyRect,
    renderCtx,
    target,
    scratchPool,
  );
}
