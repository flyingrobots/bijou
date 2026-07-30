import { resolveClock, type BijouContext } from '@flyingrobots/bijou';
import type { Cmd } from './types.js';
import type { FrameSettingRow } from './app-frame-settings-contract.js';
import type {
  FramedAppMsg,
  InternalFrameModel,
} from './app-frame-types.js';
import { emitMsgForPage } from './app-frame-types.js';
import type {
  NotificationState,
} from './notification.js';
import {
  notificationsNeedTick,
  pushNotification,
  trimNotificationsToViewport,
} from './notification.js';
import type {
  ResolvedFrameNotificationOptions,
} from './app-frame-notification-runtime.js';
import { createFrameNotificationTickCmd } from './app-frame-notification-runtime.js';

const SETTINGS_FEEDBACK_TOAST_WIDTH = 40;

export interface FrameNotificationStateServices<PageModel, Msg> {
  apply(
    model: InternalFrameModel<PageModel, Msg>,
    notifications: NotificationState<never>,
    nowMs: number,
    forceTick?: boolean,
  ): [InternalFrameModel<PageModel, Msg>, Cmd<FramedAppMsg<Msg>>[]];
  pushSettingsFeedback(
    model: InternalFrameModel<PageModel, Msg>,
    row: FrameSettingRow<Msg>,
  ): [InternalFrameModel<PageModel, Msg>, Cmd<FramedAppMsg<Msg>>[]];
  activateSettingsRow(
    model: InternalFrameModel<PageModel, Msg>,
    row: FrameSettingRow<Msg>,
  ): [InternalFrameModel<PageModel, Msg>, Cmd<FramedAppMsg<Msg>>[]];
}

export function createFrameNotificationStateServices<PageModel, Msg>(
  frameOptions: ResolvedFrameNotificationOptions,
  resolveFrameContext: () => BijouContext | undefined,
): FrameNotificationStateServices<PageModel, Msg> {
  const apply = (
    model: InternalFrameModel<PageModel, Msg>,
    notifications: NotificationState<never>,
    nowMs: number,
    forceTick = false,
  ): [InternalFrameModel<PageModel, Msg>, Cmd<FramedAppMsg<Msg>>[]] => {
    const trimmed = trimNotificationsToViewport(
      notifications,
      {
        screenWidth: model.columns,
        screenHeight: model.rows,
        margin: frameOptions.margin,
        gap: frameOptions.gap,
      },
      nowMs,
    );
    const needsTick = notificationsNeedTick(trimmed);
    const nextModel = {
      ...model,
      runtimeNotifications: trimmed,
      runtimeNotificationLoopActive: needsTick,
    };
    return needsTick && (forceTick || !model.runtimeNotificationLoopActive)
      ? [nextModel, [createFrameNotificationTickCmd<Msg>()]]
      : [nextModel, []];
  };
  const pushSettingsFeedback = (
    model: InternalFrameModel<PageModel, Msg>,
    row: FrameSettingRow<Msg>,
  ): [InternalFrameModel<PageModel, Msg>, Cmd<FramedAppMsg<Msg>>[]] => {
    if (!frameOptions.enabled) return [model, []];
    const feedback = row.feedback ?? {
      title: 'Setting updated',
      message: `${row.label} updated.`,
    };
    const nowMs = resolveClock(resolveFrameContext()).now();
    const notifications = pushNotification(
      model.runtimeNotifications,
      {
        title: feedback.title ?? 'Setting updated',
        message: feedback.message,
        variant: 'TOAST',
        tone: feedback.tone ?? 'INFO',
        width: SETTINGS_FEEDBACK_TOAST_WIDTH,
        placement: frameOptions.placement,
        durationMs: feedback.durationMs ?? 2_500,
        overflow: frameOptions.overflow,
      },
      nowMs,
    );
    return apply(model, notifications, nowMs);
  };
  return {
    apply,
    pushSettingsFeedback,
    activateSettingsRow(model, row) {
      if (
        row.action === undefined ||
        row.enabled === false ||
        row.kind === 'info'
      ) {
        return [model, []];
      }
      const [nextModel, commands] = pushSettingsFeedback(model, row);
      return [
        nextModel,
        [
          emitMsgForPage(model.activePageId, row.action),
          ...commands,
        ],
      ];
    },
  };
}
