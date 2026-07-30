import type { BijouContext } from '@flyingrobots/bijou';
import type { I18nRuntime } from '@flyingrobots/bijou-i18n';
import type { BindingSource } from './help.js';
import type { KeyMap } from './keybindings.js';
import type { KeyMsg } from './types.js';
import type { Overlay } from './overlay.js';
import type { Timeline } from './timeline.js';
import type { SerializedLayoutState } from './layout-preset.js';
import type { FrameAction, FrameModel } from './app-frame-types.js';
import type { FramePage } from './app-frame-page-contract.js';
import type { FrameHeaderStyle, FrameShellThemeChange, FrameShellThemeSpec } from './app-frame-theme-contract.js';
import type { FrameSettings, FrameNotificationCenter } from './app-frame-settings-contract.js';
import type { FrameOverlayContext } from './app-frame-layout-contract.js';
import type { FrameRuntimeNotificationOptions } from './app-frame-notification-contract.js';
import type { NotificationState } from './notification.js';
import type { PageTransition } from './app-frame-transition-contract.js';

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
  /** Optional explicit context for frame-owned rendering and shell theme resolution. */
  readonly ctx?: BijouContext;
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
  readonly shellThemes?: readonly FrameShellThemeSpec[];
  /** Optional callback for syncing app-owned rendering with the stock shell theme. */
  readonly onShellThemeChange?: (change: FrameShellThemeChange) => void;
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
  readonly overlayFactory?: (
    ctx: FrameOverlayContext<PageModel>,
  ) => readonly Overlay[];
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
