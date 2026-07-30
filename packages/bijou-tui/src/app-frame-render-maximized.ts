import {
  createSurface,
  type BijouContext,
  type Surface,
} from '@flyingrobots/bijou';
import type { FramePage } from './app-frame.js';
import type { FramePaneGeometryResult } from './app-frame-render-contract.js';
import { renderPageContentInto } from './app-frame-render-content.js';
import {
  createFramePaneScratchPool,
  getFramePaneScratch,
  required,
  type FramePaneScratchPool,
} from './app-frame-render-scratch.js';
import {
  applySurfaceBackground,
  fillSurfaceBackground,
  framePaneOutputToSurface,
  resolveFrameBackgroundToken,
  resolveRenderCtx,
} from './app-frame-render-surface.js';
import type { InternalFrameModel, RenderResult } from './app-frame-types.js';
import { findPaneNode } from './app-frame-utils.js';
import {
  createFocusAreaStateForSurface,
  focusAreaScrollTo,
  focusAreaScrollToX,
  focusAreaSurfaceInto,
} from './focus-area.js';
import type { LayoutRect } from './layout-rect.js';

/** Render only the maximized pane at the full body rect. */
export function renderMaximizedPane<PageModel, Msg>(
  pageId: string,
  model: InternalFrameModel<PageModel, Msg>,
  bodyRect: LayoutRect,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
  maximizedPaneId: string,
  scratchPool: FramePaneScratchPool = createFramePaneScratchPool(),
  ctx?: BijouContext,
): RenderResult {
  const surface = createSurface(bodyRect.width, bodyRect.height);
  const geometry = renderMaximizedPaneInto(
    pageId,
    model,
    bodyRect,
    pagesById,
    maximizedPaneId,
    surface,
    0,
    0,
    scratchPool,
    ctx,
  );
  return {
    surface,
    paneRects: geometry.paneRects,
    paneOrder: geometry.paneOrder,
  };
}

/** Paint only the maximized pane into an existing target surface. */
export function renderMaximizedPaneInto<PageModel, Msg>(
  pageId: string,
  model: InternalFrameModel<PageModel, Msg>,
  bodyRect: LayoutRect,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
  maximizedPaneId: string,
  target: Surface,
  offsetRow = bodyRect.row,
  offsetCol = bodyRect.col,
  scratchPool: FramePaneScratchPool = createFramePaneScratchPool(),
  ctx?: BijouContext,
): FramePaneGeometryResult {
  const themeCtx = resolveRenderCtx(ctx);
  const background = resolveFrameBackgroundToken(themeCtx);
  fillSurfaceBackground(
    target,
    offsetCol,
    offsetRow,
    bodyRect.width,
    bodyRect.height,
    background,
  );
  const page = required(pagesById.get(pageId), `page "${pageId}"`);
  const pageModel = required(
    model.pageModels[pageId],
    `page model "${pageId}"`,
  );
  const pane = findPaneNode(page.layout(pageModel), maximizedPaneId);
  if (pane == null) {
    return renderPageContentInto(
      pageId,
      model,
      bodyRect,
      pagesById,
      target,
      offsetRow,
      offsetCol,
      scratchPool,
      ctx,
    );
  }
  const prior = model.scrollByPage[pageId]?.[maximizedPaneId] ?? { x: 0, y: 0 };
  const content = framePaneOutputToSurface(
    pane.render(bodyRect.width, bodyRect.height),
    bodyRect.width,
    bodyRect.height,
    getFramePaneScratch(scratchPool, bodyRect.width, bodyRect.height),
  );
  applySurfaceBackground(content, background);
  let state = createFocusAreaStateForSurface(content, {
    width: bodyRect.width,
    height: bodyRect.height,
    overflowX: pane.overflowX ?? 'hidden',
  });
  state = focusAreaScrollTo(state, prior.y);
  state = focusAreaScrollToX(state, prior.x);
  focusAreaSurfaceInto(
    content,
    state,
    target,
    {
      focused: true,
      ctx: themeCtx,
      id: maximizedPaneId,
      classes: ['focused', 'maximized'],
      focusedGutterToken: pane.focusedGutterToken,
      unfocusedGutterToken: pane.unfocusedGutterToken,
    },
    offsetCol,
    offsetRow,
  );
  return {
    paneRects: new Map([[maximizedPaneId, bodyRect]]),
    paneOrder: [maximizedPaneId],
  };
}
