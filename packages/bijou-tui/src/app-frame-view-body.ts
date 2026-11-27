import type { BijouContext, Surface } from '@flyingrobots/bijou';
import type { InternalFrameModel } from './app-frame-types.js';
import type { FrameViewDependencies } from './app-frame-view-contract.js';
import type { LayoutRect } from './layout-rect.js';
import {
  renderMaximizedPane,
  renderMaximizedPaneInto,
  renderPageContent,
  renderPageContentInto,
  renderTransition,
} from './app-frame-render.js';
import { frameInlineDirection } from './app-frame-split-direction.js';

interface FrameBodyResult {
  readonly bodySurface: Surface | undefined;
  readonly paneRects: ReturnType<typeof renderPageContent>['paneRects'];
}

export function renderFrameBody<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  bodyRect: LayoutRect,
  frameSurface: Surface,
  dependencies: FrameViewDependencies<PageModel, Msg>,
  themedContext: BijouContext | undefined,
): FrameBodyResult {
  const { options, pagesById, paneScratchPool } = dependencies;
  const direction = frameInlineDirection(options.i18n);
  const maximizedPaneId =
    model.maximizedPaneByPage[model.activePageId]?.maximizedPaneId;
  const transition = model.activeTransition ?? options.transition;
  if (
    model.previousPageId != null &&
    model.transitionProgress < 1 &&
    transition &&
    transition !== 'none'
  ) {
    const active = maximizedPaneId
      ? renderMaximizedPane(
          model.activePageId,
          model,
          bodyRect,
          pagesById,
          maximizedPaneId,
          paneScratchPool,
          themedContext,
          direction,
        )
      : renderPageContent(
          model.activePageId,
          model,
          bodyRect,
          pagesById,
          themedContext,
          direction,
        );
    if (themedContext == null) {
      return { bodySurface: active.surface, paneRects: active.paneRects };
    }
    const previous = renderPageContent(
      model.previousPageId,
      model,
      bodyRect,
      pagesById,
      themedContext,
      direction,
    );
    return {
      bodySurface: renderTransition(
        previous.surface,
        active.surface,
        transition,
        model.transitionProgress,
        bodyRect.width,
        bodyRect.height,
        themedContext,
        model.transitionFrame,
      ),
      paneRects: active.paneRects,
    };
  }
  const active = maximizedPaneId
    ? renderMaximizedPaneInto(
        model.activePageId,
        model,
        bodyRect,
        pagesById,
        maximizedPaneId,
        frameSurface,
        bodyRect.row,
        bodyRect.col,
        paneScratchPool,
        themedContext,
        direction,
      )
    : renderPageContentInto(
        model.activePageId,
        model,
        bodyRect,
        pagesById,
        frameSurface,
        bodyRect.row,
        bodyRect.col,
        paneScratchPool,
        themedContext,
        direction,
      );
  return { bodySurface: undefined, paneRects: active.paneRects };
}
