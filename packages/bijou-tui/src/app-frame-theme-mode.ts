import { resolveClock, type BijouContext } from '@flyingrobots/bijou';
import type { Cmd } from './types.js';
import type { FrameSettingRow } from './app-frame-settings-contract.js';
import type {
  FramedAppMsg,
  InternalFrameModel,
} from './app-frame-types.js';
import type { CreateFramedAppOptions } from './app-frame-options.js';
import type { ResolvedFrameShellTheme } from './app-frame-overlays.js';
import {
  resolveCurrentShellTheme,
  resolveNextShellTheme,
  resolveShellThemeModeToggle,
} from './app-frame-overlays.js';
import { frameMessage } from './app-frame-i18n.js';
import { pushNotification } from './notification.js';
import type {
  ResolvedFrameNotificationOptions,
} from './app-frame-notification-runtime.js';
import type {
  FrameNotificationStateServices,
} from './app-frame-notification-state.js';

const SETTINGS_FEEDBACK_TOAST_WIDTH = 40;
type Update<PageModel, Msg> = [
  InternalFrameModel<PageModel, Msg>,
  Cmd<FramedAppMsg<Msg>>[],
];

export interface FrameThemeModeServices<PageModel, Msg> {
  cycleSetting(
    model: InternalFrameModel<PageModel, Msg>,
    row: FrameSettingRow<Msg>,
  ): Update<PageModel, Msg>;
  toggle(model: InternalFrameModel<PageModel, Msg>): Update<PageModel, Msg>;
}

export interface FrameThemeModeDependencies<PageModel, Msg> {
  readonly options: CreateFramedAppOptions<PageModel, Msg>;
  readonly notificationOptions: ResolvedFrameNotificationOptions;
  readonly notifications: FrameNotificationStateServices<PageModel, Msg>;
  readonly resolveContext: () => BijouContext | undefined;
  readonly resolveThemes: () => readonly ResolvedFrameShellTheme[];
  readonly ensureThemes: (context?: BijouContext) => void;
  readonly publishTheme: (
    theme: ResolvedFrameShellTheme,
  ) => BijouContext | undefined;
}

export function createFrameThemeModeServices<PageModel, Msg>(
  dependencies: FrameThemeModeDependencies<PageModel, Msg>,
): FrameThemeModeServices<PageModel, Msg> {
  const pushModeFeedback = (
    model: InternalFrameModel<PageModel, Msg>,
    theme: ResolvedFrameShellTheme,
    unsupported: boolean,
  ): Update<PageModel, Msg> => {
    const { notificationOptions, options } = dependencies;
    if (!notificationOptions.enabled) return [model, []];
    const nowMs = resolveClock(dependencies.resolveContext()).now();
    const message = unsupported
      ? frameMessage(
          options.i18n,
          'settings.shellTheme.modeUnsupported',
          'Shell theme {theme} has no alternate mode.',
          { theme: theme.label },
        )
      : frameMessage(
          options.i18n,
          'settings.shellTheme.feedback',
          'Shell theme set to {theme}.',
          { theme: theme.label },
        );
    const notifications = pushNotification(
      model.runtimeNotifications,
      {
        title: frameMessage(options.i18n, 'settings.title', 'Settings'),
        message,
        variant: 'TOAST',
        tone: 'INFO',
        width: SETTINGS_FEEDBACK_TOAST_WIDTH,
        placement: notificationOptions.placement,
        durationMs: 2_500,
        overflow: notificationOptions.overflow,
      },
      nowMs,
    );
    return dependencies.notifications.apply(model, notifications, nowMs);
  };
  return {
    cycleSetting(model, row) {
      const nextTheme = resolveNextShellTheme(
        dependencies.resolveThemes(),
        model.activeShellThemeId,
      );
      if (nextTheme == null) return [model, []];
      dependencies.publishTheme(nextTheme);
      return dependencies.notifications.pushSettingsFeedback(
        { ...model, activeShellThemeId: nextTheme.id },
        row,
      );
    },
    toggle(model) {
      dependencies.ensureThemes(dependencies.resolveContext());
      const themes = dependencies.resolveThemes();
      const current = resolveCurrentShellTheme(
        themes,
        model.activeShellThemeId,
      );
      const next = resolveShellThemeModeToggle(
        themes,
        model.activeShellThemeId,
      );
      if (next == null) {
        return current == null
          ? [model, []]
          : pushModeFeedback(model, current, true);
      }
      dependencies.publishTheme(next);
      return pushModeFeedback(
        { ...model, activeShellThemeId: next.id },
        next,
        false,
      );
    },
  };
}
