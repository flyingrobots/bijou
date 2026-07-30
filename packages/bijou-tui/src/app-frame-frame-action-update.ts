import { resolveClock } from '@flyingrobots/bijou';
import type { Cmd } from './types.js';
import type { FramePage } from './app-frame-page-contract.js';
import type { CreateFramedAppOptions } from './app-frame-options.js';
import type {
  FrameAction,
  FramedAppMsg,
  InternalFrameModel,
} from './app-frame-types.js';
import { applyFrameAction } from './app-frame-actions.js';
import { pushNotification, tickNotifications } from './notification.js';
import type {
  FrameNotificationStateServices,
} from './app-frame-notification-state.js';
import type {
  ResolvedFrameNotificationOptions,
} from './app-frame-notification-runtime.js';
import type { FrameThemeModeServices } from './app-frame-theme-mode.js';
import type { FrameThemeRuntime } from './app-frame-theme-runtime.js';
import { updateFrameTransition } from './app-frame-transition-update.js';

export interface FrameActionUpdateDependencies<PageModel, Msg> {
  readonly options: CreateFramedAppOptions<PageModel, Msg>;
  readonly pagesById: Map<string, FramePage<PageModel, Msg>>;
  readonly notificationOptions: ResolvedFrameNotificationOptions;
  readonly notificationState: FrameNotificationStateServices<PageModel, Msg>;
  readonly themeMode: FrameThemeModeServices<PageModel, Msg>;
  readonly themeRuntime: FrameThemeRuntime<PageModel, Msg>;
}

export function updateFrameScopedAction<PageModel, Msg>(
  action: FrameAction,
  model: InternalFrameModel<PageModel, Msg>,
  dependencies: FrameActionUpdateDependencies<PageModel, Msg>,
): [
  InternalFrameModel<PageModel, Msg>,
  Cmd<FramedAppMsg<Msg>>[],
] {
  const { notificationOptions, notificationState } = dependencies;
  if (action.type === 'runtime-issue') {
    if (!notificationOptions.enabled) return [model, []];
    const notifications = pushNotification(
      model.runtimeNotifications,
      {
        title:
          action.issue.level === 'warning'
            ? 'Framework warning'
            : 'Runtime error',
        message: action.issue.message,
        variant: 'TOAST',
        tone: action.issue.level === 'warning' ? 'WARNING' : 'ERROR',
        placement: notificationOptions.placement,
        durationMs: notificationOptions.durationMs,
        overflow: notificationOptions.overflow,
      },
      action.issue.atMs,
    );
    return notificationState.apply(
      model,
      notifications,
      action.issue.atMs,
    );
  }
  if (action.type === 'push-notification') {
    if (!notificationOptions.enabled) return [model, []];
    const nowMs = resolveClock(
      dependencies.themeRuntime.resolveContext(),
    ).now();
    const notifications = pushNotification(
      model.runtimeNotifications,
      {
        ...action.notification,
        placement:
          action.notification.placement ??
          notificationOptions.placement,
        durationMs:
          action.notification.durationMs === undefined
            ? notificationOptions.durationMs
            : action.notification.durationMs,
        overflow:
          action.notification.overflow ??
          notificationOptions.overflow,
      },
      nowMs,
    );
    return notificationState.apply(model, notifications, nowMs);
  }
  if (action.type === 'notification-tick') {
    return notificationState.apply(
      model,
      tickNotifications(model.runtimeNotifications, action.atMs),
      action.atMs,
      true,
    );
  }
  if (action.type === 'toggle-shell-theme-mode') {
    return dependencies.themeMode.toggle(model);
  }
  if (
    action.type === 'transition' ||
    action.type === 'transition-complete'
  ) {
    return updateFrameTransition(action, model);
  }
  return applyFrameAction(
    action,
    model,
    dependencies.options,
    dependencies.pagesById,
  );
}
