/**
 * `appFrame()` — high-level TEA app shell.
 *
 * Provides tabs, pane focus/scroll isolation, shell key handling, help,
 * panel-scoped overlay context, and optional frame-level command palette.
 */

import {
  createSurface,
  parseAnsiToSurface,
  resolveSafeCtx,
  type OverflowBehavior,
  type Surface,
} from '@flyingrobots/bijou';
import { helpView, type BindingSource } from './help.js';
import type { KeyMap } from './keybindings.js';
import type { App, Cmd } from './types.js';
import { isKeyMsg, isMouseMsg, isResizeMsg } from './types.js';
import type { Overlay } from './overlay.js';
import { modal } from './overlay.js';
import type { TransitionShaderFn } from './transition-shaders.js';
import { fitBlock } from './layout-utils.js';
import { type BuiltinTransition } from './transition-shaders.js';
import type { CommandPaletteItem, CommandPaletteState } from './command-palette.js';
import {
  commandPalette,
  commandPaletteKeyMap,
} from './command-palette.js';
import type { GridTrack } from './grid.js';
import type { SplitPaneDirection, SplitPaneState } from './split-pane.js';
import type { LayoutRect } from './layout-rect.js';
import type { PanelVisibilityState } from './panel-state.js';
import type { PanelMaximizeState } from './panel-state.js';
import type { PanelDockState } from './panel-dock.js';
import type { SerializedLayoutState } from './layout-preset.js';
import { restoreLayoutState } from './layout-preset.js';
import type { OverflowX } from './focus-area.js';
import type { Timeline, TimelineState } from './timeline.js';
import type { ViewOutput } from './view-output.js';
import {
  createNotificationState,
  notificationsNeedTick,
  pushNotification,
  renderNotificationStack,
  tickNotifications,
  trimNotificationsToViewport,
  type NotificationPlacement,
  type NotificationState,
} from './notification.js';

// Internal modules
import type {
  InternalFrameModel,
  PaletteAction,
} from './app-frame-types.js';
import {
  isFrameScopedMsg,
  isPageScopedMsg,
  wrapCmdForPage,
  emitMsg,
  emitMsgForPage,
  wrapFrameMsg,
} from './app-frame-types.js';
import {
  createFrameKeyMap,
  frameBodyRect,
  mergeBindingSources,
} from './app-frame-utils.js';
import {
  renderHeaderLine,
  renderHelpLine,
  renderPageContent,
  renderMaximizedPane,
  renderTransition,
} from './app-frame-render.js';
import {
  applyFrameAction,
  syncPageFrameState,
} from './app-frame-actions.js';
import {
  handlePaletteKey,
  openCommandPalette,
} from './app-frame-palette.js';
import { visibleLength } from './viewport.js';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** Page declaration consumed by {@link createFramedApp}. */
export interface FramePage<PageModel, Msg> {
  /** Stable page id. */
  readonly id: string;
  /** Tab title. */
  readonly title: string;
  /** Page-level initializer. */
  init(): [PageModel, Cmd<Msg>[]];
  /** Page-level updater (custom messages only). */
  update(msg: Msg, model: PageModel): [PageModel, Cmd<Msg>[]];
  /** Page layout tree. */
  layout(model: PageModel): FrameLayoutNode;
  /** Optional page keymap. */
  keyMap?: KeyMap<Msg>;
  /** Optional help source override. */
  helpSource?: BindingSource;
  /** Optional page-scoped command items for command palette listing/execution. */
  commandItems?: (model: PageModel) => readonly FrameCommandItem<Msg>[];
}

/** Custom command-palette item with optional message dispatch action. */
export interface FrameCommandItem<Msg> extends CommandPaletteItem {
  /** Message dispatched when this item is selected. */
  readonly action?: Msg;
}

/** Declarative frame layout node. */
export type FrameLayoutNode =
  | {
    readonly kind: 'pane';
    readonly paneId: string;
    /** Pane content may be a legacy string, a Surface, or a LayoutNode. */
    readonly render: (width: number, height: number) => ViewOutput;
    readonly overflowX?: OverflowX;
  }
  | {
    readonly kind: 'split';
    readonly splitId: string;
    readonly direction?: SplitPaneDirection;
    readonly state: SplitPaneState;
    readonly minA?: number;
    readonly minB?: number;
    readonly paneA: FrameLayoutNode;
    readonly paneB: FrameLayoutNode;
    readonly dividerChar?: string;
  }
  | {
    readonly kind: 'grid';
    readonly gridId: string;
    readonly columns: readonly GridTrack[];
    readonly rows: readonly GridTrack[];
    readonly areas: readonly string[];
    readonly gap?: number;
    readonly cells: Readonly<Record<string, FrameLayoutNode>>;
  };

/** Context passed to overlay factory. */
export interface FrameOverlayContext<PageModel> {
  /** Active page id. */
  readonly activePageId: string;
  /** Active page model. */
  readonly pageModel: PageModel;
  /** Absolute pane rectangles for the active page. */
  readonly paneRects: ReadonlyMap<string, LayoutRect>;
  /** Full-screen bounds. */
  readonly screenRect: LayoutRect;
}

/** Configuration for frame-managed runtime notifications. */
export interface FrameRuntimeNotificationOptions {
  /** Enable routing framework warnings/errors through notifications. Default: true. */
  readonly enabled?: boolean;
  /** Stack placement. Default: 'LOWER_RIGHT'. */
  readonly placement?: NotificationPlacement;
  /** Auto-dismiss delay. Default: 6000ms. */
  readonly durationMs?: number | null;
  /** Render margin from the viewport edge. Default: 1. */
  readonly margin?: number;
  /** Gap between stacked notifications. Default: 1. */
  readonly gap?: number;
  /** Text overflow behavior. Default: 'wrap'. */
  readonly overflow?: OverflowBehavior;
}

/** Page transition styles — a built-in name or a custom shader function. */
export type PageTransition = BuiltinTransition | TransitionShaderFn;

/** `createFramedApp()` options. */
export interface CreateFramedAppOptions<PageModel, Msg> {
  /** Registered pages. */
  readonly pages: readonly FramePage<PageModel, Msg>[];
  /** Optional default page id (falls back to first page). */
  readonly defaultPageId?: string;
  /** Optional frame title. */
  readonly title?: string;
  /** Initial terminal width before runtime resize events. Default: 80. */
  readonly initialColumns?: number;
  /** Initial terminal height before runtime resize events. Default: 24. */
  readonly initialRows?: number;
  /** Optional global keymap layered above page keymap. */
  readonly globalKeys?: KeyMap<Msg>;
  /** Resolve key conflicts in favor of the frame shell or the active page. Default: 'frame-first'. */
  readonly keyPriority?: 'frame-first' | 'page-first';
  /** Enable frame-level command palette (`ctrl+p` / `:`). */
  readonly enableCommandPalette?: boolean;
  /** Optional overlay provider (receives pane rects for panel scoping). */
  readonly overlayFactory?: (ctx: FrameOverlayContext<PageModel>) => readonly Overlay[];
  /** Optional runtime warning/error notifications managed by the frame shell. */
  readonly runtimeNotifications?: boolean | FrameRuntimeNotificationOptions;
  /** Optional page transition style. Default: 'none'. */
  readonly transition?: PageTransition;
  /** Transition duration in milliseconds. Default: 300. */
  readonly transitionDuration?: number;
  /** Optional function to determine the transition style dynamically. */
  readonly transitionOverride?: (model: PageModel) => PageTransition;
  /**
   * Optional compiled timeline that drives the transition animation.
   *
   * Must contain a `'progress'` track that tweens from 0 to 1.
   * When provided, replaces the default ease/duration with whatever
   * the timeline defines — springs, multi-track orchestration, etc.
   *
   * ```ts
   * import { timeline, EASINGS } from '@flyingrobots/bijou-tui';
   *
   * createFramedApp({
   *   transition: 'melt',
   *   transitionTimeline: timeline()
   *     .add('progress', {
   *       type: 'tween',
   *       from: 0, to: 1,
   *       duration: 600,
   *       ease: EASINGS.easeInOutCubic,
   *     })
   *     .build(),
   * });
   * ```
   */
  readonly transitionTimeline?: Timeline;
  /** Optional initial layout state to restore on startup. */
  readonly initialLayout?: SerializedLayoutState;
}

/** Stored pane scroll coordinates. */
export interface FramePaneScroll {
  /** Horizontal offset. */
  readonly x: number;
  /** Vertical offset. */
  readonly y: number;
}

/** Runtime model owned by the frame. */
export interface FrameModel<PageModel> {
  /** Current active page id. */
  readonly activePageId: string;
  /** Stable page order. */
  readonly pageOrder: readonly string[];
  /** Current model per page id. */
  readonly pageModels: Readonly<Record<string, PageModel>>;
  /** Focused pane id per page (if any). */
  readonly focusedPaneByPage: Readonly<Record<string, string | undefined>>;
  /** Per-page/per-pane scroll positions. */
  readonly scrollByPage: Readonly<Record<string, Readonly<Record<string, FramePaneScroll>>>>;
  /** Current terminal width. */
  readonly columns: number;
  /** Current terminal height. */
  readonly rows: number;
  /** Help visibility flag. */
  readonly helpOpen: boolean;
  /** Command palette state (undefined when closed). */
  readonly commandPalette?: CommandPaletteState;
  /** ID of the page we are transitioning away from. */
  readonly previousPageId?: string;
  /** Transition progress (0 to 1). */
  readonly transitionProgress: number;
  /** Monotonic counter to discard stale transition ticks. */
  readonly transitionGeneration: number;
  /** Currently active transition style. */
  readonly activeTransition?: PageTransition;
  /** Wall-clock start time of the active transition (ms since epoch). */
  readonly transitionStartMs?: number;
  /** Compiled timeline driving the active transition. */
  readonly transitionTimeline?: Timeline;
  /** Timeline state for the active transition. */
  readonly transitionTimelineState?: TimelineState;
  /** Monotonic frame counter for the active transition (for temporal shader effects). */
  readonly transitionFrame: number;
  /** Per-page panel visibility (minimize/fold) state. */
  readonly minimizedByPage: Readonly<Record<string, PanelVisibilityState>>;
  /** Per-page maximized pane state. */
  readonly maximizedPaneByPage: Readonly<Record<string, PanelMaximizeState>>;
  /** Per-page dock order state. */
  readonly dockStateByPage: Readonly<Record<string, PanelDockState>>;
  /** Per-page split ratio overrides (from layout presets/session restore). */
  readonly splitRatioOverrides: Readonly<Record<string, Readonly<Record<string, number>>>>;
  /** Frame-managed runtime notifications. */
  readonly runtimeNotifications: NotificationState<never>;
  /** Whether the runtime notification tick loop is active. */
  readonly runtimeNotificationLoopActive: boolean;
}

// ---------------------------------------------------------------------------
// Frame Notification Helpers
// ---------------------------------------------------------------------------

const FRAME_NOTIFICATION_TICK_MS = 40;
const DEFAULT_FRAME_NOTIFICATION_DURATION_MS = 6_000;

interface ResolvedFrameNotificationOptions {
  readonly enabled: boolean;
  readonly placement: NotificationPlacement;
  readonly durationMs: number | null;
  readonly margin: number;
  readonly gap: number;
  readonly overflow: OverflowBehavior;
}

function resolveFrameNotificationOptions<PageModel, Msg>(
  options: CreateFramedAppOptions<PageModel, Msg>,
): ResolvedFrameNotificationOptions {
  if (options.runtimeNotifications === false) {
    return {
      enabled: false,
      placement: 'LOWER_RIGHT',
      durationMs: DEFAULT_FRAME_NOTIFICATION_DURATION_MS,
      margin: 1,
      gap: 1,
      overflow: 'wrap',
    };
  }

  const configured = options.runtimeNotifications === true || options.runtimeNotifications == null
    ? {}
    : options.runtimeNotifications;

  return {
    enabled: configured.enabled ?? true,
    placement: configured.placement ?? 'LOWER_RIGHT',
    durationMs: configured.durationMs ?? DEFAULT_FRAME_NOTIFICATION_DURATION_MS,
    margin: configured.margin ?? 1,
    gap: configured.gap ?? 1,
    overflow: configured.overflow ?? 'wrap',
  };
}

function createFrameNotificationTickCmd<Msg>(): Cmd<Msg> {
  return async (_emit, caps) => {
    if (!caps.sleep) {
      throw new Error('createFrameNotificationTickCmd requires sleep capability');
    }
    await caps.sleep(FRAME_NOTIFICATION_TICK_MS);
    return wrapFrameMsg({
      type: 'notification-tick',
      atMs: caps.now?.() ?? 0,
    }) as unknown as Msg;
  };
}

// Factory
// ---------------------------------------------------------------------------

/**
 * Create a fully framed TEA app shell.
 */
export function createFramedApp<PageModel, Msg>(
  options: CreateFramedAppOptions<PageModel, Msg>,
): App<FrameModel<PageModel>, Msg> {
  if (options.pages.length === 0) {
    throw new Error('createFramedApp: "pages" must contain at least one page');
  }

  const pagesById = new Map<string, FramePage<PageModel, Msg>>();
  for (const page of options.pages) {
    if (pagesById.has(page.id)) {
      throw new Error(`createFramedApp: duplicate page id "${page.id}"`);
    }
    pagesById.set(page.id, page);
  }

  const pageOrder = options.pages.map((p) => p.id);
  const defaultPageId = options.defaultPageId ?? pageOrder[0]!;
  if (!pagesById.has(defaultPageId)) {
    throw new Error(`createFramedApp: defaultPageId "${defaultPageId}" not found in pages`);
  }

  const frameKeys = createFrameKeyMap();
  const frameNotificationOptions = resolveFrameNotificationOptions(options);
  const paletteKeys = commandPaletteKeyMap<PaletteAction>({
    focusNext: { type: 'cp-next' },
    focusPrev: { type: 'cp-prev' },
    pageDown: { type: 'cp-page-down' },
    pageUp: { type: 'cp-page-up' },
    select: { type: 'cp-select' },
    close: { type: 'cp-close' },
  });

  function applyFrameNotificationState(
    model: InternalFrameModel<PageModel, Msg>,
    notifications: NotificationState<never>,
    nowMs: number,
    forceTick = false,
  ): [InternalFrameModel<PageModel, Msg>, Cmd<Msg>[]] {
    const trimmed = trimNotificationsToViewport(notifications, {
      screenWidth: model.columns,
      screenHeight: model.rows,
      margin: frameNotificationOptions.margin,
      gap: frameNotificationOptions.gap,
    }, nowMs);
    const needsTick = notificationsNeedTick(trimmed);
    const nextModel: InternalFrameModel<PageModel, Msg> = {
      ...model,
      runtimeNotifications: trimmed,
      runtimeNotificationLoopActive: needsTick,
    };

    if (needsTick && (forceTick || !model.runtimeNotificationLoopActive)) {
      return [nextModel, [createFrameNotificationTickCmd<Msg>()]];
    }
    return [nextModel, []];
  }

  const app: App<InternalFrameModel<PageModel, Msg>, Msg> = {
    init() {
      const pageModels: Record<string, PageModel> = {};
      const initCmds: Cmd<Msg>[] = [];

      for (const page of options.pages) {
        const [pageModel, cmds] = page.init();
        pageModels[page.id] = pageModel;
        initCmds.push(...cmds.map((cmd) => wrapCmdForPage(page.id, cmd)));
      }

      let model: InternalFrameModel<PageModel, Msg> = {
        activePageId: defaultPageId,
        pageOrder,
        pageModels,
        focusedPaneByPage: {},
        scrollByPage: {},
        columns: Math.max(1, options.initialColumns ?? 80),
        rows: Math.max(1, options.initialRows ?? 24),
        helpOpen: false,
        transitionProgress: 1,
        transitionGeneration: 0,
        transitionFrame: 0,
        minimizedByPage: {},
        maximizedPaneByPage: {},
        dockStateByPage: {},
        splitRatioOverrides: {},
        runtimeNotifications: createNotificationState(),
        runtimeNotificationLoopActive: false,
      };

      for (const pageId of pageOrder) {
        model = syncPageFrameState(model, pageId, pagesById);
      }

      // Apply initial layout if provided
      if (options.initialLayout) {
        const restored = restoreLayoutState(options.initialLayout);
        model = {
          ...model,
          activePageId: pagesById.has(restored.activePageId) ? restored.activePageId : model.activePageId,
          focusedPaneByPage: { ...model.focusedPaneByPage, ...restored.focusedPaneByPage },
          minimizedByPage: restored.minimizedByPage,
          maximizedPaneByPage: restored.maximizedPaneByPage,
          dockStateByPage: restored.dockStateByPage,
          splitRatioOverrides: restored.splitRatiosByPage,
        };
      }

      return [model, initCmds];
    },

    update(msg, model) {
      if (isFrameScopedMsg(msg)) {
        const action = msg.action;
        if (action.type === 'runtime-issue') {
          if (!frameNotificationOptions.enabled) return [model, []];
          const notifications = pushNotification(model.runtimeNotifications, {
            title: action.issue.level === 'warning' ? 'Framework warning' : 'Runtime error',
            message: action.issue.message,
            variant: 'TOAST',
            tone: action.issue.level === 'warning' ? 'WARNING' : 'ERROR',
            placement: frameNotificationOptions.placement,
            durationMs: frameNotificationOptions.durationMs,
            overflow: frameNotificationOptions.overflow,
          }, action.issue.atMs);
          return applyFrameNotificationState(model, notifications, action.issue.atMs);
        }
        if (action.type === 'notification-tick') {
          const notifications = tickNotifications(model.runtimeNotifications, action.atMs);
          return applyFrameNotificationState(model, notifications, action.atMs, true);
        }
        if (action.type === 'transition') {
          // Ignore stale transition ticks from a previous generation
          if (action.generation !== model.transitionGeneration) return [model, []];
          // Advance timeline from deterministic pulse deltas.
          if (model.transitionTimeline && model.transitionTimelineState) {
            const state = model.transitionTimeline.step(
              model.transitionTimelineState,
              Math.max(0, action.dt),
            );
            const vals = model.transitionTimeline.values(state);
            const progress = Math.min(1, Math.max(0, vals['progress'] ?? action.progress));

            if (model.transitionTimeline.done(state) || progress >= 1) {
              return [{
                ...model,
                transitionProgress: 1,
                transitionFrame: 0,
                previousPageId: undefined,
                activeTransition: undefined,
                transitionStartMs: undefined,
                transitionTimeline: undefined,
                transitionTimelineState: undefined,
              }, []];
            }

            return [{
              ...model,
              transitionProgress: progress,
              transitionFrame: model.transitionFrame + 1,
              transitionTimelineState: state,
            }, []];
          }
          // Fallback for non-timeline transitions (backward compat)
          return [{
            ...model,
            transitionProgress: action.progress,
            transitionFrame: model.transitionFrame + 1,
          }, []];
        }
        if (action.type === 'transition-complete') {
          if (action.generation !== model.transitionGeneration) return [model, []];
          return [{
            ...model,
            transitionProgress: 1,
            transitionFrame: 0,
            previousPageId: undefined,
            activeTransition: undefined,
            transitionStartMs: undefined,
            transitionTimeline: undefined,
            transitionTimelineState: undefined,
          }, []];
        }
        return applyFrameAction(action, model, options, pagesById);
      }

      if (isResizeMsg(msg)) {
        return [{
          ...model,
          columns: msg.columns,
          rows: msg.rows,
        }, []];
      }

      if (isKeyMsg(msg)) {
        if (model.commandPalette != null) {
          return handlePaletteKey(msg, model, paletteKeys, options, pagesById);
        }

        // Help acts as a modal layer when open: only close keys are handled.
        if (model.helpOpen) {
          if (!msg.ctrl && !msg.alt && (msg.key === 'escape' || msg.key === '?')) {
            return [{ ...model, helpOpen: false }, []];
          }
          return [model, []];
        }

        const activePage = pagesById.get(model.activePageId)!;
        const pageAction = activePage.keyMap?.handle(msg);
        const globalAction = options.globalKeys?.handle(msg);
        const frameAction = frameKeys.handle(msg);
        const keyPriority = options.keyPriority ?? 'frame-first';

        if (keyPriority === 'page-first') {
          if (pageAction !== undefined) {
            return [model, [emitMsgForPage(model.activePageId, pageAction)]];
          }
          if (globalAction !== undefined) {
            return [model, [emitMsg(globalAction)]];
          }
          if (frameAction !== undefined) {
            if (frameAction.type === 'open-palette' && options.enableCommandPalette) {
              return [openCommandPalette(model, frameKeys, options, pagesById), []];
            }
            return applyFrameAction(frameAction, model, options, pagesById);
          }
          return [model, []];
        }

        if (frameAction !== undefined) {
          // Handle palette opening here since applyFrameAction doesn't have access to palette deps
          if (frameAction.type === 'open-palette' && options.enableCommandPalette) {
            return [openCommandPalette(model, frameKeys, options, pagesById), []];
          }
          return applyFrameAction(frameAction, model, options, pagesById);
        }

        if (globalAction !== undefined) {
          return [model, [emitMsg(globalAction)]];
        }

        if (pageAction !== undefined) {
          return [model, [emitMsgForPage(model.activePageId, pageAction)]];
        }

        return [model, []];
      }

      if (isMouseMsg(msg)) {
        return [model, []];
      }

      // Custom message path: route to originating page when command messages are scoped.
      const scoped = isPageScopedMsg<Msg>(msg) ? msg : undefined;
      const targetPageId = scoped?.pageId ?? model.activePageId;
      const targetPage = pagesById.get(targetPageId);
      if (targetPage == null) return [model, []];

      const targetMsg = scoped?.msg ?? (msg as Msg);
      const pageModel = model.pageModels[targetPageId]!;
      
      const updateResult = targetPage.update(targetMsg, pageModel);
      let nextPageModel: PageModel = pageModel; // Default to current
      let cmds: Cmd<Msg>[] = [];

      if (updateResult !== undefined && updateResult !== null) {
        if (Array.isArray(updateResult)) {
          nextPageModel = (updateResult[0] ?? pageModel) as PageModel;
          cmds = (updateResult[1] ?? []) as Cmd<Msg>[];
        } else {
          nextPageModel = updateResult as PageModel;
        }
      }
      
      const nextModels = { ...model.pageModels, [targetPageId]: nextPageModel };
      const synced = syncPageFrameState({ ...model, pageModels: nextModels }, targetPageId, pagesById);
      const wrappedCmds = Array.isArray(cmds) ? cmds.map((cmd) => wrapCmdForPage(targetPageId, cmd)) : [];
      return [synced, wrappedCmds];
    },

    view(model) {
      const activePage = pagesById.get(model.activePageId)!;
      const header = renderHeaderLine(model, options, pagesById);
      const helpLine = renderHelpLine(model, frameKeys, options, activePage);
      const bodyRect = frameBodyRect(model.columns, model.rows);

      // Check for maximized pane — if set, render only that pane at full body rect
      const maxState = model.maximizedPaneByPage[model.activePageId];
      const maximizedPaneId = maxState?.maximizedPaneId;

      const activeResult = maximizedPaneId
        ? renderMaximizedPane(model.activePageId, model, bodyRect, pagesById, maximizedPaneId)
        : renderPageContent(model.activePageId, model, bodyRect, pagesById);
      let bodyOutput = activeResult.output;

      const activeTransition = model.activeTransition ?? options.transition;
      if (model.previousPageId != null && model.transitionProgress < 1 && activeTransition && activeTransition !== 'none') {
        const ctx = resolveSafeCtx();
        if (ctx) {
          const prevResult = renderPageContent(model.previousPageId, model, bodyRect, pagesById);
          bodyOutput = renderTransition(
            prevResult.output,
            activeResult.output,
            activeTransition,
            model.transitionProgress,
            bodyRect.width,
            bodyRect.height,
            ctx,
            model.transitionFrame,
          );
        }
      }

      bodyOutput = fitBlock(bodyOutput, bodyRect.width, bodyRect.height).join('\n');

      const overlays: Overlay[] = [];
      if (options.overlayFactory != null) {
        overlays.push(...options.overlayFactory({
          activePageId: model.activePageId,
          pageModel: model.pageModels[model.activePageId]!,
          paneRects: activeResult.paneRects,
          screenRect: { row: 0, col: 0, width: model.columns, height: model.rows },
        }));
      }

      if (frameNotificationOptions.enabled) {
        const ctx = resolveSafeCtx();
        overlays.push(...renderNotificationStack(model.runtimeNotifications, {
          screenWidth: model.columns,
          screenHeight: model.rows,
          margin: frameNotificationOptions.margin,
          gap: frameNotificationOptions.gap,
          ctx: ctx ?? undefined,
        }));
      }

      if (model.helpOpen) {
        const full = helpView(mergeBindingSources(frameKeys, options.globalKeys, activePage.helpSource ?? activePage.keyMap));
        overlays.push(modal({
          title: 'Keyboard Help',
          body: full.length > 0 ? full : 'No bindings',
          hint: 'Press ? to close',
          screenWidth: model.columns,
          screenHeight: model.rows,
        }));
      }

      if (model.commandPalette != null) {
        const paletteWidth = Math.max(20, Math.min(80, model.columns - 4));
        const paletteBody = commandPalette(model.commandPalette, { width: Math.max(16, paletteWidth - 4) });
        overlays.push(modal({
          title: 'Command Palette',
          body: paletteBody,
          hint: 'Enter select • Esc close',
          width: paletteWidth,
          screenWidth: model.columns,
          screenHeight: model.rows,
        }));
      }

      return composeFrameSurface({
        width: model.columns,
        height: model.rows,
        header,
        helpLine,
        bodyOutput,
        bodyRect,
        overlays,
        dimBackground: overlays.length > 0,
      });
    },

    routeRuntimeIssue(issue) {
      if (!frameNotificationOptions.enabled) return undefined;
      return wrapFrameMsg({ type: 'runtime-issue', issue }) as unknown as Msg;
    },
  };

  return app;
}

interface FrameSurfaceOptions {
  width: number;
  height: number;
  header: string;
  helpLine: string;
  bodyOutput: string;
  bodyRect: LayoutRect;
  overlays: readonly Overlay[];
  dimBackground: boolean;
}

function composeFrameSurface(options: FrameSurfaceOptions): Surface {
  const frame = createSurface(options.width, options.height);

  frame.blit(parseAnsiToSurface(options.header, options.width, 1), 0, 0);
  if (options.height > 1) {
    frame.blit(parseAnsiToSurface(options.helpLine, options.width, 1), 0, 1);
  }
  if (options.bodyRect.width > 0 && options.bodyRect.height > 0) {
    frame.blit(
      parseAnsiToSurface(options.bodyOutput, options.bodyRect.width, options.bodyRect.height),
      options.bodyRect.col,
      options.bodyRect.row,
    );
  }

  if (options.dimBackground) {
    dimSurface(frame);
  }

  for (const overlay of options.overlays) {
    const overlaySurface = overlay.surface ?? parseAnsiToSurface(
      overlay.content,
      maxVisibleWidth(overlay.content),
      overlay.content.split('\n').length,
    );
    frame.blit(overlaySurface, overlay.col, overlay.row);
  }

  return frame;
}

function dimSurface(surface: Surface): void {
  for (let y = 0; y < surface.height; y++) {
    for (let x = 0; x < surface.width; x++) {
      const cell = surface.get(x, y);
      if (cell.empty || cell.char === ' ') continue;
      const modifiers = new Set(cell.modifiers ?? []);
      modifiers.add('dim');
      surface.set(x, y, { ...cell, modifiers: Array.from(modifiers) });
    }
  }
}

function maxVisibleWidth(text: string): number {
  return text.split('\n').reduce((max, line) => Math.max(max, visibleLength(line)), 0);
}
