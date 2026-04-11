/**
 * `appFrame()` — high-level TEA app shell.
 *
 * Provides tabs, pane focus/scroll isolation, shell key handling, help,
 * panel-scoped overlay context, and optional frame-level command palette.
 */

import {
  createResolved,
  createSurface,
  createThemeAccessors,
  type LayoutNode as SurfaceLayoutNode,
  preparePreferenceSections,
  preferenceListSurface,
  type PreferenceListTheme,
  resolvePreferenceRowLayout,
  resolveClock,
  resolveSafeCtx,
  setDefaultContext,
  type PreparedPreferenceSection,
  type PreferenceRow,
  type PreferenceSection,
  type OverflowBehavior,
  type Surface,
  type Theme,
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
  FrameShellCommand,
  ObservedKeyRoute,
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
  applyRuntimeCommandBuffer,
  bufferRuntimeRouteResult,
  createRuntimeBuffers,
  createRuntimeRetainedLayouts,
  retainRuntimeLayout,
  routeRuntimeInput,
  type RuntimeInputRouteResult,
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
  createFramePaneScratchPool,
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

/** A stock shell-theme option that the frame can surface in its settings drawer. */
export interface FrameShellTheme {
  /** Stable option id. */
  readonly id: string;
  /** Visible label shown in the settings drawer. */
  readonly label: string;
  /** Theme payload applied when this option is selected. */
  readonly theme: Theme;
  /** Optional helper copy shown beneath the row when active. */
  readonly description?: string;
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
  /** Optional stock shell-theme choices surfaced by the frame settings drawer. */
  readonly shellThemes?: readonly FrameShellTheme[];
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
  /** Currently selected stock shell theme id (if shell themes are enabled). */
  readonly activeShellThemeId?: string;
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

function applyResolvedShellThemeToContext(
  ctx: NonNullable<ReturnType<typeof resolveSafeCtx>>,
  resolvedTheme: ReturnType<typeof createResolved>,
): void {
  const accessors = createThemeAccessors(resolvedTheme);
  Object.assign(ctx as {
    theme: typeof resolvedTheme;
    tokenGraph: typeof resolvedTheme.tokenGraph;
    semantic: typeof accessors.semantic;
    border: typeof accessors.border;
    surface: typeof accessors.surface;
    status: typeof accessors.status;
    ui: typeof accessors.ui;
    gradient: typeof accessors.gradient;
  }, {
    theme: resolvedTheme,
    tokenGraph: resolvedTheme.tokenGraph,
    ...accessors,
  });
  setDefaultContext(ctx);
}

function resolveShellThemeOptionsText(
  shellThemes: readonly ResolvedFrameShellTheme[],
  i18n: I18nRuntime | undefined,
): string {
  const labels = shellThemes.map((theme) => theme.label);
  if (labels.length === 0) return '';
  if (i18n == null) return labels.join(', ');
  return i18n.formatList(labels, i18n.locale);
}

function resolveCurrentShellTheme(
  shellThemes: readonly ResolvedFrameShellTheme[],
  activeShellThemeId: string | undefined,
): ResolvedFrameShellTheme | undefined {
  return shellThemes.find((theme) => theme.id === activeShellThemeId) ?? shellThemes[0];
}

function resolveNextShellTheme(
  shellThemes: readonly ResolvedFrameShellTheme[],
  activeShellThemeId: string | undefined,
): ResolvedFrameShellTheme | undefined {
  if (shellThemes.length === 0) return undefined;
  const currentIndex = Math.max(0, shellThemes.findIndex((theme) => theme.id === activeShellThemeId));
  return shellThemes[(currentIndex + 1) % shellThemes.length];
}

function mergeShellThemeSettings<Msg>(
  settings: FrameSettings<Msg> | undefined,
  shellThemes: readonly ResolvedFrameShellTheme[],
  activeShellThemeId: string | undefined,
  i18n: I18nRuntime | undefined,
): FrameSettings<Msg> | undefined {
  if (shellThemes.length < 2) return settings;

  const currentTheme = resolveCurrentShellTheme(shellThemes, activeShellThemeId);
  const nextTheme = resolveNextShellTheme(shellThemes, activeShellThemeId);
  if (currentTheme == null || nextTheme == null) return settings;

  const row: FrameSettingRow<Msg> = {
    id: FRAME_SHELL_THEME_ROW_ID,
    label: frameMessage(i18n, 'settings.shellTheme.label', 'Shell theme'),
    description: currentTheme.description ?? frameMessage(
      i18n,
      'settings.shellTheme.description',
      'Current theme: {theme}. Options: {options}.',
      {
        theme: currentTheme.label,
        options: resolveShellThemeOptionsText(shellThemes, i18n),
      },
    ),
    valueLabel: currentTheme.label,
    kind: 'choice',
    feedback: {
      title: frameMessage(i18n, 'settings.title', 'Settings'),
      message: frameMessage(
        i18n,
        'settings.shellTheme.feedback',
        'Shell theme set to {theme}.',
        { theme: nextTheme.label },
      ),
    },
  };

  const shellSectionTitle = frameMessage(i18n, 'settings.section.shell', 'Shell');
  if (settings == null) {
    return {
      title: frameMessage(i18n, 'settings.title', 'Settings'),
      sections: [{ id: 'shell', title: shellSectionTitle, rows: [row] }],
    };
  }

  const shellSectionIndex = settings.sections.findIndex((section) => section.id === 'shell');
  if (shellSectionIndex >= 0) {
    const shellSection = settings.sections[shellSectionIndex]!;
    const existingRowIndex = shellSection.rows.findIndex((existingRow) => existingRow.id === FRAME_SHELL_THEME_ROW_ID);
    const nextRows = existingRowIndex >= 0
      ? shellSection.rows.map((existingRow, index) => (index === existingRowIndex ? row : existingRow))
      : [...shellSection.rows, row];
    return {
      ...settings,
      sections: settings.sections.map((section, index) => (
        index === shellSectionIndex
          ? { ...shellSection, rows: nextRows }
          : section
      )),
    };
  }

  return {
    ...settings,
    sections: [
      { id: 'shell', title: shellSectionTitle, rows: [row] },
      ...settings.sections,
    ],
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

  const frameCtx = options.shellThemes != null && options.shellThemes.length > 0
    ? resolveSafeCtx()
    : undefined;
  if (options.shellThemes != null && options.shellThemes.length > 0 && frameCtx == null) {
    throw new Error('createFramedApp: shellThemes requires a default Bijou context');
  }
  const resolvedShellThemes: readonly ResolvedFrameShellTheme[] = options.shellThemes?.map((theme) => ({
    id: theme.id,
    label: theme.label,
    description: theme.description,
    resolvedTheme: createResolved(
      theme.theme,
      frameCtx!.theme.noColor,
      frameCtx!.theme.colorScheme,
    ),
  })) ?? [];
  const enableShellThemeSettings = resolvedShellThemes.length > 1;
  const initialShellTheme = resolvedShellThemes.find(
    (theme) => theme.resolvedTheme.theme.name === frameCtx?.theme.theme.name,
  ) ?? resolvedShellThemes[0];

  const frameKeys = createFrameKeyMap({
    enableSettings: options.settings != null || enableShellThemeSettings,
    enableNotifications: options.notificationCenter != null || options.runtimeNotifications !== false,
    i18n: options.i18n,
  });
  const frameNotificationOptions = resolveFrameNotificationOptions(options);
  let composedFrameScratch: Surface | null = null;
  let headerScratch: Surface | undefined;
  let helpLineScratch: Surface | undefined;
  const paneScratchPool = createFramePaneScratchPool();
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

  // ---------------------------------------------------------------------------
  // Shell command handler table — interprets plain FrameShellCommand facts
  // emitted by routing handlers.  Each handler receives the current model
  // and returns the next model; TEA commands are pushed into a mutable
  // accumulator captured by the drain function.
  // ---------------------------------------------------------------------------

  type ShellCommandHandler = (
    model: InternalFrameModel<PageModel, Msg>,
    cmd: FrameShellCommand<Msg>,
    teaCmds: Cmd<FramedAppMsg<Msg>>[],
  ) => InternalFrameModel<PageModel, Msg>;

  const shellCommandHandlers: Record<FrameShellCommand<Msg>['type'], ShellCommandHandler> = {
    // --- overlay lifecycle ---
    'close-help': (model) =>
      ({ ...model, helpOpen: false, helpScrollY: 0 }),
    'close-settings': (model) =>
      ({ ...model, settingsOpen: false }),
    'close-notification-center': (model) =>
      ({ ...model, notificationCenterOpen: false, notificationCenterScrollY: 0 }),
    'close-palette': (model) => closeCommandPalette(model),
    'close-quit-confirm': (model) =>
      ({ ...model, quitConfirmOpen: false }),
    'open-help': (model) =>
      ({ ...model, helpOpen: true }),
    'open-quit-confirm': (model) => {
      if (!shouldUseShellQuitConfirm()) return model;
      if (model.quitConfirmOpen) return model;
      return {
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
      };
    },
    'open-search-palette': (model) =>
      openSearchPalette(model, frameKeys, options, pagesById),
    'open-command-palette': (model) =>
      openCommandPalette(model, frameKeys, options, pagesById),

    // --- settings ---
    'settings-focus-move': (model, cmd) => {
      const c = cmd as Extract<FrameShellCommand<Msg>, { type: 'settings-focus-move' }>;
      const layout = resolveSettingsLayout(model, options, pagesById, resolvedShellThemes);
      return layout != null ? moveSettingsFocus(model, layout, c.delta) : model;
    },
    'settings-scroll': (model, cmd) => {
      const c = cmd as Extract<FrameShellCommand<Msg>, { type: 'settings-scroll' }>;
      const layout = resolveSettingsLayout(model, options, pagesById, resolvedShellThemes);
      return layout != null ? scrollSettingsBy(model, layout, c.delta) : model;
    },
    'settings-scroll-to': (model, cmd) => {
      const c = cmd as Extract<FrameShellCommand<Msg>, { type: 'settings-scroll-to' }>;
      const layout = resolveSettingsLayout(model, options, pagesById, resolvedShellThemes);
      if (layout == null) return model;
      return { ...model, settingsScrollY: c.position === 'top' ? 0 : layout.maxScrollY };
    },
    'activate-settings-row': (model, cmd, teaCmds) => {
      const c = cmd as Extract<FrameShellCommand<Msg>, { type: 'activate-settings-row' }>;
      const layout = resolveSettingsLayout(model, options, pagesById, resolvedShellThemes);
      if (layout == null) return model;
      const hitRow = layout.rows.find((r) => r.index === c.rowIndex);
      if (hitRow == null) return model;
      const focusedModel = { ...model, settingsFocusIndex: hitRow.index };
      if (hitRow.behavior === 'cycle-shell-theme') {
        const [nextModel, cmds] = cycleShellThemeSetting(focusedModel, hitRow.row);
        teaCmds.push(...cmds);
        return nextModel;
      }
      if (hitRow.row.action === undefined || hitRow.row.enabled === false || hitRow.row.kind === 'info') {
        return focusedModel;
      }
      const [nextModel, cmds] = activateSettingsRow(focusedModel, hitRow.row);
      teaCmds.push(...cmds);
      return nextModel;
    },

    // --- notification center ---
    'notification-center-scroll': (model, cmd) => {
      const c = cmd as Extract<FrameShellCommand<Msg>, { type: 'notification-center-scroll' }>;
      const layout = resolveNotificationCenterLayout(model, options, pagesById);
      return layout != null ? scrollNotificationCenterBy(model, layout, c.delta) : model;
    },
    'notification-center-scroll-to': (model, cmd) => {
      const c = cmd as Extract<FrameShellCommand<Msg>, { type: 'notification-center-scroll-to' }>;
      const layout = resolveNotificationCenterLayout(model, options, pagesById);
      if (layout == null) return model;
      return { ...model, notificationCenterScrollY: c.position === 'top' ? 0 : layout.maxScrollY };
    },
    'cycle-notification-filter': (model, _cmd, teaCmds) => {
      const layout = resolveNotificationCenterLayout(model, options, pagesById);
      if (layout == null) return model;
      const [nextModel, cmds] = cycleNotificationCenterFilter(model, layout);
      teaCmds.push(...cmds);
      return nextModel;
    },

    // --- help ---
    'help-scroll': (model, cmd) => {
      const c = cmd as Extract<FrameShellCommand<Msg>, { type: 'help-scroll' }>;
      const activePage = pagesById.get(model.activePageId)!;
      const overlay = renderHelpOverlay(
        model,
        activePage,
        frameKeys,
        paletteKeys,
        options,
        pagesById,
        resolvedShellThemes,
      );
      const viewportHeight = Math.max(1, overlay.body.height - 1);
      const delta = c.action === 'down' ? 3
        : c.action === 'up' ? -3
        : c.action === 'page-down' ? viewportHeight
        : c.action === 'page-up' ? -viewportHeight
        : c.action === 'bottom' ? Infinity
        : /* top */ -Infinity;
      return {
        ...model,
        helpScrollY: Math.max(0, Math.min(overlay.maxScrollY, overlay.scrollY + delta)),
      };
    },

    // --- workspace ---
    'focus-pane': (model, cmd) => {
      const c = cmd as Extract<FrameShellCommand<Msg>, { type: 'focus-pane' }>;
      return focusPane(model, c.paneId);
    },
    'scroll-focused-pane': (model, cmd) => {
      const c = cmd as Extract<FrameShellCommand<Msg>, { type: 'scroll-focused-pane' }>;
      return scrollFocusedPane(model, { type: c.direction === 'down' ? 'scroll-down' : 'scroll-up' }, pagesById, options);
    },
    'switch-tab': (model, cmd, teaCmds) => {
      const c = cmd as Extract<FrameShellCommand<Msg>, { type: 'switch-tab' }>;
      const [nextModel, cmds] = switchTab(model, c.delta, pagesById, options);
      teaCmds.push(...cmds);
      return nextModel;
    },

    // --- delegation ---
    'apply-frame-action': (model, cmd, teaCmds) => {
      const c = cmd as Extract<FrameShellCommand<Msg>, { type: 'apply-frame-action' }>;
      const [nextModel, cmds] = applyFrameAction(c.action, model, options, pagesById);
      teaCmds.push(...cmds);
      return nextModel;
    },
    'palette-key': (model, cmd, teaCmds) => {
      const c = cmd as Extract<FrameShellCommand<Msg>, { type: 'palette-key' }>;
      const [nextModel, cmds] = handlePaletteKey(c.msg, model, paletteKeys, options, pagesById);
      teaCmds.push(...cmds);
      return nextModel;
    },

    // --- TEA command emissions ---
    'emit-page-msg': (model, cmd, teaCmds) => {
      const c = cmd as Extract<FrameShellCommand<Msg>, { type: 'emit-page-msg' }>;
      teaCmds.push(emitMsgForPage(c.pageId, c.msg));
      return model;
    },
    'emit-global-msg': (model, cmd, teaCmds) => {
      const c = cmd as Extract<FrameShellCommand<Msg>, { type: 'emit-global-msg' }>;
      teaCmds.push(emitMsg(c.msg));
      return model;
    },
    'quit': (_model, _cmd, teaCmds) => {
      teaCmds.push(quit());
      return _model;
    },
    'dismiss-notification': (model, cmd, teaCmds) => {
      const c = cmd as Extract<FrameShellCommand<Msg>, { type: 'dismiss-notification' }>;
      if (!frameNotificationOptions.enabled) return model;
      const nowMs = resolveClock(resolveSafeCtx()).now();
      const [nextModel, cmds] = applyFrameNotificationState(
        model,
        dismissNotification(model.runtimeNotifications, c.notificationId, nowMs),
        nowMs,
      );
      teaCmds.push(...cmds);
      return nextModel;
    },

    // --- observation ---
    'observed-key': (model, cmd, teaCmds) => {
      const c = cmd as Extract<FrameShellCommand<Msg>, { type: 'observed-key' }>;
      const observed = options.observeKey?.(c.msg, c.route);
      if (observed !== undefined) {
        teaCmds.push(emitMsgForPage(model.activePageId, observed));
      }
      return model;
    },
  };

  function drainShellCommandBuffer(
    model: InternalFrameModel<PageModel, Msg>,
    routeResult: RuntimeInputRouteResult<FrameShellCommand<Msg>>,
  ): [InternalFrameModel<PageModel, Msg>, Cmd<FramedAppMsg<Msg>>[]] {
    const buffers = bufferRuntimeRouteResult(
      createRuntimeBuffers<FrameShellCommand<Msg>>(),
      routeResult,
    );
    const teaCmds: Cmd<FramedAppMsg<Msg>>[] = [];
    const { state } = applyRuntimeCommandBuffer(
      model,
      buffers.commands,
      (s, cmd) => shellCommandHandlers[cmd.type](s, cmd, teaCmds),
    );
    return [state, teaCmds];
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


  function quitRequestCommands(
    msg: KeyMsg,
    route: ObservedKeyRoute,
  ): FrameShellCommand<Msg>[] {
    if (!shouldUseShellQuitConfirm()) {
      return [{ type: 'observed-key', msg, route }, { type: 'quit' }];
    }
    return [{ type: 'observed-key', msg, route }, { type: 'open-quit-confirm' }];
  }

  function resolveFrameActionCommands(
    msg: KeyMsg,
    action: FrameAction,
    route: ObservedKeyRoute,
  ): FrameShellCommand<Msg>[] {
    if (action.type === 'open-search' && options.enableCommandPalette) {
      return [{ type: 'observed-key', msg, route }, { type: 'open-search-palette' }];
    }
    if (action.type === 'open-palette' && options.enableCommandPalette) {
      return [{ type: 'observed-key', msg, route }, { type: 'open-command-palette' }];
    }
    return [{ type: 'observed-key', msg, route }, { type: 'apply-frame-action', action }];
  }

  function handlePaletteLayerKeyCommands(
    msg: KeyMsg,
    routedLayerKind: FrameLayerKind,
  ): FrameShellCommand<Msg>[] {
    const obs: FrameShellCommand<Msg> = { type: 'observed-key', msg, route: 'palette' };
    if (msg.ctrl && !msg.alt && msg.key === 'c') {
      return quitRequestCommands(msg, 'palette');
    }
    if (!msg.ctrl && !msg.alt && !msg.shift && msg.key === 'escape') {
      return [obs, { type: 'close-palette' }];
    }
    const frameAction = frameKeys.handle(msg);
    if (frameAction?.type === 'open-search') {
      return routedLayerKind === 'search'
        ? [obs, { type: 'close-palette' }]
        : [obs, { type: 'open-search-palette' }];
    }
    if (frameAction?.type === 'open-palette') {
      return routedLayerKind === 'command-palette'
        ? [obs, { type: 'close-palette' }]
        : [obs, { type: 'open-command-palette' }];
    }
    if (frameAction?.type === 'toggle-notifications') {
      return [obs, { type: 'close-palette' }, { type: 'apply-frame-action', action: frameAction }];
    }
    return [obs, { type: 'palette-key', msg }];
  }

  function handleHelpLayerKeyCommands(
    msg: KeyMsg,
  ): FrameShellCommand<Msg>[] {
    const obs: FrameShellCommand<Msg> = { type: 'observed-key', msg, route: 'help' };
    if (!msg.ctrl && !msg.alt && (msg.key === '?' || msg.key === 'escape')) {
      return [obs, { type: 'close-help' }];
    }
    if (isShellQuitRequest(msg)) {
      return quitRequestCommands(msg, 'help');
    }
    const helpAction = frameKeys.handle(msg);
    if (helpAction && isHelpScrollAction(helpAction)) {
      const action = helpAction.type === 'scroll-down' ? 'down' as const
        : helpAction.type === 'scroll-up' ? 'up' as const
        : helpAction.type === 'page-down' ? 'page-down' as const
        : helpAction.type === 'page-up' ? 'page-up' as const
        : helpAction.type === 'bottom' ? 'bottom' as const
        : 'top' as const;
      return [obs, { type: 'help-scroll', action }];
    }
    return [obs];
  }

  function handleSettingsLayerKeyCommands(
    msg: KeyMsg,
    model: InternalFrameModel<PageModel, Msg>,
  ): FrameShellCommand<Msg>[] | undefined {
    const layout = resolveSettingsLayout(model, options, pagesById, resolvedShellThemes);
    if (layout == null) return undefined;
    const obs: FrameShellCommand<Msg> = { type: 'observed-key', msg, route: 'frame' };
    if (!msg.ctrl && !msg.alt && (msg.key === 'escape' || msg.key === 'f2')) {
      return [obs, { type: 'close-settings' }];
    }
    if (msg.ctrl && !msg.alt && msg.key === ',') {
      return [obs, { type: 'close-settings' }];
    }
    if (!msg.ctrl && !msg.alt && msg.key === '?') {
      return [obs, { type: 'open-help' }];
    }
    if (isShellQuitRequest(msg)) {
      return quitRequestCommands(msg, 'frame');
    }
    if (options.enableCommandPalette && !msg.ctrl && !msg.alt && msg.key === '/') {
      return [obs, { type: 'open-search-palette' }];
    }
    if (options.enableCommandPalette && ((msg.ctrl && !msg.alt && msg.key === 'p') || (!msg.ctrl && !msg.alt && msg.key === ':'))) {
      return [obs, { type: 'open-command-palette' }];
    }
    const settingsFrameAction = frameKeys.handle(msg);
    if (settingsFrameAction?.type === 'toggle-notifications') {
      return [obs, { type: 'apply-frame-action', action: settingsFrameAction }];
    }
    if (!msg.ctrl && !msg.alt && msg.key === 'up') {
      return [obs, { type: 'settings-focus-move', delta: -1 }];
    }
    if (!msg.ctrl && !msg.alt && msg.key === 'down') {
      return [obs, { type: 'settings-focus-move', delta: 1 }];
    }
    if (!msg.ctrl && !msg.alt && msg.key === 'j') {
      return [obs, { type: 'settings-scroll', delta: 1 }];
    }
    if (!msg.ctrl && !msg.alt && msg.key === 'k') {
      return [obs, { type: 'settings-scroll', delta: -1 }];
    }
    if (!msg.ctrl && !msg.alt && msg.key === 'd') {
      return [obs, { type: 'settings-scroll', delta: Math.max(1, layout.contentHeight - 1) }];
    }
    if (!msg.ctrl && !msg.alt && msg.key === 'u') {
      return [obs, { type: 'settings-scroll', delta: -Math.max(1, layout.contentHeight - 1) }];
    }
    if (!msg.ctrl && !msg.alt && msg.key === 'g') {
      return [obs, { type: 'settings-scroll-to', position: 'top' }];
    }
    if (!msg.ctrl && !msg.alt && msg.key === 'G') {
      return [obs, { type: 'settings-scroll-to', position: 'bottom' }];
    }
    if (!msg.ctrl && !msg.alt && (msg.key === 'enter' || msg.key === 'space')) {
      const rowIndex = clampSettingsFocus(model, layout);
      const row = layout.rows[rowIndex];
      if (
        row != null
        && row.row.enabled !== false
        && row.row.kind !== 'info'
        && (row.behavior === 'cycle-shell-theme' || row.row.action !== undefined)
      ) {
        return [obs, { type: 'activate-settings-row', rowIndex: row.index }];
      }
      return [obs];
    }
    return [obs];
  }

  function handleNotificationCenterLayerKeyCommands(
    msg: KeyMsg,
    model: InternalFrameModel<PageModel, Msg>,
  ): FrameShellCommand<Msg>[] | undefined {
    const layout = resolveNotificationCenterLayout(model, options, pagesById);
    if (layout == null) return undefined;
    const obs: FrameShellCommand<Msg> = { type: 'observed-key', msg, route: 'frame' };
    if (!msg.ctrl && !msg.alt && msg.key === 'escape') {
      return [obs, { type: 'close-notification-center' }];
    }
    if (isShellQuitRequest(msg)) {
      return quitRequestCommands(msg, 'frame');
    }
    const centerFrameAction = frameKeys.handle(msg);
    if (centerFrameAction?.type === 'toggle-notifications') {
      return [obs, { type: 'apply-frame-action', action: centerFrameAction }];
    }
    if (!msg.ctrl && !msg.alt && msg.key === 'f2') {
      return [obs, { type: 'close-notification-center' }, { type: 'apply-frame-action', action: { type: 'toggle-settings' } }];
    }
    if (!msg.ctrl && !msg.alt && msg.key === '?') {
      return [obs, { type: 'close-notification-center' }, { type: 'open-help' }];
    }
    if (options.enableCommandPalette && !msg.ctrl && !msg.alt && msg.key === '/') {
      return [obs, { type: 'close-notification-center' }, { type: 'open-search-palette' }];
    }
    if (options.enableCommandPalette && ((msg.ctrl && !msg.alt && msg.key === 'p') || (!msg.ctrl && !msg.alt && msg.key === ':'))) {
      return [obs, { type: 'close-notification-center' }, { type: 'open-command-palette' }];
    }
    if (!msg.ctrl && !msg.alt && (msg.key === 'up' || msg.key === 'k')) {
      return [obs, { type: 'notification-center-scroll', delta: -1 }];
    }
    if (!msg.ctrl && !msg.alt && (msg.key === 'down' || msg.key === 'j')) {
      return [obs, { type: 'notification-center-scroll', delta: 1 }];
    }
    if (!msg.ctrl && !msg.alt && msg.key === 'd') {
      return [obs, { type: 'notification-center-scroll', delta: Math.max(1, layout.contentHeight - 2) }];
    }
    if (!msg.ctrl && !msg.alt && msg.key === 'u') {
      return [obs, { type: 'notification-center-scroll', delta: -Math.max(1, layout.contentHeight - 2) }];
    }
    if (!msg.ctrl && !msg.alt && msg.key === 'g') {
      return [obs, { type: 'notification-center-scroll-to', position: 'top' }];
    }
    if (!msg.ctrl && !msg.alt && msg.key === 'G') {
      return [obs, { type: 'notification-center-scroll-to', position: 'bottom' }];
    }
    if (!msg.ctrl && !msg.alt && msg.key === 'f') {
      return [obs, { type: 'cycle-notification-filter' }];
    }
    return [obs];
  }

  function handleWorkspaceLayerKeyCommands(
    msg: KeyMsg,
    model: InternalFrameModel<PageModel, Msg>,
  ): FrameShellCommand<Msg>[] {
    if (isShellQuitRequest(msg)) {
      return quitRequestCommands(msg, 'frame');
    }
    const context = resolveLayerContext(model);
    const { activePage, activeInputArea } = context;
    const paneAction = activeInputArea?.keyMap?.handle(msg);
    const pageAction = activePage.keyMap?.handle(msg);
    const globalAction = options.globalKeys?.handle(msg);
    const frameAction = frameKeys.handle(msg);
    const keyPriority = options.keyPriority ?? 'frame-first';

    if (keyPriority === 'page-first') {
      if (paneAction !== undefined) {
        return [{ type: 'observed-key', msg, route: 'page' }, { type: 'emit-page-msg', pageId: model.activePageId, msg: paneAction }];
      }
      if (pageAction !== undefined) {
        return [{ type: 'observed-key', msg, route: 'page' }, { type: 'emit-page-msg', pageId: model.activePageId, msg: pageAction }];
      }
      if (globalAction !== undefined) {
        return [{ type: 'observed-key', msg, route: 'global' }, { type: 'emit-global-msg', msg: globalAction }];
      }
      if (frameAction !== undefined) {
        return resolveFrameActionCommands(msg, frameAction, 'frame');
      }
      return [{ type: 'observed-key', msg, route: 'unhandled' }];
    }

    // frame-first (default)
    if (frameAction !== undefined) {
      return resolveFrameActionCommands(msg, frameAction, 'frame');
    }
    if (paneAction !== undefined) {
      return [{ type: 'observed-key', msg, route: 'page' }, { type: 'emit-page-msg', pageId: model.activePageId, msg: paneAction }];
    }
    if (globalAction !== undefined) {
      return [{ type: 'observed-key', msg, route: 'global' }, { type: 'emit-global-msg', msg: globalAction }];
    }
    if (pageAction !== undefined) {
      return [{ type: 'observed-key', msg, route: 'page' }, { type: 'emit-page-msg', pageId: model.activePageId, msg: pageAction }];
    }
    return [{ type: 'observed-key', msg, route: 'unhandled' }];
  }

  function resolveRoutedKeyLayer(
    msg: KeyMsg,
    model: InternalFrameModel<PageModel, Msg>,
  ): RuntimeInputRouteResult<FrameShellCommand<Msg>> {
    const context = resolveLayerContext(model);
    const runtimeStack = describeFrameRuntimeViewStack(model, {
      pageModalOpen: context.pageModalOpen,
    });

    return routeRuntimeInput<
      SurfaceLayoutNode, FrameLayerDescriptor, FrameShellCommand<Msg>
    >(
      runtimeStack,
      EMPTY_RUNTIME_LAYOUTS,
      { kind: 'key', key: msg.key },
      ({ layer }) => {
        const frameLayer = layer.model;
        if (frameLayer == null) return undefined;

        if (frameLayer.kind === 'search' || frameLayer.kind === 'command-palette') {
          return { handled: true, commands: handlePaletteLayerKeyCommands(msg, frameLayer.kind) };
        }

        if (frameLayer.kind === 'help') {
          return { handled: true, commands: handleHelpLayerKeyCommands(msg) };
        }

        if (frameLayer.kind === 'settings') {
          const cmds = handleSettingsLayerKeyCommands(msg, model);
          return cmds != null ? { handled: true, commands: cmds } : { bubble: true };
        }

        if (frameLayer.kind === 'notification-center') {
          const cmds = handleNotificationCenterLayerKeyCommands(msg, model);
          return cmds != null ? { handled: true, commands: cmds } : { bubble: true };
        }

        if (frameLayer.kind === 'quit-confirm') {
          const obs: FrameShellCommand<Msg> = { type: 'observed-key', msg, route: 'frame' };
          if (isShellQuitConfirmAccept(msg)) {
            return { handled: true, commands: [obs, { type: 'close-quit-confirm' }, { type: 'quit' }] };
          }
          if (isShellQuitConfirmDismiss(msg)) {
            return { handled: true, commands: [obs, { type: 'close-quit-confirm' }] };
          }
          return { handled: true, commands: [obs] };
        }

        if (frameLayer.kind === 'page-modal') {
          const { modalKeyMap } = context;
          const obs: FrameShellCommand<Msg> = { type: 'observed-key', msg, route: 'page' };
          if (modalKeyMap != null) {
            const modalAction = modalKeyMap.handle(msg);
            if (modalAction !== undefined) {
              return { handled: true, commands: [obs, { type: 'emit-page-msg', pageId: model.activePageId, msg: modalAction }] };
            }
          }
          return { handled: true, commands: [obs] };
        }

        // workspace (root layer)
        return { handled: true, commands: handleWorkspaceLayerKeyCommands(msg, model) };
      },
    );
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
      ? renderMaximizedPane(model.activePageId, model, bodyRect, pagesById, maximizedPaneId, paneScratchPool)
      : renderPageContent(model.activePageId, model, bodyRect, pagesById);
    return renderResult.paneRects;
  }

  function buildWorkspaceLayoutTree(
    model: InternalFrameModel<PageModel, Msg>,
  ): SurfaceLayoutNode {
    const header = resolveHeaderLine(model, options, pagesById, headerScratch);
    headerScratch = header.surface;
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

    const settingsLayout = model.settingsOpen
      ? resolveSettingsLayout(model, options, pagesById, resolvedShellThemes)
      : undefined;
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

    const notificationCenterLayout = model.notificationCenterOpen ? resolveNotificationCenterLayout(model, options, pagesById) : undefined;
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
  ): RuntimeInputRouteResult<FrameShellCommand<Msg>> {
    const context = resolveLayerContext(model);
    const { activePageModel, inputAreas } = context;
    const runtimeStack = describeFrameRuntimeViewStack(model, {
      pageModalOpen: context.pageModalOpen,
    });

    return routeRuntimeInput<
      SurfaceLayoutNode, FrameLayerDescriptor, FrameShellCommand<Msg>
    >(
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
        if (frameLayer == null) return undefined;

        const cmds: FrameShellCommand<Msg>[] = [];

        if (frameLayer.kind === 'help') {
          if (msg.action === 'scroll-up' || msg.action === 'scroll-down') {
            cmds.push({ type: 'help-scroll', action: msg.action === 'scroll-down' ? 'down' : 'up' });
          }
          return { handled: true, commands: cmds };
        }

        if (frameLayer.kind === 'search' || frameLayer.kind === 'command-palette'
          || frameLayer.kind === 'quit-confirm' || frameLayer.kind === 'page-modal') {
          return { handled: true };
        }

        if (frameLayer.kind === 'settings') {
          if (hit == null) return { handled: true };
          if (msg.action === 'scroll-up' || msg.action === 'scroll-down') {
            cmds.push({ type: 'settings-scroll', delta: msg.action === 'scroll-down' ? 3 : -3 });
            return { handled: true, commands: cmds };
          }
          if (msg.action === 'press' && msg.button === 'left') {
            const rowNode = hit.path.find((n) => n.id?.startsWith('settings-row:'));
            if (rowNode != null) {
              const rowIndex = parseInt(rowNode.id!.slice('settings-row:'.length), 10);
              cmds.push({ type: 'activate-settings-row', rowIndex });
            }
            return { handled: true, commands: cmds };
          }
          return { handled: true };
        }

        if (frameLayer.kind === 'notification-center') {
          if (hit == null) return { handled: true };
          if (msg.action === 'scroll-up' || msg.action === 'scroll-down') {
            cmds.push({ type: 'notification-center-scroll', delta: msg.action === 'scroll-down' ? 3 : -3 });
            return { handled: true, commands: cmds };
          }
          return { handled: true };
        }

        // workspace layer
        if (msg.action === 'press' && msg.button === 'left') {
          // notification toast hit-testing (outside retained layouts)
          if (frameNotificationOptions.enabled) {
            const notificationTarget = hitTestNotificationStack(model.runtimeNotifications, {
              screenWidth: model.columns,
              screenHeight: model.rows,
              margin: frameNotificationOptions.margin,
              gap: frameNotificationOptions.gap,
              ctx: resolveSafeCtx() ?? undefined,
            }, msg.col, msg.row);
            if (notificationTarget?.kind === 'dismiss') {
              cmds.push({ type: 'dismiss-notification', notificationId: notificationTarget.item.id });
              return { handled: true, commands: cmds };
            }
            if (notificationTarget != null) {
              return { handled: true };
            }
          }

          // tab click
          const tabNode = hit?.path.find((n) => n.id?.startsWith('tab:'));
          if (tabNode != null) {
            const pageId = tabNode.id!.slice('tab:'.length);
            const currentIndex = model.pageOrder.indexOf(model.activePageId);
            const nextIndex = model.pageOrder.indexOf(pageId);
            if (currentIndex >= 0 && nextIndex >= 0 && nextIndex !== currentIndex) {
              cmds.push({ type: 'switch-tab', delta: nextIndex - currentIndex });
            }
            return { handled: true, commands: cmds };
          }
          if (msg.row === 0) {
            return { handled: true };
          }

          // pane click
          const clickedPaneNode = hit?.path.find((n) => n.id?.startsWith('pane:'));
          if (clickedPaneNode != null) {
            const paneId = clickedPaneNode.id!.slice('pane:'.length);
            const paneRects = resolveWorkspacePaneRects(model);
            const paneRect = paneRects.get(paneId);
            if (paneRect != null) {
              cmds.push({ type: 'focus-pane', paneId });
              const inputArea = findInputAreaByPaneId(inputAreas, paneId);
              const areaMsg = inputArea?.mouse?.({ msg, model: activePageModel, rect: paneRect });
              cmds.push({
                type: 'emit-page-msg',
                pageId: model.activePageId,
                msg: areaMsg !== undefined ? areaMsg : msg,
              });
              return { handled: true, commands: cmds };
            }
          }
        }

        if (msg.action === 'scroll-up' || msg.action === 'scroll-down') {
          const scrollPaneNode = hit?.path.find((n) => n.id?.startsWith('pane:'));
          if (scrollPaneNode != null) {
            const paneId = scrollPaneNode.id!.slice('pane:'.length);
            const paneRects = resolveWorkspacePaneRects(model);
            const paneRect = paneRects.get(paneId);
            if (paneRect != null) {
              cmds.push({ type: 'focus-pane', paneId });
              const inputArea = findInputAreaByPaneId(inputAreas, paneId);
              const areaMsg = inputArea?.mouse?.({ msg, model: activePageModel, rect: paneRect });
              if (areaMsg !== undefined) {
                cmds.push({ type: 'emit-page-msg', pageId: model.activePageId, msg: areaMsg });
              } else {
                cmds.push({ type: 'scroll-focused-pane', direction: msg.action === 'scroll-down' ? 'down' : 'up' });
              }
              return { handled: true, commands: cmds };
            }
          }
        }

        return { handled: true };
      },
    );
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
    const settings = resolveFrameSettings(model, options, pagesById, resolvedShellThemes);
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

  function pushSettingsFeedback(
    model: InternalFrameModel<PageModel, Msg>,
    row: FrameSettingRow<Msg>,
  ): [InternalFrameModel<PageModel, Msg>, Cmd<FramedAppMsg<Msg>>[]] {
    if (!frameNotificationOptions.enabled) {
      return [model, []];
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
    return applyFrameNotificationState(model, notifications, nowMs);
  }

  function activateSettingsRow(
    model: InternalFrameModel<PageModel, Msg>,
    row: FrameSettingRow<Msg>,
  ): [InternalFrameModel<PageModel, Msg>, Cmd<FramedAppMsg<Msg>>[]] {
    if (row.action === undefined || row.enabled === false || row.kind === 'info') {
      return [model, []];
    }

    const cmds: Cmd<FramedAppMsg<Msg>>[] = [emitMsgForPage(model.activePageId, row.action)];
    const [nextModel, notificationCmds] = pushSettingsFeedback(model, row);
    return [nextModel, [...cmds, ...notificationCmds]];
  }

  function cycleShellThemeSetting(
    model: InternalFrameModel<PageModel, Msg>,
    row: FrameSettingRow<Msg>,
  ): [InternalFrameModel<PageModel, Msg>, Cmd<FramedAppMsg<Msg>>[]] {
    const nextTheme = resolveNextShellTheme(resolvedShellThemes, model.activeShellThemeId);
    if (nextTheme == null || frameCtx == null) {
      return [model, []];
    }
    applyResolvedShellThemeToContext(frameCtx, nextTheme.resolvedTheme);
    const [nextModel, notificationCmds] = pushSettingsFeedback({
      ...model,
      activeShellThemeId: nextTheme.id,
    }, row);
    return [nextModel, notificationCmds];
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
        activeShellThemeId: initialShellTheme?.id,
      };

      if (
        initialShellTheme != null
        && frameCtx != null
        && frameCtx.theme.theme.name !== initialShellTheme.resolvedTheme.theme.name
      ) {
        applyResolvedShellThemeToContext(frameCtx, initialShellTheme.resolvedTheme);
      }

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
        return drainShellCommandBuffer(model, resolveRoutedKeyLayer(msg, model));
      }

      if (isMouseMsg(msg)) {
        const mouseRouteResult = resolveRoutedMouseLayer(msg, model);
        if (mouseRouteResult.handled) {
          return drainShellCommandBuffer(model, mouseRouteResult);
        }
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
      const headerResult = resolveHeaderLine(model, options, pagesById, headerScratch);
      headerScratch = headerResult.surface;
      const header = headerResult.surface;
      helpLineScratch = renderHelpLine(
        model,
        activeLayer,
        options.i18n,
        resolveNotificationFooterCue(model, options, pagesById),
        helpLineScratch,
      );
      const helpLine = helpLineScratch;
      const bodyRect = resolveBodyRect(model, options);

      // Check for maximized pane — if set, render only that pane at full body rect
      const maxState = model.maximizedPaneByPage[model.activePageId];
      const maximizedPaneId = maxState?.maximizedPaneId;

      const frameSurface = getComposedFrameScratch(model.columns, model.rows);
      // clear() is load-bearing: it resets dim flags left by overlay compositing
      // on the previous frame. Do not skip or defer this call.
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
          ? renderMaximizedPane(model.activePageId, model, bodyRect, pagesById, maximizedPaneId, paneScratchPool)
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
          ? renderMaximizedPaneInto(model.activePageId, model, bodyRect, pagesById, maximizedPaneId, frameSurface, bodyRect.row, bodyRect.col, paneScratchPool)
          : renderPageContentInto(model.activePageId, model, bodyRect, pagesById, frameSurface, bodyRect.row, bodyRect.col, paneScratchPool);
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
          resolvedShellThemes,
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
        const helpOverlay = renderHelpOverlay(
          model,
          activePage,
          frameKeys,
          paletteKeys,
          options,
          pagesById,
          resolvedShellThemes,
        );
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
  shellThemes: readonly ResolvedFrameShellTheme[],
): { body: Surface; maxScrollY: number; scrollY: number } {
  const activePageModel = model.pageModels[model.activePageId]!;
  const activeInputArea = findInputAreaByPaneId(
    resolveInputAreas(activePage, activePageModel),
    model.focusedPaneByPage[model.activePageId],
  );
  const modalKeyMap = activePage.modalKeyMap?.(activePageModel);
  const settings = resolveFrameSettings(model, options, pagesById, shellThemes);
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



const FRAME_SHELL_THEME_ROW_ID = '__frame-shell-theme__';

type SettingsRowBehavior = 'cycle-shell-theme';

interface ResolvedFrameShellTheme {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly resolvedTheme: ReturnType<typeof createResolved>;
}

interface FlatSettingsRow<Msg> {
  readonly index: number;
  readonly line: number;
  readonly height: number;
  readonly row: FrameSettingRow<Msg>;
  readonly behavior?: SettingsRowBehavior;
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
  shellThemes: readonly ResolvedFrameShellTheme[],
): FrameSettings<Msg> | undefined {
  const activePage = pagesById.get(model.activePageId)!;
  const provided = options.settings?.({
    model,
    activePage,
    pageModel: model.pageModels[model.activePageId]!,
  });
  return mergeShellThemeSettings(provided, shellThemes, model.activeShellThemeId, options.i18n);
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
  shellThemes: readonly ResolvedFrameShellTheme[],
): ResolvedSettingsLayout<Msg> | undefined {
  const settings = resolveFrameSettings(model, options, pagesById, shellThemes);
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
        behavior: row.id === FRAME_SHELL_THEME_ROW_ID ? 'cycle-shell-theme' : undefined,
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
  shellThemes: readonly ResolvedFrameShellTheme[],
  titleOverride?: string,
): Overlay | undefined {
  const layout = resolveSettingsLayout(model, options, pagesById, shellThemes);
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
