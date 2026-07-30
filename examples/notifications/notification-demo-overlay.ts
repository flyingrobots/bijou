import type { BijouContext } from '@flyingrobots/bijou';
import { resolveClock } from '@flyingrobots/bijou';
import {
  dismissFocusedNotification,
  dismissNotification,
  notificationsNeedTick,
  pushNotification,
  tick,
  trimNotificationsToViewport,
  type Cmd,
  type NotificationSpec,
  type NotificationState,
} from '../../packages/bijou-tui/src/index.js';
import type {
  NotificationDemoModel,
  NotificationDemoMsg,
  NotificationDemoUpdate,
} from './notification-demo-contract.js';
import {
  actionLabelForTone,
  formatDurationLabel,
  toneCopy,
} from './notification-demo-copy.js';
import {
  NOTIFICATION_TICK_MS,
  ctx,
  demoNotificationStackSpacing,
} from './notification-demo-options.js';
import {
  appendLog,
  currentDuration,
  currentPlacement,
  currentTone,
  currentVariant,
  numberText,
  recordInput,
} from './notification-demo-state.js';

export function applyNotificationState(
  model: NotificationDemoModel,
  notifications: NotificationState<NotificationDemoMsg>,
  notificationCtx: BijouContext = ctx,
  commands: readonly Cmd<NotificationDemoMsg>[] = [],
  forceTick = false,
): NotificationDemoUpdate {
  const height = Math.max(0, notificationCtx.runtime.rows - 2);
  const clock = resolveClock(notificationCtx);
  const trimmed = trimNotificationsToViewport(
    notifications,
    {
      screenWidth: notificationCtx.runtime.columns,
      screenHeight: height,
      ...demoNotificationStackSpacing(
        notificationCtx.runtime.columns,
        height,
      ),
      ctx: notificationCtx,
    },
    clock.now(),
  );
  const needsTick = notificationsNeedTick(trimmed);
  const nextModel = {
    ...model,
    notifications: trimmed,
    notificationLoopActive: needsTick,
  };
  const shouldSchedule =
    needsTick && (forceTick || !model.notificationLoopActive);

  return [
    nextModel,
    shouldSchedule
      ? [
          ...commands,
          tick(NOTIFICATION_TICK_MS, {
            type: 'notification-tick',
          }),
        ]
      : [...commands],
  ];
}

export function spawnConfiguredNotification(
  model: NotificationDemoModel,
  notificationCtx: BijouContext = ctx,
): NotificationDemoUpdate {
  const ordinal = model.nextOrdinal;
  const variant = currentVariant(model);
  const tone = currentTone(model);
  const placement = currentPlacement(model);
  const duration = currentDuration(model);
  const copy = toneCopy(tone);
  const spec: NotificationSpec<NotificationDemoMsg> = {
    title: `${copy.title} #${numberText(ordinal)}`,
    message: `${copy.message} ${variant} @ ${placement} • ${duration.label}`,
    variant,
    tone,
    placement,
    durationMs: duration.value,
    action:
      variant === 'ACTIONABLE' && model.actionEnabled
        ? {
            label: actionLabelForTone(tone),
            payload: { type: 'notification-action', ordinal },
          }
        : undefined,
    overflow: model.wrapText ? 'wrap' : 'truncate',
  };
  const notifications = pushNotification(
    model.notifications,
    spec,
    resolveClock(notificationCtx).now(),
  );
  const nextModel = appendLog(
    {
      ...model,
      lastHandledInput: 'n',
      notifications,
      nextOrdinal: ordinal + 1,
    },
    `[n] Spawned ${variant} #${numberText(ordinal)} at ${placement} (${formatDurationLabel(duration.value)}).`,
  );

  return applyNotificationState(nextModel, notifications, notificationCtx);
}

export function dismissCurrentNotification(
  model: NotificationDemoModel,
  notificationCtx: BijouContext = ctx,
): NotificationDemoUpdate {
  const nowMs = resolveClock(notificationCtx).now();
  const latest = model.notifications.items.at(-1);
  const notifications =
    model.notifications.focusedId != null
      ? dismissFocusedNotification(model.notifications, nowMs)
      : latest == null
        ? model.notifications
        : dismissNotification(model.notifications, latest.id, nowMs);

  if (notifications === model.notifications) return [model, []];
  const nextModel = recordInput(
    { ...model, notifications },
    'x',
    'Dismissed a notification.',
  );
  return applyNotificationState(nextModel, notifications, notificationCtx);
}
