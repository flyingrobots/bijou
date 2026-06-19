import type { FramePage, CreateFramedAppOptions } from './app-frame.js';
import type {
  FramePaneScroll,
  InternalFrameModel,
  FrameAction,
  FramedAppMsg,
} from './app-frame-types.js';
import { wrapFrameMsg } from './app-frame-types.js';
import type { Cmd } from './types.js';
import { createSurface, type Surface } from '@flyingrobots/bijou';
import type { DockDirection } from './panel-dock.js';
import {
  createPanelVisibilityState,
  createPanelMaximizeState,
  toggleMinimized,
  restorePane,
  isMinimized,
  toggleMaximize,
} from './panel-state.js';
import {
  createPanelDockState,
  movePaneInContainer,
  resolveChildOrder,
  findPaneContainer,
} from './panel-dock.js';
import {
  createFocusAreaStateForSurface,
  focusAreaScrollBy,
  focusAreaScrollByX,
  focusAreaScrollToBottom,
  focusAreaScrollToTop,
  focusAreaPageDown,
  focusAreaPageUp,
  focusAreaScrollTo,
  focusAreaScrollToX,
} from './focus-area.js';
import { timeline } from './timeline.js';
import { EASINGS } from './spring.js';
import {
  collectPaneIds,
  assertUniquePaneIds,
  findPaneNode,
  frameBodyRect,
} from './app-frame-utils.js';
import { framePaneOutputToSurface, renderFrameNode } from './app-frame-render.js';
import type { ViewOutput } from './view-output.js';
import { animate } from './animate.js';

let focusedPaneMeasureScratch: Surface | null = null;
const FOOTER_TOGGLE_DURATION_MS = 200;

function renderPaneSurfaceForMeasurement(output: ViewOutput, width: number, height: number): Surface {
  const scratch = focusedPaneMeasureScratch;
  focusedPaneMeasureScratch = framePaneOutputToSurface(
    output,
    width,
    height,
    scratch?.width === width && scratch.height === height
      ? scratch
      : createSurface(width, height),
  );
  return focusedPaneMeasureScratch;
}

export function applyFrameAction<PageModel, Msg>(
  action: FrameAction,
  model: InternalFrameModel<PageModel, Msg>,
  options: CreateFramedAppOptions<PageModel, Msg>,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
): [InternalFrameModel<PageModel, Msg>, Cmd<FramedAppMsg<Msg>>[]] {
  switch (action.type) {
    case 'toggle-help':
      return [{ ...model, helpOpen: !model.helpOpen }, []];
    case 'toggle-perf-hud':
      return [{ ...model, perfHudOpen: !model.perfHudOpen }, []];
    case 'toggle-footer':
      return toggleFooter(model);
    case 'toggle-settings': {
      const activePage = pagesById.get(model.activePageId);
      const pageModel = model.pageModels[model.activePageId];
      if (activePage == null || pageModel === undefined) return [model, []];
      const settings = options.settings?.({
        model,
        activePage,
        pageModel,
      });
      const shellThemes = options.shellThemes ?? [];
      const hasStockShellThemeSettings = shellThemes.length > 1
        || shellThemes.some((theme) => (theme.modes?.length ?? 0) > 1);
      if (
        !hasStockShellThemeSettings
        && (settings == null || settings.sections.every((section) => section.rows.length === 0))
      ) {
        return [model, []];
      }
      const opening = !model.settingsOpen;
      return [{
        ...model,
        settingsOpen: opening,
        settingsFocusIndex: opening ? 0 : model.settingsFocusIndex,
        settingsScrollY: opening ? 0 : model.settingsScrollY,
        notificationCenterOpen: opening ? false : model.notificationCenterOpen,
        helpOpen: opening ? false : model.helpOpen,
        helpScrollY: opening ? 0 : model.helpScrollY,
        commandPalette: opening ? undefined : model.commandPalette,
        commandPaletteEntries: opening ? undefined : model.commandPaletteEntries,
        commandPaletteTitle: opening ? undefined : model.commandPaletteTitle,
        commandPaletteKind: opening ? undefined : model.commandPaletteKind,
      }, []];
    }
    case 'toggle-shell-theme-mode':
      return [model, []];
    case 'toggle-notifications': {
      if (!hasNotificationCenter(model, options, pagesById)) {
        return [model, []];
      }
      return [{
        ...model,
        notificationCenterOpen: !model.notificationCenterOpen,
        notificationCenterScrollY: model.notificationCenterOpen ? model.notificationCenterScrollY : 0,
        settingsOpen: false,
        helpOpen: false,
        helpScrollY: 0,
        commandPalette: undefined,
        commandPaletteEntries: undefined,
        commandPaletteTitle: undefined,
        commandPaletteKind: undefined,
        quitConfirmOpen: false,
      }, []];
    }
    case 'push-notification':
      return [model, []];
    case 'prev-tab':
      return switchTab(model, -1, pagesById, options);
    case 'next-tab':
      return switchTab(model, 1, pagesById, options);
    case 'next-pane':
      return [cyclePane(model, 1, pagesById), []];
    case 'prev-pane':
      return [cyclePane(model, -1, pagesById), []];
    case 'open-palette':
    case 'open-search':
      return [model, []];
    case 'toggle-minimize':
      return [applyToggleMinimize(model, pagesById), []];
    case 'toggle-maximize':
      return [applyToggleMaximize(model), []];
    case 'dock-up':
      return [applyDockMove(model, 'up', pagesById), []];
    case 'dock-down':
      return [applyDockMove(model, 'down', pagesById), []];
    case 'dock-left':
      return [applyDockMove(model, 'left', pagesById), []];
    case 'dock-right':
      return [applyDockMove(model, 'right', pagesById), []];
    case 'scroll-up':
    case 'scroll-down':
    case 'page-up':
    case 'page-down':
    case 'top':
    case 'bottom':
    case 'scroll-left':
    case 'scroll-right':
      return [scrollFocusedPane(model, action, pagesById, options), []];
    case 'runtime-issue':
    case 'notification-tick':
      return [model, []];
    case 'footer-transition':
      if (action.generation !== (model.footerAnimationGeneration ?? 0)) return [model, []];
      return [{
        ...model,
        footerTranslateY: Math.max(0, Math.min(1, action.translateY)),
      }, []];
    case 'footer-transition-complete':
      if (action.generation !== (model.footerAnimationGeneration ?? 0)) return [model, []];
      return [{
        ...model,
        footerVisible: action.visible,
        footerTranslateY: action.visible ? 0 : 1,
      }, []];
    case 'transition':
    case 'transition-complete':
      return [model, []];
  }
}

function toggleFooter<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
): [InternalFrameModel<PageModel, Msg>, Cmd<FramedAppMsg<Msg>>[]] {
  const currentVisible = model.footerVisible ?? true;
  const visible = !currentVisible;
  const generation = (model.footerAnimationGeneration ?? 0) + 1;
  const defaultTranslateY = currentVisible ? 0 : 1;
  const from = Math.max(0, Math.min(1, model.footerTranslateY ?? defaultTranslateY));
  const to = visible ? 0 : 1;
  const ease = visible ? EASINGS.easeIn : EASINGS.easeOut;
  return [{
    ...model,
    footerVisible: visible,
    footerAnimationGeneration: generation,
  }, [
    animate<FramedAppMsg<Msg>>({
      type: 'tween',
      from,
      to,
      duration: FOOTER_TOGGLE_DURATION_MS,
      ease,
      onFrame: (translateY) => wrapFrameMsg({
        type: 'footer-transition',
        translateY,
        generation,
      }),
      onComplete: () => wrapFrameMsg({
        type: 'footer-transition-complete',
        visible,
        generation,
      }),
    }),
  ]];
}

function hasNotificationCenter<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  options: CreateFramedAppOptions<PageModel, Msg>,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
): boolean {
  const activePage = pagesById.get(model.activePageId);
  if (activePage == null) return options.runtimeNotifications !== false;
  const pageModel = model.pageModels[model.activePageId];
  if (pageModel === undefined) return options.runtimeNotifications !== false;
  const provided = options.notificationCenter?.({
    model,
    activePage,
    pageModel,
    runtimeNotifications: model.runtimeNotifications,
  });
  return provided != null || options.runtimeNotifications !== false;
}

export function switchTab<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  delta: number,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
  options: CreateFramedAppOptions<PageModel, Msg>,
): [InternalFrameModel<PageModel, Msg>, Cmd<FramedAppMsg<Msg>>[]] {
  const idx = model.pageOrder.indexOf(model.activePageId);
  if (idx < 0) return [model, []];
  const nextIdx = (idx + delta + model.pageOrder.length) % model.pageOrder.length;
  const nextId = model.pageOrder[nextIdx];
  if (nextId === undefined) return [model, []];

  if (nextId === model.activePageId) return [model, []];

  const activePageModel = model.pageModels[model.activePageId];
  if (activePageModel === undefined) return [model, []];
  const activeTransition = options.transitionOverride
    ? options.transitionOverride(activePageModel)
    : options.transition;

  const hasTransition = activeTransition != null && activeTransition !== 'none';
  const nextGeneration = model.transitionGeneration + 1;

  const tl = hasTransition
    ? (options.transitionTimeline ?? timeline()
      .add('progress', {
        type: 'tween',
        from: 0,
        to: 1,
        duration: options.transitionDuration ?? 300,
        ease: EASINGS.easeInOutCubic,
      })
      .build())
    : undefined;

  const durationMs = tl?.estimatedDurationMs ?? options.transitionDuration ?? 300;

  const nextModel = syncPageFrameState({
    ...model,
    activePageId: nextId,
    previousPageId: model.activePageId,
    activeTransition,
    transitionProgress: hasTransition ? 0 : 1,
    transitionGeneration: nextGeneration,
    transitionFrame: 0,
    transitionStartMs: undefined,
    transitionTimeline: tl,
    transitionTimelineState: tl?.init(),
  }, nextId, pagesById);

  if (hasTransition) {
    const cmd: Cmd<FramedAppMsg<Msg>> = createTransitionTickCmd(durationMs, nextGeneration);
    return [nextModel, [cmd]];
  }

  return [nextModel, []];
}

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

  const curr = model.focusedPaneByPage[model.activePageId];
  const idx = curr == null ? 0 : paneIds.indexOf(curr);
  const nextIdx = idx < 0
    ? 0
    : (idx + delta + paneIds.length) % paneIds.length;
  const next = paneIds[nextIdx];
  if (next === undefined) return model;
  return {
    ...model,
    focusedPaneByPage: {
      ...model.focusedPaneByPage,
      [model.activePageId]: next,
    },
  };
}

export function scrollFocusedPane<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  action: Extract<
    FrameAction,
    { type: 'scroll-up' | 'scroll-down' | 'page-up' | 'page-down' | 'top' | 'bottom' | 'scroll-left' | 'scroll-right' }
  >,
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
    visibility: model.minimizedByPage[pageId] ?? createPanelVisibilityState(),
    dockState: model.dockStateByPage[pageId] ?? createPanelDockState(),
    frameBackgroundToken: undefined,
  });
  const paneRect = resolved.paneRects.get(focusedPaneId);
  if (paneRect == null || paneRect.width <= 0 || paneRect.height <= 0) return model;

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
  const prior = model.scrollByPage[pageId]?.[focusedPaneId] ?? { x: 0, y: 0 };
  state = focusAreaScrollTo(state, prior.y);
  state = focusAreaScrollToX(state, prior.x);

  switch (action.type) {
    case 'scroll-up':
      state = focusAreaScrollBy(state, -1);
      break;
    case 'scroll-down':
      state = focusAreaScrollBy(state, 1);
      break;
    case 'page-up':
      state = focusAreaPageUp(state);
      break;
    case 'page-down':
      state = focusAreaPageDown(state);
      break;
    case 'top':
      state = focusAreaScrollToTop(state);
      break;
    case 'bottom':
      state = focusAreaScrollToBottom(state);
      break;
    case 'scroll-left':
      state = focusAreaScrollByX(state, -1);
      break;
    case 'scroll-right':
      state = focusAreaScrollByX(state, 1);
      break;
  }

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
  const current = model.minimizedByPage[pageId] ?? createPanelVisibilityState();
  const next = toggleMinimized(current, focusedPaneId, allPaneIds);

  let newFocused = focusedPaneId;
  if (isMinimized(next, focusedPaneId)) {
    const visible = allPaneIds.filter((id) => !isMinimized(next, id));
    newFocused = visible[0] ?? focusedPaneId;
  }

  return {
    ...model,
    minimizedByPage: { ...model.minimizedByPage, [pageId]: next },
    focusedPaneByPage: { ...model.focusedPaneByPage, [pageId]: newFocused },
  };
}

export function applyToggleMaximize<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
): InternalFrameModel<PageModel, Msg> {
  const pageId = model.activePageId;
  const focusedPaneId = model.focusedPaneByPage[pageId];
  if (focusedPaneId == null) return model;

  const current = model.maximizedPaneByPage[pageId] ?? createPanelMaximizeState();
  const next = toggleMaximize(current, focusedPaneId);

  let visibility = model.minimizedByPage[pageId] ?? createPanelVisibilityState();
  if (next.maximizedPaneId && isMinimized(visibility, next.maximizedPaneId)) {
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
  const layoutTree = page.layout(pageModel);
  const container = findPaneContainer(layoutTree, focusedPaneId);
  if (container == null) return model;

  const dockState = model.dockStateByPage[pageId] ?? createPanelDockState();
  const currentOrder = resolveChildOrder(dockState, container.containerId, container.childIds);
  const next = movePaneInContainer(dockState, container.containerId, focusedPaneId, direction, currentOrder);

  return {
    ...model,
    dockStateByPage: { ...model.dockStateByPage, [pageId]: next },
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

  const prevScroll = model.scrollByPage[pageId] ?? {};
  const nextScroll: Record<string, FramePaneScroll> = {};
  for (const paneId of paneIds) {
    nextScroll[paneId] = prevScroll[paneId] ?? { x: 0, y: 0 };
  }

  const prevFocused = model.focusedPaneByPage[pageId];
  const focused = prevFocused != null && paneIds.includes(prevFocused)
    ? prevFocused
    : paneIds[0];

  return {
    ...model,
    focusedPaneByPage: {
      ...model.focusedPaneByPage,
      [pageId]: focused,
    },
    scrollByPage: {
      ...model.scrollByPage,
      [pageId]: nextScroll,
    },
  };
}

export function createTransitionTickCmd<Msg>(durationMs: number, generation: number): Cmd<FramedAppMsg<Msg>> {
  return (emit, caps) =>
    new Promise<undefined>((resolve) => {
      if (durationMs <= 0) {
        emit(wrapFrameMsg({ type: 'transition-complete', generation }));
        resolve(undefined);
        return;
      }

      let elapsedMs = 0;
      const pulse = caps.onPulse((dt) => {
        elapsedMs = Math.min(durationMs, elapsedMs + Math.max(0, dt * 1000));
        const rawProgress = Math.min(1, elapsedMs / durationMs);

        emit(wrapFrameMsg({
          type: 'transition',
          progress: rawProgress,
          generation,
          dt,
          elapsedMs,
        }));

        if (rawProgress >= 1) {
          pulse.dispose();
          emit(wrapFrameMsg({ type: 'transition-complete', generation }));
          resolve(undefined);
        }
      });
    });
}
