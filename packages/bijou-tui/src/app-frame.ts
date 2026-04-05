/**
 * `appFrame()` — high-level TEA app shell.
 *
 * Provides tabs, pane focus/scroll isolation, shell key handling, help,
 * panel-scoped overlay context, and optional frame-level command palette.
 */

import {
  createSurface,
  type LayoutNode as SurfaceLayoutNode,
  preparePreferenceSections,
  preferenceListSurface,
  type PreferenceListTheme,
  resolvePreferenceRowLayout,
  resolveClock,
  resolveSafeCtx,
  type PreparedPreferenceSection,
  type PreferenceRow,
  type PreferenceSection,
  type OverflowBehavior,
  type Surface,
  type TokenValue,
} from '@flyingrobots/bijou';
import type { I18nRuntime } from '@flyingrobots/bijou-i18n';
import { helpViewSurface, type BindingSource } from './help.js';
import { createKeyMap, type KeyMap } from './keybindings.js';
import type { App, Cmd, KeyMsg, MouseMsg } from './types.js';
import { isKeyMsg, isMouseMsg, isResizeMsg } from './types.js';
import { quit } from './commands.js';
import type { Overlay } from './overlay.js';
import { compositeSurfaceInto, drawer, modal } from './overlay.js';
import {
  isShellQuitConfirmAccept,
  isShellQuitConfirmDismiss,
  isShellQuitRequest,
  renderShellQuitOverlay,
  shouldUseShellQuitConfirm,
} from './shell-quit.js';
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
  countNotificationHistory,
  createNotificationState,
  dismissNotification,
  hitTestNotificationStack,
  notificationsNeedTick,
  pushNotification,
  renderNotificationHistorySurface,
  renderNotificationReviewEntrySurface,
  renderNotificationStack,
  tickNotifications,
  trimNotificationsToViewport,
  type NotificationHistoryFilter,
  type NotificationPlacement,
  type NotificationState,
  type NotificationTone,
} from './notification.js';
import { insetLineSurface } from './collection-surface.js';
import { vstackSurface } from './surface-layout.js';

// Internal modules
import type {
  InternalFrameModel,
  FrameAction,
  PaletteAction,
  FramePageMsg,
  FramePageUpdateResult,
  FramedApp,
  FramedAppMsg,
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
  activeFrameLayer,
  describeFrameLayerStack,
  describeFrameRuntimeViewStack,
  type FrameLayerDescriptor,
  type FrameLayerMetadata,
  type FrameLayerHintSource,
  type FrameLayerKind,
} from './app-frame-layers.js';
import {
  createRuntimeRetainedLayouts,
  retainRuntimeLayout,
  routeRuntimeInput,
} from './runtime-engine.js';
import {
  frameEndAnchor,
  frameMessage,
  frameNotificationCue,
  frameNotificationFilterLabel,
  frameStartAnchor,
} from './app-frame-i18n.js';
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
  openSearchPalette,
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
  init(): FramePageUpdateResult<PageModel, Msg>;
  /** Page-level updater (custom messages plus raw mouse forwarding). */
  update(msg: FramePageMsg<Msg>, model: PageModel): FramePageUpdateResult<PageModel, Msg>;
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
  /** Optional page-scoped search items opened by the shell search action. */
  searchItems?: (model: PageModel) => readonly FrameCommandItem<Msg>[];
  /** Optional title used by the shell search surface. */
  readonly searchTitle?: string;
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
  readonly checked?: boolean;
  readonly action?: Msg;
  readonly feedback?: FrameSettingFeedback;
  readonly kind?: 'action' | 'toggle' | 'choice' | 'info';
  readonly enabled?: boolean;
}

/** Shell-owned feedback shown after a settings row is activated. */
export interface FrameSettingFeedback {
  readonly title?: string;
  readonly message: string;
  readonly tone?: NotificationTone;
  readonly durationMs?: number | null;
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
  readonly borderToken?: TokenValue;
  readonly bgToken?: TokenValue;
  readonly listTheme?: PreferenceListTheme;
  readonly sections: readonly FrameSettingSection<Msg>[];
}

/** Structured notification review content supplied by the app and rendered by the frame shell. */
export interface FrameNotificationCenter<Msg> {
  readonly title?: string;
  readonly state: NotificationState<Msg>;
  readonly filters?: readonly NotificationHistoryFilter[];
  readonly activeFilter?: NotificationHistoryFilter;
  readonly onFilterChange?: (filter: NotificationHistoryFilter) => Msg | undefined;
}

/** Optional styling overrides for the frame-owned header line. */
export interface FrameHeaderStyle {
  /** Foreground token for the active tab/page label in the header. */
  readonly activeTabToken?: TokenValue;
}

/** Declarative frame layout node. */
export type FrameLayoutNode =
  | {
    readonly kind: 'pane';
    readonly paneId: string;
    /** Pane content must be a Surface or LayoutNode. */
    readonly render: (width: number, height: number) => ViewOutput;
    readonly overflowX?: OverflowX;
    readonly focusedGutterToken?: TokenValue;
    readonly unfocusedGutterToken?: TokenValue;
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
  /** Optional app-owned styling override for the active header tab/page label. */
  readonly headerStyle?: (args: {
    readonly model: FrameModel<PageModel>;
    readonly activePage: FramePage<PageModel, Msg>;
    readonly pageModel: PageModel;
  }) => FrameHeaderStyle | undefined;
  /** Initial terminal width before runtime resize events. Default: 80. */
  readonly initialColumns?: number;
  /** Initial terminal height before runtime resize events. Default: 24. */
  readonly initialRows?: number;
  /** Number of reserved top chrome rows above page content. Default: 1. */
  readonly bodyTopRows?: number;
  /** Number of reserved bottom chrome rows below page content. Default: 1. */
  readonly bodyBottomRows?: number;
  /** Optional global keymap layered above page keymap. */
  readonly globalKeys?: KeyMap<Msg>;
  /** Optional shell localization runtime for frame-owned copy and direction. */
  readonly i18n?: I18nRuntime;
  /** Resolve key conflicts in favor of the frame shell or the active page. Default: 'frame-first'. */
  readonly keyPriority?: 'frame-first' | 'page-first';
  /** Optional override for the short footer hint source shown beneath the frame workspace. */
  readonly helpLineSource?: (args: {
    readonly model: FrameModel<PageModel>;
    readonly activePage: FramePage<PageModel, Msg>;
    readonly frameKeys: KeyMap<FrameAction>;
    readonly globalKeys?: KeyMap<Msg>;
  }) => BindingSource | string | undefined;
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
  /** Optional shell-owned notification center content. */
  readonly notificationCenter?: (args: {
    readonly model: FrameModel<PageModel>;
    readonly activePage: FramePage<PageModel, Msg>;
    readonly pageModel: PageModel;
    readonly runtimeNotifications: NotificationState<never>;
  }) => FrameNotificationCenter<Msg> | undefined;
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
  /** Kind of active shell palette (`search` vs `command`). */
  readonly commandPaletteKind?: 'command' | 'search';
  /** Settings drawer visibility flag. */
  readonly settingsOpen: boolean;
  /** Notification center visibility flag. */
  readonly notificationCenterOpen: boolean;
  /** Quit-confirm modal visibility flag. */
  readonly quitConfirmOpen: boolean;
  /** Active settings row index. */
  readonly settingsFocusIndex: number;
  /** Vertical scroll offset for the settings drawer. */
  readonly settingsScrollY: number;
  /** Vertical scroll offset for the notification center. */
  readonly notificationCenterScrollY: number;
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
  /** Active filter for the shell fallback notification center. */
  readonly runtimeNotificationHistoryFilter: NotificationHistoryFilter;
  /** Whether the runtime notification tick loop is active. */
  readonly runtimeNotificationLoopActive: boolean;
}

export type {
  FramePageMsg,
  FramePageUpdateResult,
  FramedApp,
  FramedAppMsg,
  FramedAppUpdateResult,
  FrameScopedMsg,
  PageScopedMsg,
} from './app-frame-types.js';

export type {
  FrameLayerHintSource,
  FrameLayerKind,
  FrameLayerMetadata,
  FrameLayerOwner,
  FrameLayerDescriptor,
  FrameRuntimeLayer,
  FrameRuntimeViewStack,
  DescribeFrameLayerStackOptions,
} from './app-frame-layers.js';
export {
  activeFrameLayer,
  describeFrameLayerStack,
  describeFrameRuntimeViewStack,
  underlyingFrameLayer,
} from './app-frame-layers.js';

// ---------------------------------------------------------------------------
// Frame Notification Helpers
// ---------------------------------------------------------------------------

const FRAME_NOTIFICATION_TICK_MS = 40;
const DEFAULT_FRAME_NOTIFICATION_DURATION_MS = 6_000;
const SETTINGS_FEEDBACK_TOAST_WIDTH = 40;
const EMPTY_RUNTIME_LAYOUTS = createRuntimeRetainedLayouts();
const DEFAULT_NOTIFICATION_CENTER_FILTERS: readonly NotificationHistoryFilter[] = [
  'ALL',
  'ACTIONABLE',
  'ERROR',
  'WARNING',
  'SUCCESS',
  'INFO',
];

interface ResolvedFrameNotificationOptions {
  readonly enabled: boolean;
  readonly placement: NotificationPlacement;
  readonly durationMs: number | null;
  readonly margin: number;
  readonly gap: number;
  readonly overflow: OverflowBehavior;
}

type ObservedKeyRoute =
  | 'palette'
  | 'help'
  | 'frame'
  | 'global'
  | 'page'
  | 'unhandled';

const quitHelpKeys = createKeyMap<FrameAction>()
  .group('Exit', (g) => g
    .bind('q', 'Quit', { type: 'toggle-help' })
    .bind('escape', 'Quit', { type: 'toggle-help' })
    .bind('ctrl+c', 'Quit', { type: 'toggle-help' }));
const helpLayerHelpKeys = createKeyMap<{ type: 'noop' }>()
  .group('Help', (g) => g
    .bind('escape', 'Close help', { type: 'noop' })
    .bind('?', 'Close help', { type: 'noop' })
    .bind('up', 'Scroll up', { type: 'noop' })
    .bind('down', 'Scroll down', { type: 'noop' })
    .bind('j', 'Scroll down', { type: 'noop' })
    .bind('k', 'Scroll up', { type: 'noop' })
    .bind('d', 'Page down', { type: 'noop' })
    .bind('u', 'Page up', { type: 'noop' })
    .bind('g', 'Top', { type: 'noop' })
    .bind('shift+g', 'Bottom', { type: 'noop' }));
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
    .bind('/', 'Search', { type: 'open-search' })
    .bind('ctrl+p', 'Open command palette', { type: 'open-palette' })
    .bind(':', 'Open command palette', { type: 'open-palette' })
    .bind('?', 'Toggle help', { type: 'toggle-help' }));
const notificationCenterHelpKeys = createKeyMap<{ type: 'noop' }>()
  .group('Notifications', (g) => g
    .bind('shift+n', 'Close notification center', { type: 'noop' })
    .bind('up', 'Scroll up', { type: 'noop' })
    .bind('down', 'Scroll down', { type: 'noop' })
    .bind('j', 'Scroll down', { type: 'noop' })
    .bind('k', 'Scroll up', { type: 'noop' })
    .bind('d', 'Page down', { type: 'noop' })
    .bind('u', 'Page up', { type: 'noop' })
    .bind('g', 'Top', { type: 'noop' })
    .bind('shift+g', 'Bottom', { type: 'noop' })
    .bind('f', 'Cycle filter', { type: 'noop' })
    .bind('/', 'Search', { type: 'noop' })
    .bind('ctrl+p', 'Open command palette', { type: 'noop' })
    .bind(':', 'Open command palette', { type: 'noop' })
    .bind('?', 'Toggle help', { type: 'noop' }));
const quitConfirmHelpKeys = createKeyMap<{ type: 'noop' }>()
  .group('Quit', (g) => g
    .bind('y', 'Quit', { type: 'noop' })
    .bind('enter', 'Quit', { type: 'noop' })
    .bind('n', 'Stay', { type: 'noop' })
    .bind('escape', 'Stay', { type: 'noop' })
    .bind('q', 'Stay', { type: 'noop' }));

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

function createFrameNotificationTickCmd<Msg>(): Cmd<FramedAppMsg<Msg>> {
  return async (_emit, caps) => {
    if (!caps.sleep) {
      throw new Error('createFrameNotificationTickCmd requires sleep capability');
    }
    await caps.sleep(FRAME_NOTIFICATION_TICK_MS);
    return wrapFrameMsg({
      type: 'notification-tick',
      atMs: caps.now?.() ?? 0,
    });
  };
}

// Factory
// ---------------------------------------------------------------------------

/**
 * Create a fully framed TEA app shell.
 */
export function createFramedApp<PageModel, Msg>(
  options: CreateFramedAppOptions<PageModel, Msg>,
): FramedApp<PageModel, Msg> {
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

  const frameKeys = createFrameKeyMap({
    enableSettings: options.settings != null,
    enableNotifications: options.notificationCenter != null || options.runtimeNotifications !== false,
    i18n: options.i18n,
  });
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
    cmds: readonly Cmd<FramedAppMsg<Msg>>[],
    msg: KeyMsg,
    route: ObservedKeyRoute,
  ): Cmd<FramedAppMsg<Msg>>[] {
    const observed = options.observeKey?.(msg, route);
    if (observed === undefined) return [...cmds];
    return [emitMsgForPage(model.activePageId, observed), ...cmds];
  }

  function applyQuitRequest(
    model: InternalFrameModel<PageModel, Msg>,
    msg: KeyMsg,
  ): [InternalFrameModel<PageModel, Msg>, Cmd<FramedAppMsg<Msg>>[]] {
    if (!shouldUseShellQuitConfirm()) {
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
      notificationCenterOpen: false,
      commandPalette: undefined,
      commandPaletteEntries: undefined,
      commandPaletteTitle: undefined,
      commandPaletteKind: undefined,
    }, withObservedKey(model, [], msg, 'frame')];
  }

  function closeCommandPalette(
    model: InternalFrameModel<PageModel, Msg>,
  ): InternalFrameModel<PageModel, Msg> {
    return {
      ...model,
      commandPalette: undefined,
      commandPaletteEntries: undefined,
      commandPaletteTitle: undefined,
      commandPaletteKind: undefined,
    };
  }

  function resolveLayerContext(
    model: InternalFrameModel<PageModel, Msg>,
  ) {
    const activePage = pagesById.get(model.activePageId)!;
    const activePageModel = model.pageModels[model.activePageId]!;
    const inputAreas = resolveInputAreas(activePage, activePageModel);
    const activeInputArea = findInputAreaByPaneId(
      inputAreas,
      model.focusedPaneByPage[model.activePageId],
    );
    const modalKeyMap = activePage.modalKeyMap?.(activePageModel);
    const pageModalOpen = modalKeyMap != null;
    const activeLayer = activeFrameLayer(model, { pageModalOpen });
    return {
      activePage,
      activePageModel,
      inputAreas,
      activeInputArea,
      modalKeyMap,
      pageModalOpen,
      activeLayer,
    };
  }

  function observedRouteForLayer(layer: FrameLayerDescriptor): ObservedKeyRoute {
    switch (layer.kind) {
      case 'search':
      case 'command-palette':
        return 'palette';
      case 'help':
        return 'help';
      case 'page-modal':
        return 'page';
      case 'settings':
      case 'notification-center':
      case 'quit-confirm':
        return 'frame';
      default:
        return 'unhandled';
    }
  }

  function resolveRoutedKeyLayer(
    msg: KeyMsg,
    model: InternalFrameModel<PageModel, Msg>,
  ) {
    const context = resolveLayerContext(model);
    const runtimeStack = describeFrameRuntimeViewStack(model, {
      pageModalOpen: context.pageModalOpen,
    });
    const runtimeRoute = routeRuntimeInput(
      runtimeStack,
      EMPTY_RUNTIME_LAYOUTS,
      { kind: 'key', key: msg.key },
      ({ layer }) => {
        const frameLayer = layer.model;
        if (frameLayer == null) {
          return undefined;
        }

        if (frameLayer.kind === 'settings') {
          return resolveSettingsLayout(model, options, pagesById) == null
            ? { bubble: true }
            : { handled: true };
        }

        if (frameLayer.kind === 'notification-center') {
          return resolveNotificationCenterLayout(model, options, pagesById) == null
            ? { bubble: true }
            : { handled: true };
        }

        return { handled: true };
      },
    );

    const routedLayer = runtimeStack.layers.find(
      (layer) => layer.id === runtimeRoute.handledByViewId,
    )?.model ?? context.activeLayer;

    return {
      ...context,
      runtimeStack,
      routedLayer,
      routedRoute: observedRouteForLayer(routedLayer),
    };
  }

  function createShellRetainedLayoutNode(
    id: string,
    rect: LayoutRect,
    children?: SurfaceLayoutNode[],
  ): SurfaceLayoutNode {
    return {
      id,
      rect: {
        x: rect.col,
        y: rect.row,
        width: rect.width,
        height: rect.height,
      },
      children: children ?? [],
    };
  }

  function resolveWorkspacePaneRects(
    model: InternalFrameModel<PageModel, Msg>,
  ): ReadonlyMap<string, LayoutRect> {
    const bodyRect = resolveBodyRect(model, options);
    const maxState = model.maximizedPaneByPage[model.activePageId];
    const maximizedPaneId = maxState?.maximizedPaneId;
    const renderResult = maximizedPaneId
      ? renderMaximizedPane(model.activePageId, model, bodyRect, pagesById, maximizedPaneId)
      : renderPageContent(model.activePageId, model, bodyRect, pagesById);
    return renderResult.paneRects;
  }

  function buildWorkspaceLayoutTree(
    model: InternalFrameModel<PageModel, Msg>,
  ): SurfaceLayoutNode {
    const header = resolveHeaderLine(model, options, pagesById);
    const tabChildren: SurfaceLayoutNode[] = header.tabTargets.map((target) =>
      createShellRetainedLayoutNode(`tab:${target.pageId}`, {
        row: 0,
        col: target.startCol,
        width: target.endCol - target.startCol + 1,
        height: 1,
      }),
    );

    const bodyRect = resolveBodyRect(model, options);
    const paneRects = resolveWorkspacePaneRects(model);
    const paneChildren: SurfaceLayoutNode[] = [];
    for (const [paneId, rect] of paneRects.entries()) {
      paneChildren.push(createShellRetainedLayoutNode(`pane:${paneId}`, rect));
    }

    return createShellRetainedLayoutNode(
      'workspace',
      { row: 0, col: 0, width: model.columns, height: model.rows },
      [
        createShellRetainedLayoutNode(
          'header-bar',
          { row: 0, col: 0, width: model.columns, height: 1 },
          tabChildren,
        ),
        createShellRetainedLayoutNode(
          'workspace-body',
          bodyRect,
          paneChildren,
        ),
      ],
    );
  }

  function buildSettingsRowChildren(
    model: InternalFrameModel<PageModel, Msg>,
    layout: ResolvedSettingsLayout<Msg>,
  ): SurfaceLayoutNode[] {
    const scrollY = clampSettingsScroll(model, layout);
    const viewportTop = 1;
    const viewportBottom = model.rows - 1;
    const children: SurfaceLayoutNode[] = [];
    for (const flatRow of layout.rows) {
      const screenRow = flatRow.line - scrollY + viewportTop;
      const clippedTop = Math.max(viewportTop, screenRow);
      const clippedBottom = Math.min(viewportBottom, screenRow + flatRow.height);
      if (clippedTop >= clippedBottom) continue;
      children.push(createShellRetainedLayoutNode(`settings-row:${flatRow.index}`, {
        row: clippedTop,
        col: layout.startCol,
        width: layout.drawerWidth,
        height: clippedBottom - clippedTop,
      }));
    }
    return children;
  }

  function resolveFrameMouseRuntimeLayouts(
    model: InternalFrameModel<PageModel, Msg>,
  ) {
    let layouts = EMPTY_RUNTIME_LAYOUTS;

    const settingsLayout = resolveSettingsLayout(model, options, pagesById);
    if (settingsLayout != null) {
      layouts = retainRuntimeLayout(layouts, {
        viewId: 'settings',
        tree: createShellRetainedLayoutNode('settings-drawer', {
          row: 0,
          col: settingsLayout.startCol,
          width: settingsLayout.drawerWidth,
          height: model.rows,
        }, buildSettingsRowChildren(model, settingsLayout)),
      });
    }

    const notificationCenterLayout = resolveNotificationCenterLayout(model, options, pagesById);
    if (notificationCenterLayout != null) {
      layouts = retainRuntimeLayout(layouts, {
        viewId: 'notification-center',
        tree: createShellRetainedLayoutNode('notification-center-drawer', {
          row: 0,
          col: notificationCenterLayout.startCol,
          width: notificationCenterLayout.drawerWidth,
          height: model.rows,
        }),
      });
    }

    layouts = retainRuntimeLayout(layouts, {
      viewId: 'workspace',
      tree: buildWorkspaceLayoutTree(model),
    });

    return layouts;
  }

  function resolveRoutedMouseLayer(
    msg: MouseMsg,
    model: InternalFrameModel<PageModel, Msg>,
  ) {
    const context = resolveLayerContext(model);
    const runtimeStack = describeFrameRuntimeViewStack(model, {
      pageModalOpen: context.pageModalOpen,
    });
    const runtimeRoute = routeRuntimeInput(
      runtimeStack,
      resolveFrameMouseRuntimeLayouts(model),
      {
        kind: 'pointer',
        action: msg.action,
        x: msg.col,
        y: msg.row,
        button: msg.button === 'none' ? undefined : msg.button,
      },
      ({ layer, hit }) => {
        const frameLayer = layer.model;
        if (frameLayer == null) {
          return undefined;
        }

        switch (frameLayer.kind) {
          case 'settings':
          case 'notification-center':
            return hit == null ? { stop: true } : { handled: true };
          case 'help':
          case 'search':
          case 'command-palette':
          case 'quit-confirm':
          case 'page-modal':
          case 'workspace':
            return { handled: true };
          default:
            return undefined;
        }
      },
    );

    const routedLayer = runtimeStack.layers.find(
      (layer) => layer.id === (runtimeRoute.handledByViewId ?? runtimeRoute.stoppedByViewId),
    )?.model ?? context.activeLayer;

    return {
      ...context,
      runtimeStack,
      routedLayer,
      routedHit: runtimeRoute.hit,
    };
  }

  function resolveWorkspaceHelpSource(
    activePage: FramePage<PageModel, Msg>,
    activeInputArea: FrameInputArea<PageModel, Msg> | undefined,
  ): BindingSource {
    return mergeBindingSources(
      frameKeys,
      quitHelpKeys,
      options.globalKeys,
      activeInputArea?.helpSource ?? activeInputArea?.keyMap,
      activePage.helpSource ?? activePage.keyMap,
    );
  }

  function resolveWorkspaceHintSource(
    model: InternalFrameModel<PageModel, Msg>,
    activePage: FramePage<PageModel, Msg>,
    activeInputArea: FrameInputArea<PageModel, Msg> | undefined,
  ): FrameLayerHintSource | undefined {
    const helpLineOverride = options.helpLineSource?.({
      model,
      activePage,
      frameKeys,
      globalKeys: options.globalKeys,
    });
    if (typeof helpLineOverride === 'string') {
      return helpLineOverride;
    }
    return helpLineOverride ?? mergeBindingSources(
      frameKeys,
      options.globalKeys,
      activeInputArea?.helpSource ?? activeInputArea?.keyMap,
      activePage.helpSource ?? activePage.keyMap,
    );
  }

  function resolveLayerMetadata(
    model: InternalFrameModel<PageModel, Msg>,
    activePage: FramePage<PageModel, Msg>,
    activeInputArea: FrameInputArea<PageModel, Msg> | undefined,
    modalKeyMap: KeyMap<Msg> | undefined,
  ): Partial<Record<FrameLayerKind, FrameLayerMetadata>> {
    const settings = resolveFrameSettings(model, options, pagesById);
    const notificationCenter = resolveFrameNotificationCenter(model, options, pagesById);
    const workspaceHintSource = resolveWorkspaceHintSource(model, activePage, activeInputArea);
    const workspaceHelpSource = resolveWorkspaceHelpSource(activePage, activeInputArea);
    const paletteHint = frameMessage(options.i18n, 'palette.hint', 'Enter select • Esc close');
    const helpHint = frameMessage(options.i18n, 'help.hint', 'j/k scroll • d/u page • g/G top/bottom • mouse wheel • ?/Esc close');
    const settingsHint = frameMessage(options.i18n, 'settings.footer', 'F2/Esc close • ↑/↓ rows • Enter toggle • / search • q quit');
    const notificationsHint = frameMessage(options.i18n, 'notifications.footer', 'Shift+N close • f filter • j/k scroll • q quit');
    const quitHint = frameMessage(options.i18n, 'quit.footer', 'Y quit • N stay');
    const paletteTitle = model.commandPaletteTitle
      ?? frameMessage(options.i18n, 'palette.title', 'Command Palette');
    const searchTitle = model.commandPaletteTitle
      ?? activePage.searchTitle
      ?? frameMessage(options.i18n, 'search.title', 'Search');
    const notificationsTitle = notificationCenter == null
      ? frameMessage(options.i18n, 'notifications.title', 'Notifications')
      : `${notificationCenter.title} • ${frameNotificationFilterLabel(options.i18n, notificationCenter.activeFilter)}`;

    return {
      workspace: {
        title: activePage.title,
        hintSource: workspaceHintSource,
        helpSource: workspaceHelpSource,
      },
      'page-modal': {
        title: activePage.title,
        hintSource: modalKeyMap ?? activePage.helpSource ?? activePage.keyMap,
        helpSource: mergeBindingSources(
          quitHelpKeys,
          modalKeyMap,
          activePage.helpSource ?? activePage.keyMap,
        ),
      },
      settings: {
        title: settings?.title ?? frameMessage(options.i18n, 'settings.title', 'Settings'),
        hintSource: settingsHint,
        helpSource: mergeBindingSources(settingsHelpKeys, quitHelpKeys),
      },
      help: {
        title: frameMessage(options.i18n, 'help.title', 'Keyboard Help'),
        hintSource: helpHint,
        helpSource: helpLayerHelpKeys,
      },
      'notification-center': {
        title: notificationsTitle,
        hintSource: notificationsHint,
        helpSource: mergeBindingSources(notificationCenterHelpKeys, quitHelpKeys),
      },
      search: {
        title: searchTitle,
        hintSource: paletteHint,
        helpSource: mergeBindingSources(paletteKeys, quitHelpKeys),
      },
      'command-palette': {
        title: paletteTitle,
        hintSource: paletteHint,
        helpSource: mergeBindingSources(paletteKeys, quitHelpKeys),
      },
      'quit-confirm': {
        title: frameMessage(options.i18n, 'quit.title', 'Quit?'),
        hintSource: quitHint,
        helpSource: quitConfirmHelpKeys,
      },
    };
  }

  function resolvePresentedLayerContext(
    model: InternalFrameModel<PageModel, Msg>,
  ) {
    const {
      activePage,
      activePageModel,
      inputAreas,
      activeInputArea,
      modalKeyMap,
      pageModalOpen,
    } = resolveLayerContext(model);
    const layerStack = describeFrameLayerStack(model, {
      pageModalOpen,
      layers: resolveLayerMetadata(
        model,
        activePage,
        activeInputArea,
        modalKeyMap,
      ),
    });
    const activeLayer = layerStack[layerStack.length - 1]!;
    const underlyingLayer = layerStack.length > 1 ? layerStack[layerStack.length - 2] : undefined;
    return {
      activePage,
      activePageModel,
      inputAreas,
      activeInputArea,
      modalKeyMap,
      pageModalOpen,
      layerStack,
      activeLayer,
      underlyingLayer,
    };
  }

  function updateTargetPage(
    model: InternalFrameModel<PageModel, Msg>,
    targetPageId: string,
    targetMsg: FramePageMsg<Msg>,
  ): [InternalFrameModel<PageModel, Msg>, Cmd<FramedAppMsg<Msg>>[]] {
    const targetPage = pagesById.get(targetPageId);
    if (targetPage == null) return [model, []];

    const pageModel = model.pageModels[targetPageId]!;
    const updateResult = targetPage.update(targetMsg, pageModel);
    const [nextPageModel, cmds = []] = updateResult;

    const nextModels = { ...model.pageModels, [targetPageId]: nextPageModel };
    const synced = syncPageFrameState({ ...model, pageModels: nextModels }, targetPageId, pagesById);
    const wrappedCmds = cmds.map((cmd) => wrapCmdForPage(targetPageId, cmd));
    return [synced, wrappedCmds];
  }

  function handleFrameMouse(
    msg: MouseMsg,
    model: InternalFrameModel<PageModel, Msg>,
  ): [InternalFrameModel<PageModel, Msg>, Cmd<FramedAppMsg<Msg>>[]] | undefined {
    const {
      activePage,
      activePageModel,
      inputAreas,
      routedLayer,
      routedHit,
    } = resolveRoutedMouseLayer(msg, model);

    if (routedLayer.kind === 'help') {
      if (msg.action === 'scroll-up' || msg.action === 'scroll-down') {
        return [applyHelpScroll(model, activePage, msg.action === 'scroll-down' ? 3 : -3, frameKeys, paletteKeys, options, pagesById), []];
      }
      return [model, []];
    }

    if (routedLayer.kind === 'search' || routedLayer.kind === 'command-palette') {
      return [model, []];
    }

    if (routedLayer.kind === 'quit-confirm' || routedLayer.kind === 'page-modal') {
      return [model, []];
    }

    if (routedLayer.kind === 'settings') {
        const layout = resolveSettingsLayout(model, options, pagesById);
        if (layout != null) {
          const insideDrawer = routedHit?.viewId === 'settings';
          if (msg.action === 'scroll-up' || msg.action === 'scroll-down') {
            if (insideDrawer) {
              return [
                scrollSettingsBy(model, layout, msg.action === 'scroll-down' ? 3 : -3),
                [],
              ];
            }
            return [model, []];
          }

          if (msg.action === 'press' && msg.button === 'left') {
            if (!insideDrawer) {
              return [model, []];
            }
            const rowNode = routedHit?.path.find((n) => n.id?.startsWith('settings-row:'));
            if (rowNode == null) return [model, []];
            const rowIndex = parseInt(rowNode.id!.slice('settings-row:'.length), 10);
            const hitRow = layout.rows.find((r) => r.index === rowIndex);
            if (hitRow == null) return [model, []];
            const focusedModel = { ...model, settingsFocusIndex: hitRow.index };
            if (hitRow.row.action === undefined || hitRow.row.enabled === false || hitRow.row.kind === 'info') {
              return [focusedModel, []];
            }
            return activateSettingsRow(focusedModel, hitRow.row);
          }

          return [model, []];
        }
    }

    if (routedLayer.kind === 'notification-center') {
        const layout = resolveNotificationCenterLayout(model, options, pagesById);
        if (layout != null) {
          const insideDrawer = routedHit?.viewId === 'notification-center';
          if (msg.action === 'scroll-up' || msg.action === 'scroll-down') {
            if (insideDrawer) {
              return [
                scrollNotificationCenterBy(model, layout, msg.action === 'scroll-down' ? 3 : -3),
                [],
              ];
            }
            return [model, []];
          }

          if (msg.action === 'press' && msg.button === 'left') {
            return [model, []];
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

      const tabNode = routedHit?.path.find((n) => n.id?.startsWith('tab:'));
      if (tabNode != null) {
        const pageId = tabNode.id!.slice('tab:'.length);
        const currentIndex = model.pageOrder.indexOf(model.activePageId);
        const nextIndex = model.pageOrder.indexOf(pageId);
        if (currentIndex >= 0 && nextIndex >= 0 && nextIndex !== currentIndex) {
          return switchTab(model, nextIndex - currentIndex, pagesById, options);
        }
        return [model, []];
      }
      if (msg.row === 0) {
        return [model, []];
      }

      const clickedPaneNode = routedHit?.path.find((n) => n.id?.startsWith('pane:'));
      if (clickedPaneNode != null) {
        const paneId = clickedPaneNode.id!.slice('pane:'.length);
        const paneRects = resolveWorkspacePaneRects(model);
        const paneRect = paneRects.get(paneId);
        if (paneRect != null) {
          const focusedModel = focusPane(model, paneId);
          const inputArea = findInputAreaByPaneId(inputAreas, paneId);
          const areaMsg = inputArea?.mouse?.({
            msg,
            model: activePageModel,
            rect: paneRect,
          });
          if (areaMsg !== undefined) {
            return [focusedModel, [emitMsgForPage(model.activePageId, areaMsg)]];
          }
          return [focusedModel, [emitMsgForPage<Msg>(model.activePageId, msg)]];
        }
      }
    }

    if (msg.action === 'scroll-up' || msg.action === 'scroll-down') {
      const scrollPaneNode = routedHit?.path.find((n) => n.id?.startsWith('pane:'));
      if (scrollPaneNode != null) {
        const paneId = scrollPaneNode.id!.slice('pane:'.length);
        const paneRects = resolveWorkspacePaneRects(model);
        const paneRect = paneRects.get(paneId);
        if (paneRect != null) {
          const focusedModel = focusPane(model, paneId);
          const inputArea = findInputAreaByPaneId(inputAreas, paneId);
          const areaMsg = inputArea?.mouse?.({
            msg,
            model: activePageModel,
            rect: paneRect,
          });
          if (areaMsg !== undefined) {
            return [focusedModel, [emitMsgForPage(model.activePageId, areaMsg)]];
          }
          const action: FrameAction = msg.action === 'scroll-down'
            ? { type: 'scroll-down' }
            : { type: 'scroll-up' };
          return [scrollFocusedPane(focusedModel, action, pagesById, options), []];
        }
      }
    }

    return undefined;
  }

  function applyFrameNotificationState(
    model: InternalFrameModel<PageModel, Msg>,
    notifications: NotificationState<never>,
    nowMs: number,
    forceTick = false,
  ): [InternalFrameModel<PageModel, Msg>, Cmd<FramedAppMsg<Msg>>[]] {
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

  function activateSettingsRow(
    model: InternalFrameModel<PageModel, Msg>,
    row: FrameSettingRow<Msg>,
  ): [InternalFrameModel<PageModel, Msg>, Cmd<FramedAppMsg<Msg>>[]] {
    if (row.action === undefined || row.enabled === false || row.kind === 'info') {
      return [model, []];
    }

    const cmds: Cmd<FramedAppMsg<Msg>>[] = [emitMsgForPage(model.activePageId, row.action)];
    if (!frameNotificationOptions.enabled) {
      return [model, cmds];
    }

    const feedback = row.feedback ?? {
      title: 'Setting updated',
      message: `${row.label} updated.`,
    };
    const nowMs = resolveClock(resolveSafeCtx()).now();
    const notifications = pushNotification(model.runtimeNotifications, {
      title: feedback.title ?? 'Setting updated',
      message: feedback.message,
      variant: 'TOAST',
      tone: feedback.tone ?? 'INFO',
      width: SETTINGS_FEEDBACK_TOAST_WIDTH,
      placement: frameNotificationOptions.placement,
      durationMs: feedback.durationMs ?? 2_500,
      overflow: frameNotificationOptions.overflow,
    }, nowMs);
    const [nextModel, notificationCmds] = applyFrameNotificationState(model, notifications, nowMs);
    return [nextModel, [...cmds, ...notificationCmds]];
  }

  const app: App<InternalFrameModel<PageModel, Msg>, FramedAppMsg<Msg>> = {
    init() {
      const pageModels: Record<string, PageModel> = {};
      const initCmds: Cmd<FramedAppMsg<Msg>>[] = [];

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
        commandPaletteKind: undefined,
        settingsOpen: false,
        notificationCenterOpen: false,
        quitConfirmOpen: false,
        settingsFocusIndex: 0,
        settingsScrollY: 0,
        notificationCenterScrollY: 0,
        transitionProgress: 1,
        transitionGeneration: 0,
        transitionFrame: 0,
        minimizedByPage: {},
        maximizedPaneByPage: {},
        dockStateByPage: {},
        splitRatioOverrides: {},
        runtimeNotifications: createNotificationState(),
        runtimeNotificationHistoryFilter: 'ALL',
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
        const {
          activePage,
          activeInputArea,
          modalKeyMap,
          routedLayer,
        } = resolveRoutedKeyLayer(msg, model);

        if (routedLayer.kind === 'search' || routedLayer.kind === 'command-palette') {
          if (msg.ctrl && !msg.alt && msg.key === 'c') {
            return applyQuitRequest(model, msg);
          }
          if (!msg.ctrl && !msg.alt && !msg.shift && msg.key === 'escape') {
            return [closeCommandPalette(model), withObservedKey(model, [], msg, 'palette')];
          }
          const frameAction = frameKeys.handle(msg);
          if (frameAction?.type === 'open-search') {
            if (routedLayer.kind === 'search') {
              return [closeCommandPalette(model), withObservedKey(model, [], msg, 'palette')];
            }
            return [openSearchPalette(model, frameKeys, options, pagesById), withObservedKey(model, [], msg, 'palette')];
          }
          if (frameAction?.type === 'open-palette') {
            if (routedLayer.kind === 'command-palette') {
              return [closeCommandPalette(model), withObservedKey(model, [], msg, 'palette')];
            }
            return [openCommandPalette(model, frameKeys, options, pagesById), withObservedKey(model, [], msg, 'palette')];
          }
          if (frameAction?.type === 'toggle-notifications') {
            const [nextModel, cmds] = applyFrameAction(frameAction, closeCommandPalette(model), options, pagesById);
            return [nextModel, withObservedKey(model, cmds, msg, 'palette')];
          }
          const [nextModel, cmds] = handlePaletteKey(msg, model, paletteKeys, options, pagesById);
          return [nextModel, withObservedKey(model, cmds, msg, 'palette')];
        }

        if (routedLayer.kind === 'help') {
          if (!msg.ctrl && !msg.alt && (msg.key === '?' || msg.key === 'escape')) {
            return [{ ...model, helpOpen: false, helpScrollY: 0 }, withObservedKey(model, [], msg, 'help')];
          }
          if (isShellQuitRequest(msg)) {
            return applyQuitRequest(model, msg);
          }
          const helpAction = frameKeys.handle(msg);
          if (helpAction && isHelpScrollAction(helpAction)) {
            return [
              applyHelpScrollAction(model, activePage, helpAction, frameKeys, paletteKeys, options, pagesById),
              withObservedKey(model, [], msg, 'help'),
            ];
          }
          return [model, withObservedKey(model, [], msg, 'help')];
        }

        if (routedLayer.kind === 'settings') {
          const layout = resolveSettingsLayout(model, options, pagesById);
          if (layout != null) {
            const settingsFrameAction = frameKeys.handle(msg);
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
            if (isShellQuitRequest(msg)) {
              return applyQuitRequest(model, msg);
            }
            if (options.enableCommandPalette && !msg.ctrl && !msg.alt && msg.key === '/') {
              return [openSearchPalette(model, frameKeys, options, pagesById), withObservedKey(model, [], msg, 'frame')];
            }
            if (options.enableCommandPalette && ((msg.ctrl && !msg.alt && msg.key === 'p') || (!msg.ctrl && !msg.alt && msg.key === ':'))) {
              return [openCommandPalette(model, frameKeys, options, pagesById), withObservedKey(model, [], msg, 'frame')];
            }
            if (settingsFrameAction?.type === 'toggle-notifications') {
              const [nextModel, cmds] = applyFrameAction(settingsFrameAction, model, options, pagesById);
              return [nextModel, withObservedKey(model, cmds, msg, 'frame')];
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
                const [nextModel, cmds] = activateSettingsRow(model, row);
                return [nextModel, withObservedKey(model, cmds, msg, 'frame')];
              }
              return [model, withObservedKey(model, [], msg, 'frame')];
            }
            return [model, withObservedKey(model, [], msg, 'frame')];
          }
        }

        if (routedLayer.kind === 'notification-center') {
          const layout = resolveNotificationCenterLayout(model, options, pagesById);
          if (layout != null) {
            const centerFrameAction = frameKeys.handle(msg);
            if (!msg.ctrl && !msg.alt && msg.key === 'escape') {
              return [{
                ...model,
                notificationCenterOpen: false,
                notificationCenterScrollY: 0,
              }, withObservedKey(model, [], msg, 'frame')];
            }
            if (isShellQuitRequest(msg)) {
              return applyQuitRequest(model, msg);
            }
            if (centerFrameAction?.type === 'toggle-notifications') {
              const [nextModel, cmds] = applyFrameAction(centerFrameAction, model, options, pagesById);
              return [nextModel, withObservedKey(model, cmds, msg, 'frame')];
            }
            if (!msg.ctrl && !msg.alt && msg.key === 'f2') {
              const [nextModel, cmds] = applyFrameAction({ type: 'toggle-settings' }, model, options, pagesById);
              return [nextModel, withObservedKey(model, cmds, msg, 'frame')];
            }
            if (!msg.ctrl && !msg.alt && msg.key === '?') {
              return [{
                ...model,
                helpOpen: true,
                notificationCenterOpen: false,
                notificationCenterScrollY: 0,
              }, withObservedKey(model, [], msg, 'frame')];
            }
            if (options.enableCommandPalette && !msg.ctrl && !msg.alt && msg.key === '/') {
              return [openSearchPalette({
                ...model,
                notificationCenterOpen: false,
                notificationCenterScrollY: 0,
              }, frameKeys, options, pagesById), withObservedKey(model, [], msg, 'frame')];
            }
            if (options.enableCommandPalette && ((msg.ctrl && !msg.alt && msg.key === 'p') || (!msg.ctrl && !msg.alt && msg.key === ':'))) {
              return [openCommandPalette({
                ...model,
                notificationCenterOpen: false,
                notificationCenterScrollY: 0,
              }, frameKeys, options, pagesById), withObservedKey(model, [], msg, 'frame')];
            }
            if (!msg.ctrl && !msg.alt && (msg.key === 'up' || msg.key === 'k')) {
              return [scrollNotificationCenterBy(model, layout, -1), withObservedKey(model, [], msg, 'frame')];
            }
            if (!msg.ctrl && !msg.alt && (msg.key === 'down' || msg.key === 'j')) {
              return [scrollNotificationCenterBy(model, layout, 1), withObservedKey(model, [], msg, 'frame')];
            }
            if (!msg.ctrl && !msg.alt && msg.key === 'd') {
              return [scrollNotificationCenterBy(model, layout, Math.max(1, layout.contentHeight - 2)), withObservedKey(model, [], msg, 'frame')];
            }
            if (!msg.ctrl && !msg.alt && msg.key === 'u') {
              return [scrollNotificationCenterBy(model, layout, -Math.max(1, layout.contentHeight - 2)), withObservedKey(model, [], msg, 'frame')];
            }
            if (!msg.ctrl && !msg.alt && msg.key === 'g') {
              return [{ ...model, notificationCenterScrollY: 0 }, withObservedKey(model, [], msg, 'frame')];
            }
            if (!msg.ctrl && !msg.alt && msg.key === 'G') {
              return [{ ...model, notificationCenterScrollY: layout.maxScrollY }, withObservedKey(model, [], msg, 'frame')];
            }
            if (!msg.ctrl && !msg.alt && msg.key === 'f') {
              const [nextModel, cmds] = cycleNotificationCenterFilter(model, layout);
              return [nextModel, withObservedKey(model, cmds, msg, 'frame')];
            }
            return [model, withObservedKey(model, [], msg, 'frame')];
          }
        }

        if (routedLayer.kind === 'quit-confirm') {
          if (isShellQuitConfirmAccept(msg)) {
            return [{
              ...model,
              quitConfirmOpen: false,
            }, withObservedKey(model, [quit()], msg, 'frame')];
          }
          if (isShellQuitConfirmDismiss(msg)) {
            return [{
              ...model,
              quitConfirmOpen: false,
            }, withObservedKey(model, [], msg, 'frame')];
          }
          return [model, withObservedKey(model, [], msg, 'frame')];
        }

        if (routedLayer.kind === 'page-modal' && modalKeyMap != null) {
          const modalAction = modalKeyMap.handle(msg);
          if (modalAction !== undefined) {
            return [model, withObservedKey(model, [emitMsgForPage(model.activePageId, modalAction)], msg, 'page')];
          }
          return [model, withObservedKey(model, [], msg, 'page')];
        }

        if (isShellQuitRequest(msg)) {
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
            if (frameAction.type === 'open-search' && options.enableCommandPalette) {
              return [openSearchPalette(model, frameKeys, options, pagesById), withObservedKey(model, [], msg, 'frame')];
            }
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
          if (frameAction.type === 'open-search' && options.enableCommandPalette) {
            return [openSearchPalette(model, frameKeys, options, pagesById), withObservedKey(model, [], msg, 'frame')];
          }
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
        return updateTargetPage(model, model.activePageId, msg);
      }

      // Custom message path: route to originating page when command messages are scoped.
      if (isPageScopedMsg<Msg>(msg)) {
        return updateTargetPage(model, msg.pageId, msg.msg);
      }
      return updateTargetPage(model, model.activePageId, msg);
    },

    view(model) {
      const {
        activePage,
        layerStack,
        activeLayer,
      } = resolvePresentedLayerContext(model);
      const header = resolveHeaderLine(model, options, pagesById).surface;
      const helpLine = renderHelpLine(
        model,
        activeLayer,
        options.i18n,
        resolveNotificationFooterCue(model, options, pagesById),
      );
      const bodyRect = resolveBodyRect(model, options);

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

      if (model.settingsOpen) {
        const settingsLayer = layerStack.find((layer) => layer.kind === 'settings');
        const settingsOverlay = renderSettingsDrawer(
          model,
          options,
          pagesById,
          settingsLayer?.title,
        );
        if (settingsOverlay != null) {
          overlays.push(settingsOverlay);
        }
      }

      if (model.notificationCenterOpen) {
        const notificationLayer = layerStack.find((layer) => layer.kind === 'notification-center');
        const notificationCenterOverlay = renderNotificationCenterDrawer(
          model,
          options,
          pagesById,
          notificationLayer?.title,
        );
        if (notificationCenterOverlay != null) {
          overlays.push(notificationCenterOverlay);
        }
      }

      if (model.helpOpen) {
        const helpOverlay = renderHelpOverlay(model, activePage, frameKeys, paletteKeys, options, pagesById);
        overlays.push(modal({
          title: activeLayer.kind === 'help'
            ? (activeLayer.title ?? frameMessage(options.i18n, 'help.title', 'Keyboard Help'))
            : frameMessage(options.i18n, 'help.title', 'Keyboard Help'),
          body: helpOverlay.body,
          hint: typeof activeLayer.hintSource === 'string'
            ? activeLayer.hintSource
            : frameMessage(options.i18n, 'help.hint', 'j/k scroll • d/u page • g/G top/bottom • mouse wheel • ?/Esc close'),
          width: helpOverlay.body.width + 4,
          screenWidth: model.columns,
          screenHeight: model.rows,
        }));
      }

      if (model.commandPalette != null) {
        const paletteWidth = Math.max(20, Math.min(80, model.columns - 4));
        const paletteBody = commandPalette(model.commandPalette, { width: Math.max(16, paletteWidth - 4) });
        const paletteLayer = activeLayer.kind === 'search' || activeLayer.kind === 'command-palette'
          ? activeLayer
          : undefined;
        overlays.push(modal({
          title: paletteLayer?.title ?? model.commandPaletteTitle ?? frameMessage(options.i18n, 'palette.title', 'Command Palette'),
          body: paletteBody,
          hint: typeof paletteLayer?.hintSource === 'string'
            ? paletteLayer.hintSource
            : frameMessage(options.i18n, 'palette.hint', 'Enter select • Esc close'),
          width: paletteWidth,
          screenWidth: model.columns,
          screenHeight: model.rows,
        }));
      }

      if (model.quitConfirmOpen) {
        overlays.push(renderShellQuitOverlay(model.columns, model.rows, options.i18n));
      }

      if (bodySurface != null && bodyRect.width > 0 && bodyRect.height > 0) {
        frameSurface.blit(bodySurface, bodyRect.col, bodyRect.row);
      }

      return compositeSurfaceInto(frameSurface, frameSurface, overlays, { dim: overlays.length > 0 });
    },

    routeRuntimeIssue(issue) {
      if (!frameNotificationOptions.enabled) return undefined;
      return wrapFrameMsg({ type: 'runtime-issue', issue });
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

function resolveBodyRect<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  options: CreateFramedAppOptions<PageModel, Msg>,
): LayoutRect {
  return frameBodyRect(
    model.columns,
    model.rows,
    options.bodyTopRows ?? 1,
    options.bodyBottomRows ?? 1,
  );
}

function renderHelpOverlay<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  activePage: FramePage<PageModel, Msg>,
  frameKeys: KeyMap<FrameAction>,
  paletteKeys: KeyMap<PaletteAction>,
  options: CreateFramedAppOptions<PageModel, Msg>,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
): { body: Surface; maxScrollY: number; scrollY: number } {
  const activePageModel = model.pageModels[model.activePageId]!;
  const activeInputArea = findInputAreaByPaneId(
    resolveInputAreas(activePage, activePageModel),
    model.focusedPaneByPage[model.activePageId],
  );
  const modalKeyMap = activePage.modalKeyMap?.(activePageModel);
  const settings = resolveFrameSettings(model, options, pagesById);
  const notificationCenter = resolveFrameNotificationCenter(model, options, pagesById);
  const workspaceHintSource = options.helpLineSource?.({
    model,
    activePage,
    frameKeys,
    globalKeys: options.globalKeys,
  });
  const workspaceHelpSource = mergeBindingSources(
    frameKeys,
    quitHelpKeys,
    options.globalKeys,
    activeInputArea?.helpSource ?? activeInputArea?.keyMap,
    activePage.helpSource ?? activePage.keyMap,
  );
  const layerStack = describeFrameLayerStack(model, {
    pageModalOpen: modalKeyMap != null,
    layers: {
      workspace: {
        title: activePage.title,
        hintSource: typeof workspaceHintSource === 'string'
          ? workspaceHintSource
          : workspaceHintSource ?? mergeBindingSources(
            frameKeys,
            options.globalKeys,
            activeInputArea?.helpSource ?? activeInputArea?.keyMap,
            activePage.helpSource ?? activePage.keyMap,
          ),
        helpSource: workspaceHelpSource,
      },
      'page-modal': {
        title: activePage.title,
        hintSource: modalKeyMap ?? activePage.helpSource ?? activePage.keyMap,
        helpSource: mergeBindingSources(
          quitHelpKeys,
          modalKeyMap,
          activePage.helpSource ?? activePage.keyMap,
        ),
      },
      settings: {
        title: settings?.title ?? frameMessage(options.i18n, 'settings.title', 'Settings'),
        hintSource: frameMessage(options.i18n, 'settings.footer', 'F2/Esc close • ↑/↓ rows • Enter toggle • / search • q quit'),
        helpSource: mergeBindingSources(settingsHelpKeys, quitHelpKeys),
      },
      help: {
        title: frameMessage(options.i18n, 'help.title', 'Keyboard Help'),
        hintSource: frameMessage(options.i18n, 'help.hint', 'j/k scroll • d/u page • g/G top/bottom • mouse wheel • ?/Esc close'),
        helpSource: helpLayerHelpKeys,
      },
      'notification-center': {
        title: notificationCenter == null
          ? frameMessage(options.i18n, 'notifications.title', 'Notifications')
          : `${notificationCenter.title} • ${frameNotificationFilterLabel(options.i18n, notificationCenter.activeFilter)}`,
        hintSource: frameMessage(options.i18n, 'notifications.footer', 'Shift+N close • f filter • j/k scroll • q quit'),
        helpSource: mergeBindingSources(notificationCenterHelpKeys, quitHelpKeys),
      },
      search: {
        title: model.commandPaletteTitle ?? activePage.searchTitle ?? frameMessage(options.i18n, 'search.title', 'Search'),
        hintSource: frameMessage(options.i18n, 'palette.hint', 'Enter select • Esc close'),
        helpSource: mergeBindingSources(paletteKeys, quitHelpKeys),
      },
      'command-palette': {
        title: model.commandPaletteTitle ?? frameMessage(options.i18n, 'palette.title', 'Command Palette'),
        hintSource: frameMessage(options.i18n, 'palette.hint', 'Enter select • Esc close'),
        helpSource: mergeBindingSources(paletteKeys, quitHelpKeys),
      },
      'quit-confirm': {
        title: frameMessage(options.i18n, 'quit.title', 'Quit?'),
        hintSource: frameMessage(options.i18n, 'quit.footer', 'Y quit • N stay'),
        helpSource: quitConfirmHelpKeys,
      },
    },
  });
  const beneathHelpLayer = layerStack.length > 1 ? layerStack[layerStack.length - 2] : undefined;
  const source = beneathHelpLayer?.helpSource ?? workspaceHelpSource;
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
  paletteKeys: KeyMap<PaletteAction>,
  options: CreateFramedAppOptions<PageModel, Msg>,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
): InternalFrameModel<PageModel, Msg> {
  const overlay = renderHelpOverlay(model, activePage, frameKeys, paletteKeys, options, pagesById);
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
  paletteKeys: KeyMap<PaletteAction>,
  options: CreateFramedAppOptions<PageModel, Msg>,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
): InternalFrameModel<PageModel, Msg> {
  const overlay = renderHelpOverlay(model, activePage, frameKeys, paletteKeys, options, pagesById);
  return {
    ...model,
    helpScrollY: Math.max(0, Math.min(overlay.maxScrollY, overlay.scrollY + delta)),
  };
}

interface FlatSettingsRow<Msg> {
  readonly index: number;
  readonly line: number;
  readonly height: number;
  readonly row: FrameSettingRow<Msg>;
}

interface ResolvedSettingsLayout<Msg> {
  readonly settings: FrameSettings<Msg>;
  readonly preferenceSections: readonly PreparedPreferenceSection[];
  readonly rows: readonly FlatSettingsRow<Msg>[];
  readonly anchor: 'left' | 'right';
  readonly startCol: number;
  readonly drawerWidth: number;
  readonly contentWidth: number;
  readonly contentHeight: number;
  readonly totalLines: number;
  readonly maxScrollY: number;
}

interface ResolvedFrameNotificationCenter<Msg> {
  readonly title: string;
  readonly state: NotificationState<Msg>;
  readonly filters: readonly NotificationHistoryFilter[];
  readonly activeFilter: NotificationHistoryFilter;
  readonly onFilterChange?: (filter: NotificationHistoryFilter) => Msg | undefined;
}

interface ResolvedNotificationCenterLayout<Msg> {
  readonly center: ResolvedFrameNotificationCenter<Msg>;
  readonly anchor: 'left' | 'right';
  readonly startCol: number;
  readonly drawerWidth: number;
  readonly contentWidth: number;
  readonly contentHeight: number;
  readonly content: Surface;
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

function resolveFrameNotificationCenter<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  options: CreateFramedAppOptions<PageModel, Msg>,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
): ResolvedFrameNotificationCenter<Msg> | undefined {
  const activePage = pagesById.get(model.activePageId)!;
  const pageModel = model.pageModels[model.activePageId]!;
  const provided = options.notificationCenter?.({
    model,
    activePage,
    pageModel,
    runtimeNotifications: model.runtimeNotifications,
  });

  if (provided != null) {
    const filters = provided.filters != null && provided.filters.length > 0
      ? provided.filters
      : DEFAULT_NOTIFICATION_CENTER_FILTERS;
    const activeFilter = filters.includes(provided.activeFilter ?? 'ALL')
      ? (provided.activeFilter ?? 'ALL')
      : filters[0]!;
    return {
      title: provided.title ?? frameMessage(options.i18n, 'notifications.title', 'Notifications'),
      state: provided.state,
      filters,
      activeFilter,
      onFilterChange: provided.onFilterChange,
    };
  }

  if (options.runtimeNotifications === false) return undefined;

  return {
    title: frameMessage(options.i18n, 'notifications.title', 'Notifications'),
    state: model.runtimeNotifications as NotificationState<Msg>,
    filters: DEFAULT_NOTIFICATION_CENTER_FILTERS,
    activeFilter: model.runtimeNotificationHistoryFilter,
  };
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

  const drawerWidth = resolveSettingsDrawerWidth(model.columns);
  const anchor = frameStartAnchor(options.i18n);
  const startCol = anchor === 'left' ? 0 : Math.max(0, model.columns - drawerWidth);
  const contentWidth = Math.max(16, drawerWidth - 4);
  const preferenceSections = preparePreferenceSections(toPreferenceSections(sections));
  const rows: FlatSettingsRow<Msg>[] = [];
  let line = 0;

  for (let sectionIndex = 0; sectionIndex < preferenceSections.length; sectionIndex++) {
    const section = preferenceSections[sectionIndex]!;
    if (sectionIndex > 0) {
      line += 1;
    }
    line += 1;
    line += 1;
    for (let rowIndex = 0; rowIndex < section.rows.length; rowIndex++) {
      const preparedRow = section.rows[rowIndex]!;
      const row = sections[sectionIndex]!.rows[rowIndex]!;
      const rowLayout = resolvePreferenceRowLayout(preparedRow, contentWidth);
      rows.push({
        index: rows.length,
        line,
        height: rowLayout.height,
        row,
      });
      line += rowLayout.height;
      if (rowIndex < section.rows.length - 1) {
        line += 1;
      }
    }
  }

  const contentHeight = Math.max(1, model.rows - 2);
  const totalLines = Math.max(1, line);
  const maxScrollY = Math.max(0, totalLines - contentHeight);

  return {
    settings: {
      ...settings,
      sections,
    },
    preferenceSections,
    rows,
    anchor,
    startCol,
    drawerWidth,
    contentWidth,
    contentHeight,
    totalLines,
    maxScrollY,
  };
}

function resolveNotificationCenterDrawerWidth(columns: number): number {
  const boundedColumns = Math.max(28, columns);
  return Math.min(Math.max(32, Math.floor(boundedColumns * 0.34)), Math.max(32, boundedColumns - 4), 52);
}

function resolveNotificationCenterLayout<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  options: CreateFramedAppOptions<PageModel, Msg>,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
): ResolvedNotificationCenterLayout<Msg> | undefined {
  const center = resolveFrameNotificationCenter(model, options, pagesById);
  if (center == null) return undefined;

  const drawerWidth = resolveNotificationCenterDrawerWidth(model.columns);
  const anchor = frameEndAnchor(options.i18n);
  const startCol = anchor === 'left' ? 0 : Math.max(0, model.columns - drawerWidth);
  const contentWidth = Math.max(18, drawerWidth - 4);
  const content = renderNotificationCenterSurface(center, contentWidth, options.i18n);
  const contentHeight = Math.max(1, model.rows - 2);
  const pagerState = createPagerStateForSurface(content, {
    width: contentWidth,
    height: contentHeight,
  });

  return {
    center,
    anchor,
    startCol,
    drawerWidth,
    contentWidth,
    contentHeight,
    content,
    maxScrollY: pagerState.scroll.maxY,
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

function ensureSettingsRangeVisible(
  startLine: number,
  height: number,
  scrollY: number,
  visibleLines: number,
  maxScrollY: number,
): number {
  let next = scrollY;
  const endLine = startLine + Math.max(1, height) - 1;
  if (startLine < next) {
    next = startLine;
  } else if (endLine >= next + visibleLines) {
    next = endLine - visibleLines + 1;
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
  const focusedRow = layout.rows[nextFocus]!;
  return {
    ...model,
    settingsFocusIndex: nextFocus,
    settingsScrollY: ensureSettingsRangeVisible(
      focusedRow.line,
      focusedRow.height,
      clampSettingsScroll(model, layout),
      layout.contentHeight,
      layout.maxScrollY,
    ),
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

function scrollNotificationCenterBy<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  layout: ResolvedNotificationCenterLayout<Msg>,
  delta: number,
): InternalFrameModel<PageModel, Msg> {
  return {
    ...model,
    notificationCenterScrollY: Math.max(0, Math.min(model.notificationCenterScrollY + delta, layout.maxScrollY)),
  };
}

function cycleNotificationCenterFilter<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  layout: ResolvedNotificationCenterLayout<Msg>,
): [InternalFrameModel<PageModel, Msg>, Cmd<FramedAppMsg<Msg>>[]] {
  const filters = layout.center.filters;
  if (filters.length < 2) return [model, []];
  const currentIndex = Math.max(0, filters.indexOf(layout.center.activeFilter));
  const nextFilter = filters[(currentIndex + 1) % filters.length]!;
  if (layout.center.onFilterChange != null) {
    const action = layout.center.onFilterChange(nextFilter);
    return [{
      ...model,
      notificationCenterScrollY: 0,
    }, action === undefined ? [] : [emitMsgForPage(model.activePageId, action)]];
  }
  return [{
    ...model,
    runtimeNotificationHistoryFilter: nextFilter,
    notificationCenterScrollY: 0,
  }, []];
}

function renderSettingsDrawer<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  options: CreateFramedAppOptions<PageModel, Msg>,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
  titleOverride?: string,
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
    anchor: layout.anchor,
    title: titleOverride ?? layout.settings.title ?? frameMessage(options.i18n, 'settings.title', 'Settings'),
    content: body,
    borderToken: layout.settings.borderToken,
    bgToken: layout.settings.bgToken,
    ctx: resolveSafeCtx() ?? undefined,
    width: layout.drawerWidth,
    screenWidth: model.columns,
    screenHeight: model.rows,
  });
}

function renderNotificationCenterDrawer<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  options: CreateFramedAppOptions<PageModel, Msg>,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
  titleOverride?: string,
): Overlay | undefined {
  const layout = resolveNotificationCenterLayout(model, options, pagesById);
  if (layout == null) return undefined;

  const pagerState = createPagerStateForSurface(layout.content, {
    width: layout.contentWidth,
    height: layout.contentHeight,
  });
  const scrolledState = {
    ...pagerState,
    scroll: {
      ...pagerState.scroll,
      y: Math.max(0, Math.min(model.notificationCenterScrollY, layout.maxScrollY)),
    },
  };
  const body = pagerSurface(layout.content, scrolledState, {
    showScrollbar: layout.maxScrollY > 0,
    showStatus: false,
  });

  return drawer({
    anchor: layout.anchor,
    title: titleOverride ?? `${layout.center.title} • ${frameNotificationFilterLabel(options.i18n, layout.center.activeFilter)}`,
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
  const focusedIndex = clampSettingsFocus(model, layout);
  return preferenceListSurface(layout.preferenceSections, {
    width: layout.contentWidth,
    selectedRowId: layout.rows[focusedIndex]?.row.id,
    ctx: resolveSafeCtx() ?? undefined,
    theme: layout.settings.listTheme,
  });
}

function toPreferenceSections<Msg>(
  sections: readonly FrameSettingSection<Msg>[],
): readonly PreferenceSection[] {
  return sections.map((section) => ({
    id: section.id,
    title: section.title,
    rows: section.rows.map((row) => toPreferenceRow(row)),
  }));
}

function toPreferenceRow<Msg>(row: FrameSettingRow<Msg>): PreferenceRow {
  return {
    id: row.id,
    label: row.label,
    description: row.description,
    valueLabel: row.valueLabel,
    kind: row.kind,
    checked: row.checked,
    enabled: row.enabled,
  };
}

function resolveNotificationFooterCue<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  options: CreateFramedAppOptions<PageModel, Msg>,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
): string | undefined {
  const center = resolveFrameNotificationCenter(model, options, pagesById);
  if (center == null) return undefined;
  const liveCount = center.state.items.length;
  const archivedCount = countNotificationHistory(center.state, center.activeFilter);
  return frameNotificationCue(options.i18n, liveCount, archivedCount);
}

function renderNotificationCenterSurface<Msg>(
  center: ResolvedFrameNotificationCenter<Msg>,
  width: number,
  i18n?: I18nRuntime,
): Surface {
  const ctx = resolveSafeCtx() ?? undefined;
  const rows: Surface[] = [
    insetLineSurface(`Live: ${center.state.items.length} • Archived: ${center.state.history.length}`, width),
    insetLineSurface(`Filter: ${frameNotificationFilterLabel(i18n, center.activeFilter)}`, width),
  ];

  const liveItems = [...center.state.items].sort(
    (left, right) => right.updatedAtMs - left.updatedAtMs || right.id - left.id,
  );

  if (liveItems.length > 0) {
    rows.push(createSurface(width, 1));
    rows.push(insetLineSurface(
      ctx == null ? 'Current stack' : ctx.style.bold('Current stack'),
      width,
    ));
    rows.push(createSurface(width, 1));
    for (let index = 0; index < liveItems.length; index++) {
      rows.push(renderNotificationReviewEntrySurface(liveItems[index]!, {
        width,
        ctx,
        metaLabel: `${liveItems[index]!.variant} • live`,
      }));
      if (index < liveItems.length - 1) rows.push(createSurface(width, 1));
    }
  }

  rows.push(createSurface(width, 1));
  rows.push(renderNotificationHistorySurface(center.state, {
    width,
    height: Number.MAX_SAFE_INTEGER,
    filter: center.activeFilter,
    ctx,
  }));

  return vstackSurface(...rows);
}
