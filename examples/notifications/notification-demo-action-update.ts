import type { BijouContext } from '@flyingrobots/bijou';
import { resolveClock } from '@flyingrobots/bijou';
import {
  activateFocusedNotification,
  cycleNotificationFocus,
  quit,
  tickNotifications,
  type FramePageMsg,
} from '../../packages/bijou-tui/src/index.js';
import type {
  NotificationDemoModel,
  NotificationDemoMsg,
  NotificationDemoUpdate,
} from './notification-demo-contract.js';
import {
  applyNotificationState,
  dismissCurrentNotification,
} from './notification-demo-overlay.js';
import { ctx } from './notification-demo-options.js';
import {
  appendLog,
  numberText,
  recordInput,
} from './notification-demo-state.js';

type NotificationActionType =
  | 'focus-next'
  | 'focus-prev'
  | 'dismiss-notification'
  | 'activate-focused'
  | 'notification-action'
  | 'notification-tick'
  | 'key-observed'
  | 'quit-app'
  | 'pulse';

type NotificationActionMsg = Extract<
  FramePageMsg<NotificationDemoMsg>,
  { readonly type: NotificationActionType }
>;

export function updateNotificationActions(
  msg: NotificationActionMsg,
  model: NotificationDemoModel,
  notificationCtx: BijouContext = ctx,
): NotificationDemoUpdate {
  switch (msg.type) {
    case 'focus-next':
    case 'focus-prev': {
      const next = msg.type === 'focus-next';
      return [
        recordInput(
          {
            ...model,
            notifications: cycleNotificationFocus(
              model.notifications,
              next ? 1 : -1,
            ),
          },
          next ? 'j' : 'k',
          `Focused ${next ? 'next' : 'previous'} actionable notification.`,
        ),
        [],
      ];
    }
    case 'dismiss-notification':
      return dismissCurrentNotification(model, notificationCtx);
    case 'activate-focused': {
      const result = activateFocusedNotification(
        model.notifications,
        resolveClock(notificationCtx).now(),
      );
      const next =
        result.payload?.type === 'notification-action'
          ? recordInput(
              { ...model, notifications: result.state },
              'enter',
              `Action fired from notification #${numberText(result.payload.ordinal)}.`,
            )
          : { ...model, notifications: result.state };
      return applyNotificationState(next, next.notifications, notificationCtx);
    }
    case 'notification-action':
      return [
        appendLog(
          model,
          `Notification #${numberText(msg.ordinal)} delivered its action payload.`,
        ),
        [],
      ];
    case 'notification-tick': {
      const notifications = tickNotifications(
        model.notifications,
        resolveClock(notificationCtx).now(),
      );
      return applyNotificationState(
        { ...model, notifications },
        notifications,
        notificationCtx,
        [],
        true,
      );
    }
    case 'key-observed':
      return [
        appendLog(
          { ...model, lastHandledInput: `${msg.key}:${msg.route}` },
          `[key ${msg.key}] route=${msg.route}`,
        ),
        [],
      ];
    case 'quit-app':
      return [model, [quit()]];
    case 'pulse':
      return [model, []];
  }
}
