import { createSurface, type Surface } from '@flyingrobots/bijou';
import type {
  InternalFrameModel,
} from './app-frame-types.js';
import type {
  FrameViewDependencies,
  FrameViewScratch,
} from './app-frame-view-contract.js';
import { resolveBodyRect } from './app-frame-model-helpers.js';
import { resolvePresentedLayerContext } from './app-frame-presentation.js';
import { resolveNotificationFooterCue } from './app-frame-overlays.js';
import { renderFrameBody } from './app-frame-view-body.js';
import {
  renderHelpLine,
  resolveHeaderLine,
} from './app-frame-render.js';

const composedSurface = (
  scratch: FrameViewScratch,
  width: number,
  height: number,
): Surface => {
  if (
    scratch.composed?.width !== width ||
    scratch.composed.height !== height
  ) {
    scratch.composed = createSurface(width, height);
  }
  return scratch.composed;
};

export function renderFrameBase<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  dependencies: FrameViewDependencies<PageModel, Msg>,
) {
  const { options, pagesById, scratch, themeRuntime } =
    dependencies;
  const themedContext = themeRuntime.resolveThemeContext(
    model.activeShellThemeId,
  );
  const presentation = resolvePresentedLayerContext(
    model,
    dependencies.presentation,
  );
  const headerResult = resolveHeaderLine(
    model,
    options,
    pagesById,
    scratch.header,
    themedContext,
  );
  scratch.header = headerResult.surface;
  scratch.helpLine = renderHelpLine(
    model,
    presentation.activeLayer,
    options.i18n,
    resolveNotificationFooterCue(model, options, pagesById),
    scratch.helpLine,
    themedContext,
  );
  const bodyRect = resolveBodyRect(model, options);
  const frameSurface = composedSurface(
    scratch,
    model.columns,
    model.rows,
  );
  // clear() is load-bearing: it resets dim flags left by overlay compositing
  // on the previous frame. Do not skip or defer this call.
  frameSurface.clear();
  frameSurface.blit(headerResult.surface, 0, 0);
  if (model.rows > 1) {
    const visible = model.footerVisible ?? true;
    const translate = Math.max(
      0,
      Math.min(1, model.footerTranslateY ?? (visible ? 0 : 1)),
    );
    const row =
      model.rows -
      scratch.helpLine.height +
      Math.floor(translate * scratch.helpLine.height);
    if (row < model.rows) frameSurface.blit(scratch.helpLine, 0, row);
  }
  const { bodySurface, paneRects } = renderFrameBody(
    model,
    bodyRect,
    frameSurface,
    dependencies,
    themedContext,
  );
  dependencies.workspace.remember(
    model,
    paneRects,
    headerResult.tabTargets,
  );
  return {
    ...presentation,
    bodyRect,
    bodySurface,
    frameSurface,
    paneRects,
    themedContext,
  };
}
