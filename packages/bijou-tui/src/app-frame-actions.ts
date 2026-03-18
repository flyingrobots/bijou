/**
 * State reducers for `app-frame.ts`.
 *
 * Tab switching, pane cycling, scroll actions, minimize/maximize/dock,
 * page frame state sync, and transition tick command.
 */

import type { FramePage, CreateFramedAppOptions, FramePaneScroll } from './app-frame.js';
import type {
  InternalFrameModel,
  FrameAction,
} from './app-frame-types.js';
import { wrapFrameMsg } from './app-frame-types.js';
import type { Cmd } from './types.js';
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
  createFocusAreaState,
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
import { framePaneOutputToString, renderFrameNode } from './app-frame-render.js';

/** Dispatch a frame-level action (tab switch, pane cycle, scroll, palette, help toggle, transitions). */
export function applyFrameAction<PageModel, Msg>(
  action: FrameAction,
  model: InternalFrameModel<PageModel, Msg>,
  options: CreateFramedAppOptions<PageModel, Msg>,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
): [InternalFrameModel<PageModel, Msg>, Cmd<Msg>[]] {
  switch (action.type) {
    case 'toggle-help':
      return [{ ...model, helpOpen: !model.helpOpen }, []];
    case 'prev-tab':
      return switchTab(model, -1, pagesById, options);
    case 'next-tab':
      return switchTab(model, 1, pagesById, options);
    case 'next-pane':
      return [cyclePane(model, 1, pagesById), []];
    case 'prev-pane':
      return [cyclePane(model, -1, pagesById), []];
    case 'open-palette':
      // Palette opening is gated by `enableCommandPalette` and handled in the
      // key-handler path of app-frame.ts → openCommandPalette(). This no-op
      // covers the recursive case (e.g., a palette frame-action entry that
      // would re-trigger open-palette while the palette is already open).
      return [model, []];
    case 'toggle-minimize':
      return [applyToggleMinimize(model, pagesById), []];
    case 'toggle-maximize':
      return [applyToggleMaximize(model, pagesById), []];
    case 'dock-up':
    case 'dock-down':
    case 'dock-left':
    case 'dock-right': {
      const dir = action.type.replace('dock-', '') as DockDirection;
      return [applyDockMove(model, dir, pagesById), []];
    }
    case 'scroll-up':
    case 'scroll-down':
    case 'page-up':
    case 'page-down':
    case 'top':
    case 'bottom':
    case 'scroll-left':
    case 'scroll-right':
      return [scrollFocusedPane(model, action, pagesById), []];
    case 'transition':
    case 'transition-complete':
      return [model, []];
  }
}

/** Cycle the active tab by `delta` positions, optionally starting a transition. */
export function switchTab<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  delta: number,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
  options: CreateFramedAppOptions<PageModel, Msg>,
): [InternalFrameModel<PageModel, Msg>, Cmd<Msg>[]] {
  const idx = model.pageOrder.indexOf(model.activePageId);
  if (idx < 0) return [model, []];
  const nextIdx = (idx + delta + model.pageOrder.length) % model.pageOrder.length;
  const nextId = model.pageOrder[nextIdx]!;

  if (nextId === model.activePageId) return [model, []];

  const activePageModel = model.pageModels[model.activePageId]!;
  const activeTransition = options.transitionOverride
    ? options.transitionOverride(activePageModel)
    : options.transition;

  const hasTransition = activeTransition != null && activeTransition !== 'none';
  const nextGeneration = model.transitionGeneration + 1;

  // Use the user-supplied timeline if provided, otherwise build a default.
  // The timeline MUST contain a 'progress' track (0 → 1).
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
    // Schedule render ticks at ~60fps for the duration of the transition.
    // Each tick advances the timeline using wall-clock elapsed time.
    const cmd: Cmd<Msg> = createTransitionTickCmd(durationMs, nextGeneration);
    return [nextModel, [cmd]];
  }

  return [nextModel, []];
}

/** Move focus to the next or previous pane in the active page's layout. */
export function cyclePane<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  delta: number,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
): InternalFrameModel<PageModel, Msg> {
  const page = pagesById.get(model.activePageId)!;
  const paneIds = collectPaneIds(page.layout(model.pageModels[model.activePageId]!));
  if (paneIds.length === 0) return model;

  const curr = model.focusedPaneByPage[model.activePageId];
  const idx = curr == null ? 0 : paneIds.indexOf(curr);
  const nextIdx = idx < 0
    ? 0
    : (idx + delta + paneIds.length) % paneIds.length;
  const next = paneIds[nextIdx]!;
  return {
    ...model,
    focusedPaneByPage: {
      ...model.focusedPaneByPage,
      [model.activePageId]: next,
    },
  };
}

/** Apply a scroll action to the currently focused pane. */
export function scrollFocusedPane<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  action: Extract<
    FrameAction,
    { type: 'scroll-up' | 'scroll-down' | 'page-up' | 'page-down' | 'top' | 'bottom' | 'scroll-left' | 'scroll-right' }
  >,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
): InternalFrameModel<PageModel, Msg> {
  const pageId = model.activePageId;
  const focusedPaneId = model.focusedPaneByPage[pageId];
  if (focusedPaneId == null) return model;

  const page = pagesById.get(pageId)!;
  const layoutTree = page.layout(model.pageModels[pageId]!);
  const bodyRect = frameBodyRect(model.columns, model.rows);
  const resolved = renderFrameNode(layoutTree, bodyRect, {
    model,
    pageId,
    focusedPaneId,
    scrollByPane: model.scrollByPage[pageId] ?? {},
    visibility: model.minimizedByPage[pageId] ?? createPanelVisibilityState(),
    dockState: model.dockStateByPage[pageId] ?? createPanelDockState(),
  });
  const paneRect = resolved.paneRects.get(focusedPaneId);
  if (paneRect == null || paneRect.width <= 0 || paneRect.height <= 0) return model;

  const paneNode = findPaneNode(layoutTree, focusedPaneId);
  if (paneNode == null) return model;

  const content = framePaneOutputToString(
    paneNode.render(paneRect.width, paneRect.height),
    paneRect.width,
    paneRect.height,
  );
  let state = createFocusAreaState({
    content,
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

/** Toggle minimize on the focused pane of the active page. */
export function applyToggleMinimize<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
): InternalFrameModel<PageModel, Msg> {
  const pageId = model.activePageId;
  const focusedPaneId = model.focusedPaneByPage[pageId];
  if (focusedPaneId == null) return model;

  const page = pagesById.get(pageId)!;
  const allPaneIds = collectPaneIds(page.layout(model.pageModels[pageId]!));
  const current = model.minimizedByPage[pageId] ?? createPanelVisibilityState();
  const next = toggleMinimized(current, focusedPaneId, allPaneIds);

  // If we just minimized the focused pane, move focus to a non-minimized sibling
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

/** Toggle maximize on the focused pane of the active page. */
export function applyToggleMaximize<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  _pagesById: Map<string, FramePage<PageModel, Msg>>,
): InternalFrameModel<PageModel, Msg> {
  const pageId = model.activePageId;
  const focusedPaneId = model.focusedPaneByPage[pageId];
  if (focusedPaneId == null) return model;

  const current = model.maximizedPaneByPage[pageId] ?? createPanelMaximizeState();
  const next = toggleMaximize(current, focusedPaneId);

  // If maximizing a minimized pane, restore it first
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

/** Move the focused pane within its container in the given direction. */
export function applyDockMove<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  direction: DockDirection,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
): InternalFrameModel<PageModel, Msg> {
  const pageId = model.activePageId;
  const focusedPaneId = model.focusedPaneByPage[pageId];
  if (focusedPaneId == null) return model;

  const page = pagesById.get(pageId)!;
  const layoutTree = page.layout(model.pageModels[pageId]!);
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

/** Reconcile pane IDs, scroll offsets, and focus for a page after init, tab switches, or window resizes. */
export function syncPageFrameState<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  pageId: string,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
): InternalFrameModel<PageModel, Msg> {
  const page = pagesById.get(pageId)!;
  const paneIds = collectPaneIds(page.layout(model.pageModels[pageId]!));
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

/**
 * Create a TEA command that drives transition re-renders from the shared pulse.
 */
export function createTransitionTickCmd<Msg>(durationMs: number, generation: number): Cmd<Msg> {
  return (emit, caps) =>
    new Promise<void>((resolve) => {
      if (durationMs <= 0) {
        emit(wrapFrameMsg({ type: 'transition-complete', generation } as FrameAction) as unknown as Msg);
        resolve();
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
        } as FrameAction) as unknown as Msg);

        if (rawProgress >= 1) {
          pulse.dispose();
          emit(wrapFrameMsg({ type: 'transition-complete', generation } as FrameAction) as unknown as Msg);
          resolve();
        }
      });
    });
}
