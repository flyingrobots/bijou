/**
 * `appFrame()` — high-level TEA app shell.
 *
 * Provides tabs, pane focus/scroll isolation, shell key handling, help,
 * panel-scoped overlay context, and optional frame-level command palette.
 */

import {
  createSurface,
  resolveClock,
  resolveSafeCtx,
  stringToSurface,
  type Cell,
  type OverflowBehavior,
  type Surface,
} from '@flyingrobots/bijou';
import { helpViewSurface, type BindingSource } from './help.js';
import { createKeyMap, type KeyMap } from './keybindings.js';
import type { App, Cmd, KeyMsg, MouseMsg } from './types.js';
import { isKeyMsg, isMouseMsg, isResizeMsg } from './types.js';
import { quit } from './commands.js';
import type { Overlay } from './overlay.js';
import { compositeSurfaceInto, drawer, modal } from './overlay.js';
import type { TransitionShaderFn } from './transition-shaders.js';
import { type BuiltinTransition } from './transition-shaders.js';
import type { CommandPaletteItem, CommandPaletteState } from './command-palette.js';
import {
  commandPalette,
  commandPaletteKeyMap,
} from './command-palette.js';
import {
  createPagerStateForSurface,
  pagerPageDown,
  pagerPageUp,
  pagerScrollBy,
  pagerScrollToBottom,
  pagerScrollToTop,
  pagerSurface,
} from './pager.js';
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
  dismissNotification,
  hitTestNotificationStack,
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
  FrameAction,
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
  resolveHeaderLine,
  renderHelpLine,
  renderPageContent,
  renderPageContentInto,
  renderMaximizedPane,
  renderMaximizedPaneInto,
  renderTransition,
} from './app-frame-render.js';
import {
  applyFrameAction,
  scrollFocusedPane,
  switchTab,
  syncPageFrameState,
} from './app-frame-actions.js';
import {
  handlePaletteKey,
  openCommandPalette,
} from './app-frame-palette.js';

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
  /** Optional pane-scoped input layers owned by the focused pane. */
  inputAreas?: (model: PageModel) => readonly FrameInputArea<PageModel, Msg>[];
  /** Optional modal keymap. When present, it captures all keys until dismissed. */
  modalKeyMap?: (model: PageModel) => KeyMap<Msg> | undefined;
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

/** Declarative input ownership for a specific pane inside a frame page. */
export interface FrameInputArea<PageModel, Msg> {
  /** Target pane id. */
  readonly paneId: string;
  /** Optional pane-scoped key bindings. */
  readonly keyMap?: KeyMap<Msg>;
  /** Optional focused-pane help bindings. */
  readonly helpSource?: BindingSource;
  /** Optional pane-scoped mouse mapper. */
  readonly mouse?: (args: {
    readonly msg: MouseMsg;
    readonly model: PageModel;
    readonly rect: LayoutRect;
  }) => Msg | undefined;
}

/** A single declarative settings row rendered by the frame shell. */
export interface FrameSettingRow<Msg> {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly valueLabel?: string;
  readonly action?: Msg;
  readonly kind?: 'action' | 'toggle' | 'choice' | 'info';
  readonly enabled?: boolean;
}

/** A titled section inside the frame-owned settings drawer. */
export interface FrameSettingSection<Msg> {
  readonly id: string;
  readonly title: string;
  readonly rows: readonly FrameSettingRow<Msg>[];
}

/** Structured settings content supplied by the app and rendered by the frame shell. */
export interface FrameSettings<Msg> {
  readonly title?: string;
  readonly sections: readonly FrameSettingSection<Msg>[];
}

/** Declarative frame layout node. */
export type FrameLayoutNode =
  | {
    readonly kind: 'pane';
    readonly paneId: string;
    /** Pane content must be a Surface or LayoutNode. */
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
  /** Optional override for the short help strip source shown beneath the frame header. */
  readonly helpLineSource?: (args: {
    readonly model: FrameModel<PageModel>;
    readonly activePage: FramePage<PageModel, Msg>;
    readonly frameKeys: KeyMap<FrameAction>;
    readonly globalKeys?: KeyMap<Msg>;
  }) => BindingSource | undefined;
  /** Optional observer that receives every key plus the route that handled it. Returned messages are scoped to the active page. */
  readonly observeKey?: (
    msg: KeyMsg,
    route: 'palette' | 'help' | 'frame' | 'global' | 'page' | 'unhandled',
  ) => Msg | undefined;
  /** Enable frame-level command palette (`ctrl+p` / `:`). */
  readonly enableCommandPalette?: boolean;
  /** Optional shell-owned settings drawer content. */
  readonly settings?: (args: {
    readonly model: FrameModel<PageModel>;
    readonly activePage: FramePage<PageModel, Msg>;
    readonly pageModel: PageModel;
  }) => FrameSettings<Msg> | undefined;
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
  /** Settings drawer visibility flag. */
  readonly settingsOpen: boolean;
  /** Quit-confirm modal visibility flag. */
  readonly quitConfirmOpen: boolean;
  /** Active settings row index. */
  readonly settingsFocusIndex: number;
  /** Vertical scroll offset for the settings drawer. */
  readonly settingsScrollY: number;
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

const HELP_SCROLL_HINT = 'j/k scroll • d/u page • g/G top/bottom • mouse wheel • ? close';
const quitHelpKeys = createKeyMap<FrameAction>()
  .group('Exit', (g) => g
    .bind('q', 'Quit', { type: 'toggle-help' })
    .bind('escape', 'Quit', { type: 'toggle-help' })
    .bind('ctrl+c', 'Quit', { type: 'toggle-help' }));
const settingsHelpKeys = createKeyMap<FrameAction>()
  .group('Settings', (g) => g
    .bind('escape', 'Close settings', { type: 'toggle-settings' })
    .bind('f2', 'Close settings', { type: 'toggle-settings' })
    .bind('up', 'Previous row', { type: 'scroll-up' })
    .bind('down', 'Next row', { type: 'scroll-down' })
    .bind('enter', 'Activate setting', { type: 'toggle-settings' })
    .bind('space', 'Activate setting', { type: 'toggle-settings' })
    .bind('j', 'Scroll down', { type: 'scroll-down' })
    .bind('k', 'Scroll up', { type: 'scroll-up' })
    .bind('d', 'Page down', { type: 'page-down' })
    .bind('u', 'Page up', { type: 'page-up' })
    .bind('g', 'Top', { type: 'top' })
    .bind('shift+g', 'Bottom', { type: 'bottom' })
    .bind('/', 'Open command palette', { type: 'open-palette' })
    .bind('ctrl+p', 'Open command palette', { type: 'open-palette' })
    .bind(':', 'Open command palette', { type: 'open-palette' })
    .bind('?', 'Toggle help', { type: 'toggle-help' }));

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

  const frameKeys = createFrameKeyMap({ enableSettings: options.settings != null });
  const frameNotificationOptions = resolveFrameNotificationOptions(options);
  let composedFrameScratch: Surface | null = null;
  const paletteKeys = commandPaletteKeyMap<PaletteAction>({
    focusNext: { type: 'cp-next' },
    focusPrev: { type: 'cp-prev' },
    pageDown: { type: 'cp-page-down' },
    pageUp: { type: 'cp-page-up' },
    select: { type: 'cp-select' },
    close: { type: 'cp-close' },
  });

  function getComposedFrameScratch(width: number, height: number): Surface {
    if (
      composedFrameScratch == null
      || composedFrameScratch.width !== width
      || composedFrameScratch.height !== height
    ) {
      composedFrameScratch = createSurface(width, height);
    }
    return composedFrameScratch;
  }

  function withObservedKey(
    model: InternalFrameModel<PageModel, Msg>,
    cmds: readonly Cmd<Msg>[],
    msg: KeyMsg,
    route: 'palette' | 'help' | 'frame' | 'global' | 'page' | 'unhandled',
  ): Cmd<Msg>[] {
    const observed = options.observeKey?.(msg, route);
    if (observed === undefined) return [...cmds];
    return [emitMsgForPage(model.activePageId, observed), ...cmds];
  }

  function shouldUseQuitConfirm(): boolean {
    return resolveSafeCtx()?.mode !== 'pipe';
  }

  function isQuitRequest(msg: KeyMsg): boolean {
    if (msg.alt) return false;
    if (msg.ctrl) return msg.key === 'c';
    return !msg.shift && (msg.key === 'q' || msg.key === 'escape');
  }

  function isQuitConfirmAccept(msg: KeyMsg): boolean {
    return !msg.ctrl && !msg.alt && !msg.shift && (msg.key === 'y' || msg.key === 'enter');
  }

  function isQuitConfirmDismiss(msg: KeyMsg): boolean {
    return !msg.ctrl && !msg.alt && !msg.shift && (msg.key === 'n' || msg.key === 'escape' || msg.key === 'q');
  }

  function applyQuitRequest(
    model: InternalFrameModel<PageModel, Msg>,
    msg: KeyMsg,
  ): [InternalFrameModel<PageModel, Msg>, Cmd<Msg>[]] {
    if (!shouldUseQuitConfirm()) {
      return [model, withObservedKey(model, [quit()], msg, 'frame')];
    }

    if (model.quitConfirmOpen) {
      return [model, withObservedKey(model, [], msg, 'frame')];
    }

    return [{
      ...model,
      quitConfirmOpen: true,
      helpOpen: false,
      helpScrollY: 0,
      settingsOpen: false,
      commandPalette: undefined,
      commandPaletteEntries: undefined,
    }, withObservedKey(model, [], msg, 'frame')];
  }

  function updateTargetPage(
    model: InternalFrameModel<PageModel, Msg>,
    targetPageId: string,
    targetMsg: Msg,
  ): [InternalFrameModel<PageModel, Msg>, Cmd<Msg>[]] {
    const targetPage = pagesById.get(targetPageId);
    if (targetPage == null) return [model, []];

    const pageModel = model.pageModels[targetPageId]!;
    const updateResult = targetPage.update(targetMsg, pageModel);
    let nextPageModel: PageModel = pageModel;
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
    const wrappedCmds = Array.isArray(cmds)
      ? cmds.map((cmd) => wrapCmdForPage(targetPageId, cmd))
      : [];
    return [synced, wrappedCmds];
  }

  function handleFrameMouse(
    msg: MouseMsg,
    model: InternalFrameModel<PageModel, Msg>,
  ): [InternalFrameModel<PageModel, Msg>, Cmd<Msg>[]] | undefined {
    const activePage = pagesById.get(model.activePageId)!;
    const activePageModel = model.pageModels[model.activePageId]!;
    const inputAreas = resolveInputAreas(activePage, activePageModel);

      if (model.helpOpen) {
        if (msg.action === 'scroll-up' || msg.action === 'scroll-down') {
          return [applyHelpScroll(model, activePage, msg.action === 'scroll-down' ? 3 : -3, frameKeys, options), []];
        }
        return [model, []];
      }

      if (model.commandPalette != null) return [model, []];

      if (model.quitConfirmOpen) {
        return [model, []];
      }

      if (model.settingsOpen) {
        const layout = resolveSettingsLayout(model, options, pagesById);
        if (layout != null) {
          if (msg.action === 'scroll-up' || msg.action === 'scroll-down') {
            if (isInsideSettingsDrawer(msg.col, msg.row, layout, model)) {
              return [
                scrollSettingsBy(model, layout, msg.action === 'scroll-down' ? 3 : -3),
                [],
              ];
            }
            return [model, []];
          }

          if (msg.action === 'press' && msg.button === 'left') {
            if (!isInsideSettingsDrawer(msg.col, msg.row, layout, model)) {
              return [model, []];
            }
            const hit = settingsRowAtPosition(msg.col, msg.row, model, layout);
            if (hit == null) return [model, []];
            const focusedModel = { ...model, settingsFocusIndex: hit.index };
            if (hit.row.action === undefined || hit.row.enabled === false || hit.row.kind === 'info') {
              return [focusedModel, []];
            }
            return [focusedModel, [emitMsgForPage(model.activePageId, hit.row.action)]];
          }

          return [model, []];
        }
      }

      if (msg.action === 'press' && msg.button === 'left') {
      if (frameNotificationOptions.enabled) {
        const nowMs = resolveClock(resolveSafeCtx()).now();
        const notificationTarget = hitTestNotificationStack(model.runtimeNotifications, {
          screenWidth: model.columns,
          screenHeight: model.rows,
          margin: frameNotificationOptions.margin,
          gap: frameNotificationOptions.gap,
          ctx: resolveSafeCtx() ?? undefined,
        }, msg.col, msg.row);

        if (notificationTarget?.kind === 'dismiss') {
          return applyFrameNotificationState(
            model,
            dismissNotification(model.runtimeNotifications, notificationTarget.item.id, nowMs),
            nowMs,
          );
        }
        if (notificationTarget != null) {
          return [model, []];
        }
      }

      if (msg.row === 0) {
        const header = resolveHeaderLine(model, options, pagesById);
        const tab = header.tabTargets.find((target) =>
          msg.col >= target.startCol && msg.col <= target.endCol,
        );
        if (tab != null) {
          const currentIndex = model.pageOrder.indexOf(model.activePageId);
          const nextIndex = model.pageOrder.indexOf(tab.pageId);
          if (currentIndex >= 0 && nextIndex >= 0 && nextIndex !== currentIndex) {
            return switchTab(model, nextIndex - currentIndex, pagesById, options);
          }
          return [model, []];
        }
        return [model, []];
      }

      const clickedPane = paneHitAtPosition(model, msg.col, msg.row, pagesById);
      if (clickedPane != null) {
        const focusedModel = focusPane(model, clickedPane.paneId);
        const inputArea = findInputAreaByPaneId(inputAreas, clickedPane.paneId);
        const areaMsg = inputArea?.mouse?.({
          msg,
          model: activePageModel,
          rect: clickedPane.rect,
        });
        if (areaMsg !== undefined) {
          return [focusedModel, [emitMsgForPage(model.activePageId, areaMsg)]];
        }
        return [focusedModel, [emitMsgForPage(model.activePageId, msg as unknown as Msg)]];
      }
    }

    if (msg.action === 'scroll-up' || msg.action === 'scroll-down') {
      const hoveredPane = paneHitAtPosition(model, msg.col, msg.row, pagesById);
      if (hoveredPane != null) {
        const focusedModel = focusPane(model, hoveredPane.paneId);
        const inputArea = findInputAreaByPaneId(inputAreas, hoveredPane.paneId);
        const areaMsg = inputArea?.mouse?.({
          msg,
          model: activePageModel,
          rect: hoveredPane.rect,
        });
        if (areaMsg !== undefined) {
          return [focusedModel, [emitMsgForPage(model.activePageId, areaMsg)]];
        }
        const action: FrameAction = msg.action === 'scroll-down'
          ? { type: 'scroll-down' }
          : { type: 'scroll-up' };
        return [scrollFocusedPane(focusedModel, action, pagesById), []];
      }
    }

    return undefined;
  }

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
        helpScrollY: 0,
        settingsOpen: false,
        quitConfirmOpen: false,
        settingsFocusIndex: 0,
        settingsScrollY: 0,
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
          if (msg.ctrl && !msg.alt && msg.key === 'c') {
            return applyQuitRequest(model, msg);
          }
          const [nextModel, cmds] = handlePaletteKey(msg, model, paletteKeys, options, pagesById);
          return [nextModel, withObservedKey(model, cmds, msg, 'palette')];
        }

        const activePage = pagesById.get(model.activePageId)!;

        // Help acts as a modal layer when open: only close keys are handled.
        if (model.helpOpen) {
          if (!msg.ctrl && !msg.alt && msg.key === '?') {
            return [{ ...model, helpOpen: false, helpScrollY: 0 }, withObservedKey(model, [], msg, 'help')];
          }
          if (isQuitRequest(msg)) {
            return applyQuitRequest(model, msg);
          }
          const helpAction = frameKeys.handle(msg);
          if (helpAction && isHelpScrollAction(helpAction)) {
            return [
              applyHelpScrollAction(model, activePage, helpAction, frameKeys, options),
              withObservedKey(model, [], msg, 'help'),
            ];
          }
          return [model, withObservedKey(model, [], msg, 'help')];
        }

        if (model.settingsOpen) {
          const layout = resolveSettingsLayout(model, options, pagesById);
          if (layout != null) {
            if (isQuitRequest(msg) && msg.key !== 'escape') {
              return applyQuitRequest(model, msg);
            }
            if (!msg.ctrl && !msg.alt && msg.key === 'escape') {
              return [{
                ...model,
                settingsOpen: false,
              }, withObservedKey(model, [], msg, 'frame')];
            }
            if (msg.ctrl && !msg.alt && msg.key === ',') {
              return [{
                ...model,
                settingsOpen: false,
              }, withObservedKey(model, [], msg, 'frame')];
            }
            if (!msg.ctrl && !msg.alt && msg.key === 'f2') {
              return [{
                ...model,
                settingsOpen: false,
              }, withObservedKey(model, [], msg, 'frame')];
            }
            if (!msg.ctrl && !msg.alt && msg.key === '?') {
              return [{ ...model, helpOpen: true }, withObservedKey(model, [], msg, 'frame')];
            }
            if (options.enableCommandPalette && ((msg.ctrl && !msg.alt && msg.key === 'p') || (!msg.ctrl && !msg.alt && (msg.key === ':' || msg.key === '/')))) {
              return [openCommandPalette(model, frameKeys, options, pagesById), withObservedKey(model, [], msg, 'frame')];
            }
            if (!msg.ctrl && !msg.alt && msg.key === 'up') {
              return [moveSettingsFocus(model, layout, -1), withObservedKey(model, [], msg, 'frame')];
            }
            if (!msg.ctrl && !msg.alt && msg.key === 'down') {
              return [moveSettingsFocus(model, layout, 1), withObservedKey(model, [], msg, 'frame')];
            }
            if (!msg.ctrl && !msg.alt && msg.key === 'j') {
              return [scrollSettingsBy(model, layout, 1), withObservedKey(model, [], msg, 'frame')];
            }
            if (!msg.ctrl && !msg.alt && msg.key === 'k') {
              return [scrollSettingsBy(model, layout, -1), withObservedKey(model, [], msg, 'frame')];
            }
            if (!msg.ctrl && !msg.alt && msg.key === 'd') {
              return [scrollSettingsBy(model, layout, Math.max(1, layout.contentHeight - 1)), withObservedKey(model, [], msg, 'frame')];
            }
            if (!msg.ctrl && !msg.alt && msg.key === 'u') {
              return [scrollSettingsBy(model, layout, -Math.max(1, layout.contentHeight - 1)), withObservedKey(model, [], msg, 'frame')];
            }
            if (!msg.ctrl && !msg.alt && msg.key === 'g') {
              return [{ ...model, settingsScrollY: 0 }, withObservedKey(model, [], msg, 'frame')];
            }
            if (!msg.ctrl && !msg.alt && msg.key === 'G') {
              return [{ ...model, settingsScrollY: layout.maxScrollY }, withObservedKey(model, [], msg, 'frame')];
            }
            if (!msg.ctrl && !msg.alt && (msg.key === 'enter' || msg.key === 'space')) {
              const row = layout.rows[clampSettingsFocus(model, layout)]?.row;
              if (row?.action !== undefined && row.enabled !== false && row.kind !== 'info') {
                return [model, withObservedKey(model, [emitMsgForPage(model.activePageId, row.action)], msg, 'frame')];
              }
              return [model, withObservedKey(model, [], msg, 'frame')];
            }
            return [model, withObservedKey(model, [], msg, 'frame')];
          }
        }

        if (model.quitConfirmOpen) {
          if (isQuitConfirmAccept(msg)) {
            return [{
              ...model,
              quitConfirmOpen: false,
            }, withObservedKey(model, [quit()], msg, 'frame')];
          }
          if (isQuitConfirmDismiss(msg)) {
            return [{
              ...model,
              quitConfirmOpen: false,
            }, withObservedKey(model, [], msg, 'frame')];
          }
          return [model, withObservedKey(model, [], msg, 'frame')];
        }

        const activePageModel = model.pageModels[model.activePageId]!;
        const activeInputArea = findInputAreaByPaneId(
          resolveInputAreas(activePage, activePageModel),
          model.focusedPaneByPage[model.activePageId],
        );
        const modalKeyMap = activePage.modalKeyMap?.(activePageModel);
        if (modalKeyMap != null) {
          const modalAction = modalKeyMap.handle(msg);
          if (modalAction !== undefined) {
            return [model, withObservedKey(model, [emitMsgForPage(model.activePageId, modalAction)], msg, 'page')];
          }
          return [model, withObservedKey(model, [], msg, 'page')];
        }

        if (isQuitRequest(msg)) {
          return applyQuitRequest(model, msg);
        }

        const paneAction = activeInputArea?.keyMap?.handle(msg);
        const pageAction = activePage.keyMap?.handle(msg);
        const globalAction = options.globalKeys?.handle(msg);
        const frameAction = frameKeys.handle(msg);
        const keyPriority = options.keyPriority ?? 'frame-first';

        if (keyPriority === 'page-first') {
          if (paneAction !== undefined) {
            return [model, withObservedKey(model, [emitMsgForPage(model.activePageId, paneAction)], msg, 'page')];
          }
          if (pageAction !== undefined) {
            return [model, withObservedKey(model, [emitMsgForPage(model.activePageId, pageAction)], msg, 'page')];
          }
          if (globalAction !== undefined) {
            return [model, withObservedKey(model, [emitMsg(globalAction)], msg, 'global')];
          }
          if (frameAction !== undefined) {
            if (frameAction.type === 'open-palette' && options.enableCommandPalette) {
              return [openCommandPalette(model, frameKeys, options, pagesById), withObservedKey(model, [], msg, 'frame')];
            }
            const [nextModel, cmds] = applyFrameAction(frameAction, model, options, pagesById);
            return [nextModel, withObservedKey(model, cmds, msg, 'frame')];
          }
          return [model, withObservedKey(model, [], msg, 'unhandled')];
        }

        if (frameAction !== undefined) {
          // Handle palette opening here since applyFrameAction doesn't have access to palette deps
          if (frameAction.type === 'open-palette' && options.enableCommandPalette) {
            return [openCommandPalette(model, frameKeys, options, pagesById), withObservedKey(model, [], msg, 'frame')];
          }
          const [nextModel, cmds] = applyFrameAction(frameAction, model, options, pagesById);
          return [nextModel, withObservedKey(model, cmds, msg, 'frame')];
        }

        if (paneAction !== undefined) {
          return [model, withObservedKey(model, [emitMsgForPage(model.activePageId, paneAction)], msg, 'page')];
        }

        if (globalAction !== undefined) {
          return [model, withObservedKey(model, [emitMsg(globalAction)], msg, 'global')];
        }

        if (pageAction !== undefined) {
          return [model, withObservedKey(model, [emitMsgForPage(model.activePageId, pageAction)], msg, 'page')];
        }

        return [model, withObservedKey(model, [], msg, 'unhandled')];
      }

      if (isMouseMsg(msg)) {
        const frameResult = handleFrameMouse(msg, model);
        if (frameResult != null) return frameResult;
        return updateTargetPage(model, model.activePageId, msg as unknown as Msg);
      }

      // Custom message path: route to originating page when command messages are scoped.
      const scoped = isPageScopedMsg<Msg>(msg) ? msg : undefined;
      const targetPageId = scoped?.pageId ?? model.activePageId;
      const targetMsg = scoped?.msg ?? (msg as Msg);
      return updateTargetPage(model, targetPageId, targetMsg);
    },

    view(model) {
      const activePage = pagesById.get(model.activePageId)!;
      const header = resolveHeaderLine(model, options, pagesById).surface;
      const helpLine = renderHelpLine(model, frameKeys, options, activePage);
      const bodyRect = frameBodyRect(model.columns, model.rows);

      // Check for maximized pane — if set, render only that pane at full body rect
      const maxState = model.maximizedPaneByPage[model.activePageId];
      const maximizedPaneId = maxState?.maximizedPaneId;

      const frameSurface = getComposedFrameScratch(model.columns, model.rows);
      frameSurface.clear();
      frameSurface.blit(header, 0, 0);
      if (model.rows > 1) {
        frameSurface.blit(helpLine, 0, model.rows - 1);
      }

      let activeResult: { paneRects: ReadonlyMap<string, LayoutRect>; paneOrder: readonly string[] };
      let bodySurface: Surface | undefined;

      const activeTransition = model.activeTransition ?? options.transition;
      if (model.previousPageId != null && model.transitionProgress < 1 && activeTransition && activeTransition !== 'none') {
        const activeBodyResult = maximizedPaneId
          ? renderMaximizedPane(model.activePageId, model, bodyRect, pagesById, maximizedPaneId)
          : renderPageContent(model.activePageId, model, bodyRect, pagesById);
        activeResult = activeBodyResult;
        bodySurface = activeBodyResult.surface;
        const ctx = resolveSafeCtx();
        if (ctx) {
          const prevResult = renderPageContent(model.previousPageId, model, bodyRect, pagesById);
          bodySurface = renderTransition(
            prevResult.surface,
            activeBodyResult.surface,
            activeTransition,
            model.transitionProgress,
            bodyRect.width,
            bodyRect.height,
            ctx,
            model.transitionFrame,
          );
        }
      } else {
        activeResult = maximizedPaneId
          ? renderMaximizedPaneInto(model.activePageId, model, bodyRect, pagesById, maximizedPaneId, frameSurface)
          : renderPageContentInto(model.activePageId, model, bodyRect, pagesById, frameSurface);
      }

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
        const helpOverlay = renderHelpOverlay(model, activePage, frameKeys, options);
        overlays.push(modal({
          title: 'Keyboard Help',
          body: helpOverlay.body,
          hint: HELP_SCROLL_HINT,
          width: helpOverlay.body.width + 4,
          screenWidth: model.columns,
          screenHeight: model.rows,
        }));
      }

      if (model.settingsOpen) {
        const settingsOverlay = renderSettingsDrawer(model, options, pagesById);
        if (settingsOverlay != null) {
          overlays.push(settingsOverlay);
        }
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

      if (model.quitConfirmOpen) {
        overlays.push(modal({
          title: 'Quit?',
          body: stringToSurface('Quit this app?\n\nY quit • N stay', 20, 3),
          hint: 'Y quit • N stay',
          width: 24,
          screenWidth: model.columns,
          screenHeight: model.rows,
        }));
      }

      if (bodySurface != null && bodyRect.width > 0 && bodyRect.height > 0) {
        frameSurface.blit(bodySurface, bodyRect.col, bodyRect.row);
      }

      return compositeSurfaceInto(frameSurface, frameSurface, overlays, { dim: overlays.length > 0 });
    },

    routeRuntimeIssue(issue) {
      if (!frameNotificationOptions.enabled) return undefined;
      return wrapFrameMsg({ type: 'runtime-issue', issue }) as unknown as Msg;
    },
  };

  return app;
}

function focusPane<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  paneId: string,
): InternalFrameModel<PageModel, Msg> {
  if (model.focusedPaneByPage[model.activePageId] === paneId) return model;
  return {
    ...model,
    focusedPaneByPage: {
      ...model.focusedPaneByPage,
      [model.activePageId]: paneId,
    },
  };
}

function paneHitAtPosition<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  col: number,
  row: number,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
): { readonly paneId: string; readonly rect: LayoutRect } | undefined {
  const bodyRect = frameBodyRect(model.columns, model.rows);
  const maxState = model.maximizedPaneByPage[model.activePageId];
  const maximizedPaneId = maxState?.maximizedPaneId;
  const renderResult = maximizedPaneId
    ? renderMaximizedPane(model.activePageId, model, bodyRect, pagesById, maximizedPaneId)
    : renderPageContent(model.activePageId, model, bodyRect, pagesById);

  for (const [paneId, rect] of renderResult.paneRects.entries()) {
    if (
      col >= rect.col
      && col < rect.col + rect.width
      && row >= rect.row
      && row < rect.row + rect.height
    ) {
      return { paneId, rect };
    }
  }

  return undefined;
}

function renderHelpOverlay<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  activePage: FramePage<PageModel, Msg>,
  frameKeys: KeyMap<FrameAction>,
  options: CreateFramedAppOptions<PageModel, Msg>,
): { body: Surface; maxScrollY: number; scrollY: number } {
  const activePageModel = model.pageModels[model.activePageId]!;
  const activeInputArea = findInputAreaByPaneId(
    resolveInputAreas(activePage, activePageModel),
    model.focusedPaneByPage[model.activePageId],
  );
  const source = model.settingsOpen
    ? mergeBindingSources(settingsHelpKeys, quitHelpKeys)
    : mergeBindingSources(
      frameKeys,
      quitHelpKeys,
      options.globalKeys,
      activeInputArea?.helpSource ?? activeInputArea?.keyMap,
      activePage.helpSource ?? activePage.keyMap,
    );
  const maxDialogWidth = Math.max(28, Math.min(model.columns - 4, 88));
  const bodyWidth = Math.max(20, maxDialogWidth - 4);
  const helpSurface = helpViewSurface(source, {
    title: undefined,
    width: bodyWidth,
  });
  const pagerHeight = Math.max(4, Math.min(helpSurface.height + 1, Math.max(4, model.rows - 8)));
  const pagerState = createPagerStateForSurface(helpSurface, {
    width: bodyWidth,
    height: pagerHeight,
  });
  const scrollY = Math.max(0, Math.min(model.helpScrollY, pagerState.scroll.maxY));
  const scrolledState = {
    ...pagerState,
    scroll: {
      ...pagerState.scroll,
      y: scrollY,
    },
  };
  return {
    body: pagerSurface(helpSurface, scrolledState, { showScrollbar: true, showStatus: true }),
    maxScrollY: pagerState.scroll.maxY,
    scrollY,
  };
}

function isHelpScrollAction(
  action: FrameAction,
): action is Extract<FrameAction, { type: 'scroll-up' | 'scroll-down' | 'page-up' | 'page-down' | 'top' | 'bottom' }> {
  return action.type === 'scroll-up'
    || action.type === 'scroll-down'
    || action.type === 'page-up'
    || action.type === 'page-down'
    || action.type === 'top'
    || action.type === 'bottom';
}

function applyHelpScrollAction<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  activePage: FramePage<PageModel, Msg>,
  action: Extract<FrameAction, { type: 'scroll-up' | 'scroll-down' | 'page-up' | 'page-down' | 'top' | 'bottom' }>,
  frameKeys: KeyMap<FrameAction>,
  options: CreateFramedAppOptions<PageModel, Msg>,
): InternalFrameModel<PageModel, Msg> {
  const overlay = renderHelpOverlay(model, activePage, frameKeys, options);
  const pagerState = {
    scroll: {
      y: overlay.scrollY,
      maxY: overlay.maxScrollY,
      x: 0,
      maxX: 0,
      totalLines: overlay.maxScrollY + Math.max(1, overlay.body.height - 1),
      visibleLines: Math.max(1, overlay.body.height - 1),
    },
    content: '',
    width: overlay.body.width,
    height: overlay.body.height,
  };

  let next = pagerState;
  switch (action.type) {
    case 'scroll-up':
      next = pagerScrollBy(pagerState, -1);
      break;
    case 'scroll-down':
      next = pagerScrollBy(pagerState, 1);
      break;
    case 'page-up':
      next = pagerPageUp(pagerState);
      break;
    case 'page-down':
      next = pagerPageDown(pagerState);
      break;
    case 'top':
      next = pagerScrollToTop(pagerState);
      break;
    case 'bottom':
      next = pagerScrollToBottom(pagerState);
      break;
  }

  return {
    ...model,
    helpScrollY: next.scroll.y,
  };
}

function applyHelpScroll<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  activePage: FramePage<PageModel, Msg>,
  delta: number,
  frameKeys: KeyMap<FrameAction>,
  options: CreateFramedAppOptions<PageModel, Msg>,
): InternalFrameModel<PageModel, Msg> {
  const overlay = renderHelpOverlay(model, activePage, frameKeys, options);
  return {
    ...model,
    helpScrollY: Math.max(0, Math.min(overlay.maxScrollY, overlay.scrollY + delta)),
  };
}

interface FlatSettingsRow<Msg> {
  readonly index: number;
  readonly line: number;
  readonly row: FrameSettingRow<Msg>;
}

interface ResolvedSettingsLayout<Msg> {
  readonly settings: FrameSettings<Msg>;
  readonly rows: readonly FlatSettingsRow<Msg>[];
  readonly drawerWidth: number;
  readonly contentWidth: number;
  readonly contentHeight: number;
  readonly totalLines: number;
  readonly maxScrollY: number;
}

function resolveFrameSettings<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  options: CreateFramedAppOptions<PageModel, Msg>,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
): FrameSettings<Msg> | undefined {
  const activePage = pagesById.get(model.activePageId)!;
  return options.settings?.({
    model,
    activePage,
    pageModel: model.pageModels[model.activePageId]!,
  });
}

function resolveSettingsLayout<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  options: CreateFramedAppOptions<PageModel, Msg>,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
): ResolvedSettingsLayout<Msg> | undefined {
  const settings = resolveFrameSettings(model, options, pagesById);
  if (settings == null) return undefined;

  const sections = settings.sections.filter((section) => section.rows.length > 0);
  if (sections.length === 0) return undefined;

  const rows: FlatSettingsRow<Msg>[] = [];
  let line = 0;

  for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex++) {
    const section = sections[sectionIndex]!;
    line += 1;
    for (const row of section.rows) {
      rows.push({
        index: rows.length,
        line,
        row,
      });
      line += 1;
    }
    if (sectionIndex < sections.length - 1) {
      line += 1;
    }
  }

  const drawerWidth = resolveSettingsDrawerWidth(model.columns);
  const contentWidth = Math.max(16, drawerWidth - 4);
  const contentHeight = Math.max(1, model.rows - 2);
  const totalLines = Math.max(1, line);
  const maxScrollY = Math.max(0, totalLines - contentHeight);

  return {
    settings: {
      ...settings,
      sections,
    },
    rows,
    drawerWidth,
    contentWidth,
    contentHeight,
    totalLines,
    maxScrollY,
  };
}

function resolveSettingsDrawerWidth(columns: number): number {
  const boundedColumns = Math.max(24, columns);
  return Math.min(Math.max(28, Math.floor(boundedColumns * 0.3)), Math.max(28, boundedColumns - 4), 42);
}

function clampSettingsFocus<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  layout: ResolvedSettingsLayout<Msg>,
): number {
  if (layout.rows.length === 0) return 0;
  return Math.max(0, Math.min(model.settingsFocusIndex, layout.rows.length - 1));
}

function clampSettingsScroll<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  layout: ResolvedSettingsLayout<Msg>,
): number {
  return Math.max(0, Math.min(model.settingsScrollY, layout.maxScrollY));
}

function resolveInputAreas<PageModel, Msg>(
  page: FramePage<PageModel, Msg>,
  pageModel: PageModel,
): readonly FrameInputArea<PageModel, Msg>[] {
  return page.inputAreas?.(pageModel) ?? [];
}

function findInputAreaByPaneId<PageModel, Msg>(
  inputAreas: readonly FrameInputArea<PageModel, Msg>[],
  paneId: string | undefined,
): FrameInputArea<PageModel, Msg> | undefined {
  if (paneId == null) return undefined;
  return inputAreas.find((area) => area.paneId === paneId);
}

function ensureSettingsLineVisible(line: number, scrollY: number, visibleLines: number, maxScrollY: number): number {
  let next = scrollY;
  if (line < next) {
    next = line;
  } else if (line >= next + visibleLines) {
    next = line - visibleLines + 1;
  }
  return Math.max(0, Math.min(next, maxScrollY));
}

function moveSettingsFocus<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  layout: ResolvedSettingsLayout<Msg>,
  delta: number,
): InternalFrameModel<PageModel, Msg> {
  if (layout.rows.length === 0) return model;
  const nextFocus = Math.max(0, Math.min(clampSettingsFocus(model, layout) + delta, layout.rows.length - 1));
  const focusLine = layout.rows[nextFocus]!.line;
  return {
    ...model,
    settingsFocusIndex: nextFocus,
    settingsScrollY: ensureSettingsLineVisible(focusLine, clampSettingsScroll(model, layout), layout.contentHeight, layout.maxScrollY),
  };
}

function scrollSettingsBy<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  layout: ResolvedSettingsLayout<Msg>,
  delta: number,
): InternalFrameModel<PageModel, Msg> {
  return {
    ...model,
    settingsScrollY: Math.max(0, Math.min(clampSettingsScroll(model, layout) + delta, layout.maxScrollY)),
  };
}

function isInsideSettingsDrawer<PageModel, Msg>(
  col: number,
  row: number,
  layout: ResolvedSettingsLayout<Msg>,
  model: InternalFrameModel<PageModel, Msg>,
): boolean {
  return col >= 0
    && col < layout.drawerWidth
    && row >= 0
    && row < model.rows;
}

function settingsRowAtPosition<PageModel, Msg>(
  col: number,
  row: number,
  model: InternalFrameModel<PageModel, Msg>,
  layout: ResolvedSettingsLayout<Msg>,
): FlatSettingsRow<Msg> | undefined {
  if (!isInsideSettingsDrawer(col, row, layout, model)) return undefined;
  if (row <= 0 || row >= model.rows - 1) return undefined;
  const contentLine = (row - 1) + clampSettingsScroll(model, layout);
  return layout.rows.find((candidate) => candidate.line === contentLine);
}

function renderSettingsDrawer<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  options: CreateFramedAppOptions<PageModel, Msg>,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
): Overlay | undefined {
  const layout = resolveSettingsLayout(model, options, pagesById);
  if (layout == null) return undefined;

  const scrollY = clampSettingsScroll(model, layout);
  const content = renderSettingsSurface(layout, model);
  const pagerState = createPagerStateForSurface(content, {
    width: layout.contentWidth,
    height: layout.contentHeight,
  });
  const scrolledState = {
    ...pagerState,
    scroll: {
      ...pagerState.scroll,
      y: scrollY,
    },
  };
  const body = pagerSurface(content, scrolledState, {
    showScrollbar: layout.maxScrollY > 0,
    showStatus: false,
  });

  return drawer({
    anchor: 'left',
    title: layout.settings.title ?? 'Settings',
    content: body,
    width: layout.drawerWidth,
    screenWidth: model.columns,
    screenHeight: model.rows,
  });
}

function renderSettingsSurface<PageModel, Msg>(
  layout: ResolvedSettingsLayout<Msg>,
  model: InternalFrameModel<PageModel, Msg>,
): Surface {
  const surface = createSurface(layout.contentWidth, layout.totalLines);
  const focusedIndex = clampSettingsFocus(model, layout);
  const rowsByLine = new Map(layout.rows.map((row) => [row.line, row] as const));
  let lineIndex = 0;

  for (let sectionIndex = 0; sectionIndex < layout.settings.sections.length; sectionIndex++) {
    const section = layout.settings.sections[sectionIndex]!;
    writeSettingsLine(surface, lineIndex, section.title, { bold: true });
    lineIndex += 1;

    for (const row of section.rows) {
      const flat = rowsByLine.get(lineIndex);
      writeSettingsRow(surface, lineIndex, row, layout.contentWidth, flat?.index === focusedIndex);
      lineIndex += 1;
    }

    if (sectionIndex < layout.settings.sections.length - 1) {
      lineIndex += 1;
    }
  }

  return surface;
}

function writeSettingsRow<Msg>(
  surface: Surface,
  y: number,
  row: FrameSettingRow<Msg>,
  width: number,
  focused: boolean,
): void {
  const prefix = focused ? '›' : ' ';
  const value = row.valueLabel ?? '';
  const leftText = `${prefix} ${row.label}`;
  const leftChars = Array.from(leftText);
  const valueChars = Array.from(value);
  const valueStart = valueChars.length === 0 ? width : Math.max(leftChars.length + 1, width - valueChars.length);

  for (let x = 0; x < leftChars.length && x < width; x++) {
    const char = leftChars[x]!;
    if (char === ' ') continue;
    surface.set(x, y, cellForSettingsChar(char, focused));
  }

  for (let offset = 0; offset < valueChars.length && valueStart + offset < width; offset++) {
    const char = valueChars[offset]!;
    if (char === ' ') continue;
    surface.set(valueStart + offset, y, cellForSettingsChar(char, focused));
  }
}

function writeSettingsLine(
  surface: Surface,
  y: number,
  text: string,
  options: { readonly bold?: boolean } = {},
): void {
  const chars = Array.from(text);
  for (let x = 0; x < chars.length && x < surface.width; x++) {
    const char = chars[x]!;
    if (char === ' ') continue;
    surface.set(x, y, cellForSettingsChar(char, options.bold ?? false));
  }
}

function cellForSettingsChar(char: string, strong: boolean): Cell {
  return {
    char,
    modifiers: strong ? ['bold'] : undefined,
    empty: false,
  };
}
