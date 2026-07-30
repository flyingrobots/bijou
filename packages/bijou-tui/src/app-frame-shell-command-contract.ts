import type { BijouContext } from '@flyingrobots/bijou';
import type { KeyMap } from './keybindings.js';
import type { FramePage } from './app-frame-page-contract.js';
import type { CreateFramedAppOptions } from './app-frame-options.js';
import type { ResolvedFrameShellTheme } from './app-frame-overlays.js';
import type {
  FrameAction,
  FrameShellCommand,
  PaletteAction,
} from './app-frame-types.js';
import type { FrameNotificationStateServices } from './app-frame-notification-state.js';
import type { ResolvedFrameNotificationOptions } from './app-frame-notification-runtime.js';
import type { FrameThemeModeServices } from './app-frame-theme-mode.js';
import type { FramePresentationDependencies } from './app-frame-presentation.js';

export interface FrameShellCommandDependencies<PageModel, Msg> {
  readonly options: CreateFramedAppOptions<PageModel, Msg>;
  readonly pagesById: Map<string, FramePage<PageModel, Msg>>;
  readonly frameKeys: KeyMap<FrameAction>;
  readonly paletteKeys: KeyMap<PaletteAction>;
  readonly frameNotificationOptions: ResolvedFrameNotificationOptions;
  readonly notificationState: FrameNotificationStateServices<PageModel, Msg>;
  readonly themeMode: FrameThemeModeServices<PageModel, Msg>;
  readonly presentationDependencies: FramePresentationDependencies<PageModel, Msg>;
  readonly resolveFrameCtx: () => BijouContext | undefined;
  readonly resolveFrameThemeCtx: (
    themeId: string | undefined,
  ) => BijouContext | undefined;
  readonly resolveShellThemes: () => readonly ResolvedFrameShellTheme[];
}

export type FrameShellUiCommand<Msg> = Extract<
  FrameShellCommand<Msg>,
  {
    readonly type:
      | 'close-help'
      | 'close-settings'
      | 'close-notification-center'
      | 'close-palette'
      | 'close-quit-confirm'
      | 'open-help'
      | 'open-quit-confirm'
      | 'settings-focus-move'
      | 'settings-scroll'
      | 'settings-scroll-to'
      | 'activate-settings-row'
      | 'toggle-shell-theme-mode'
      | 'notification-center-scroll'
      | 'notification-center-scroll-to'
      | 'cycle-notification-filter';
  }
>;

export type FrameShellInteractionCommand<Msg> = Exclude<
  FrameShellCommand<Msg>,
  FrameShellUiCommand<Msg>
>;
