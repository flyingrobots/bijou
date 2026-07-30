import type { Overlay } from './overlay.js';
import type { InternalFrameModel } from './app-frame-types.js';
import type { FrameViewDependencies } from './app-frame-view-contract.js';
import type { renderFrameBase } from './app-frame-view-base.js';
import { renderNotificationStack } from './notification.js';
import {
  renderNotificationCenterDrawer,
  renderSettingsDrawer,
} from './app-frame-overlays.js';
import { renderShellQuitOverlay } from './shell-quit.js';
import { renderFramePerfHudOverlay } from './app-frame-performance.js';
import { collectFrameModalOverlays } from './app-frame-view-modals.js';

export function collectFrameOverlays<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  dependencies: FrameViewDependencies<PageModel, Msg>,
  base: ReturnType<typeof renderFrameBase<PageModel, Msg>>,
): Overlay[] {
  const { options, pagesById, themeRuntime } = dependencies;
  const {
    layerStack,
    paneRects,
    themedContext,
  } = base;
  const overlays: Overlay[] = [];
  if (options.overlayFactory != null) {
    const pageModel = model.pageModels[model.activePageId];
    if (pageModel === undefined) {
      throw new Error(
        `createFramedApp: active page model "${model.activePageId}" is missing`,
      );
    }
    overlays.push(
      ...options.overlayFactory({
        activePageId: model.activePageId,
        pageModel,
        paneRects,
        screenRect: {
          row: 0,
          col: 0,
          width: model.columns,
          height: model.rows,
        },
      }),
    );
  }
  if (dependencies.notificationOptions.enabled) {
    overlays.push(
      ...renderNotificationStack(model.runtimeNotifications, {
        screenWidth: model.columns,
        screenHeight: model.rows,
        margin: dependencies.notificationOptions.margin,
        gap: dependencies.notificationOptions.gap,
        ctx: themedContext ?? undefined,
      }),
    );
  }
  if (model.settingsOpen) {
    const layer = layerStack.find(
      (candidate) => candidate.kind === 'settings',
    );
    const overlay = renderSettingsDrawer(
      model,
      options,
      pagesById,
      themeRuntime.resolvedThemes,
      layer?.title,
      themedContext,
    );
    if (overlay != null) overlays.push(overlay);
  }
  if (model.notificationCenterOpen) {
    const layer = layerStack.find(
      (candidate) => candidate.kind === 'notification-center',
    );
    const overlay = renderNotificationCenterDrawer(
      model,
      options,
      pagesById,
      layer?.title,
      themedContext,
    );
    if (overlay != null) overlays.push(overlay);
  }
  overlays.push(...collectFrameModalOverlays(model, dependencies, base));
  if (model.quitConfirmOpen) {
    overlays.push(
      renderShellQuitOverlay(
        model.columns,
        model.rows,
        options.i18n,
        themedContext,
      ),
    );
  }
  if (model.perfHudOpen) {
    overlays.push(
      renderFramePerfHudOverlay(
        {
          columns: model.columns,
          rows: model.rows,
          frameTimeMs: model.frameTimeMs,
          viewTimeMs: model.viewTimeMs,
          diffTimeMs: model.diffTimeMs,
          refreshRate: themedContext?.runtime.refreshRate,
        },
        { i18n: options.i18n, ctx: themedContext },
      ),
    );
  }
  return overlays;
}
