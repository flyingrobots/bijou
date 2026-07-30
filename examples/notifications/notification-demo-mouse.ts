import type { BijouContext } from '@flyingrobots/bijou';
import { resolveClock } from '@flyingrobots/bijou';
import {
  dismissNotification,
  renderNotificationStack,
  stripAnsi,
  type Cmd,
  type MouseMsg,
} from '../../packages/bijou-tui/src/index.js';
import type {
  NotificationDemoModel,
  NotificationDemoMsg,
  NotificationDemoUpdate,
} from './notification-demo-contract.js';
import { applyNotificationState } from './notification-demo-overlay.js';
import { ctx } from './notification-demo-options.js';
import { appendLog, mouseText, numberText } from './notification-demo-state.js';

function notificationRegion(notificationCtx: BijouContext) {
  return {
    row: 2,
    col: 0,
    width: notificationCtx.runtime.columns,
    height: Math.max(0, notificationCtx.runtime.rows - 2),
  };
}

function resolveMouseTarget(
  model: NotificationDemoModel,
  msg: MouseMsg,
  notificationCtx: BijouContext,
) {
  const overlays = renderNotificationStack(model.notifications, {
    screenWidth: notificationCtx.runtime.columns,
    screenHeight: notificationCtx.runtime.rows,
    region: notificationRegion(notificationCtx),
    margin: 2,
    gap: 1,
    ctx: notificationCtx,
  });

  for (const overlay of [...overlays].reverse()) {
    const surface = overlay.surface;
    if (
      surface == null ||
      msg.col < overlay.col ||
      msg.col >= overlay.col + surface.width ||
      msg.row < overlay.row ||
      msg.row >= overlay.row + surface.height
    )
      continue;

    const item = model.notifications.items.find((candidate) =>
      stripAnsi(overlay.content).includes(candidate.title),
    );
    if (item == null) continue;
    const localCol = msg.col - overlay.col;
    const localRow = msg.row - overlay.row;
    if (localRow === 0 && localCol === surface.width - 2) {
      return { item, kind: 'dismiss' as const };
    }
    if (
      item.variant === 'ACTIONABLE' &&
      localRow === surface.height - 1 &&
      localCol >= 2
    ) {
      return { item, kind: 'action' as const };
    }
    return { item, kind: 'body' as const };
  }
  return undefined;
}

export function handleNotificationMouse(
  model: NotificationDemoModel,
  msg: MouseMsg,
  notificationCtx: BijouContext = ctx,
): NotificationDemoUpdate {
  if (msg.action !== 'press' || msg.button !== 'left') return [model, []];
  const target = resolveMouseTarget(model, msg, notificationCtx);
  if (target == null) return [model, []];
  if (target.kind === 'body') return [model, []];

  const notifications = dismissNotification(
    model.notifications,
    target.item.id,
    resolveClock(notificationCtx).now(),
  );
  const action = target.kind === 'action' ? target.item.action : undefined;
  const verb = action == null ? 'Dismissed' : 'Activated';
  const nextModel = appendLog(
    {
      ...model,
      notifications,
      lastHandledInput: mouseText(msg),
    },
    `[mouse] ${verb} notification #${numberText(target.item.id)}.`,
  );

  if (action == null) {
    return applyNotificationState(nextModel, notifications, notificationCtx);
  }
  const command: Cmd<NotificationDemoMsg> = () => action.payload;
  return applyNotificationState(nextModel, notifications, notificationCtx, [
    command,
  ]);
}
