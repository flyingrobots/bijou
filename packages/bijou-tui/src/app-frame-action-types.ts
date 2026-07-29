import type { NotificationSpec } from './notification.js';
import type { KeyMsg, MouseMsg, RuntimeIssue } from './types.js';

export type FrameNotificationSpec = Omit<NotificationSpec<never>, 'action'>;

/** Discriminated union of all frame-level actions. */
export type FrameAction =
  | { type: 'toggle-help' }
  | { type: 'toggle-perf-hud' }
  | { type: 'toggle-footer' }
  | { type: 'toggle-settings' }
  | { type: 'toggle-shell-theme-mode' }
  | { type: 'toggle-notifications' }
  | { type: 'push-notification'; notification: FrameNotificationSpec }
  | { type: 'prev-tab' }
  | { type: 'next-tab' }
  | { type: 'next-pane' }
  | { type: 'prev-pane' }
  | { type: 'scroll-up' }
  | { type: 'scroll-down' }
  | { type: 'page-up' }
  | { type: 'page-down' }
  | { type: 'top' }
  | { type: 'bottom' }
  | { type: 'scroll-left' }
  | { type: 'scroll-right' }
  | { type: 'open-search' }
  | { type: 'open-palette' }
  | { type: 'toggle-minimize' }
  | { type: 'toggle-maximize' }
  | { type: 'dock-up' }
  | { type: 'dock-down' }
  | { type: 'dock-left' }
  | { type: 'dock-right' }
  | { type: 'runtime-issue'; issue: RuntimeIssue }
  | { type: 'notification-tick'; atMs: number }
  | { type: 'footer-transition'; translateY: number; generation: number }
  | {
      type: 'footer-transition-complete';
      visible: boolean;
      generation: number;
    }
  | {
      type: 'transition';
      progress: number;
      generation: number;
      dt: number;
      elapsedMs: number;
    }
  | { type: 'transition-complete'; generation: number };

export type ObservedKeyRoute =
  'palette' | 'help' | 'frame' | 'page' | 'global' | 'unhandled';

/** Plain facts emitted by frame routing handlers. */
export type FrameShellCommand<Msg> =
  | { readonly type: 'close-help' }
  | { readonly type: 'close-settings' }
  | { readonly type: 'close-notification-center' }
  | { readonly type: 'close-palette' }
  | { readonly type: 'close-quit-confirm' }
  | { readonly type: 'open-help' }
  | { readonly type: 'open-quit-confirm' }
  | { readonly type: 'open-search-palette' }
  | { readonly type: 'open-command-palette' }
  | { readonly type: 'settings-focus-move'; readonly delta: number }
  | { readonly type: 'settings-scroll'; readonly delta: number }
  | {
      readonly type: 'settings-scroll-to';
      readonly position: 'top' | 'bottom';
    }
  | { readonly type: 'activate-settings-row'; readonly rowIndex: number }
  | { readonly type: 'toggle-shell-theme-mode' }
  | { readonly type: 'notification-center-scroll'; readonly delta: number }
  | {
      readonly type: 'notification-center-scroll-to';
      readonly position: 'top' | 'bottom';
    }
  | { readonly type: 'cycle-notification-filter' }
  | { readonly type: 'warn-frame-key-collision'; readonly msg: KeyMsg }
  | {
      readonly type: 'help-scroll';
      readonly action:
        'up' | 'down' | 'page-up' | 'page-down' | 'top' | 'bottom';
    }
  | { readonly type: 'focus-pane'; readonly paneId: string }
  | {
      readonly type: 'scroll-focused-pane';
      readonly direction: 'up' | 'down';
    }
  | { readonly type: 'switch-tab'; readonly delta: number }
  | { readonly type: 'apply-frame-action'; readonly action: FrameAction }
  | { readonly type: 'palette-key'; readonly msg: KeyMsg }
  | {
      readonly type: 'emit-page-msg';
      readonly pageId: string;
      readonly msg: Msg | MouseMsg;
    }
  | { readonly type: 'emit-global-msg'; readonly msg: Msg }
  | { readonly type: 'quit' }
  | {
      readonly type: 'dismiss-notification';
      readonly notificationId: number;
    }
  | {
      readonly type: 'observed-key';
      readonly msg: KeyMsg;
      readonly route: ObservedKeyRoute;
    };

export type PaletteAction =
  | { type: 'cp-next' }
  | { type: 'cp-prev' }
  | { type: 'cp-page-down' }
  | { type: 'cp-page-up' }
  | { type: 'cp-select' }
  | { type: 'cp-close' };
