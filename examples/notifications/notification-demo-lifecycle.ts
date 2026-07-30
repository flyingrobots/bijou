import type { BijouContext } from '@flyingrobots/bijou';
import { resolveClock } from '@flyingrobots/bijou';
import { pushNotification } from '../../packages/bijou-tui/src/index.js';
import type { NotificationDemoModel } from './notification-demo-contract.js';
import { ctx } from './notification-demo-options.js';
import { appendLog, numberText } from './notification-demo-state.js';

const SEED_NOTIFICATIONS = [
  {
    title: 'Deploy blocked',
    message: 'Retryable actionable notice in the upper right.',
    variant: 'ACTIONABLE' as const,
    tone: 'ERROR' as const,
    placement: 'UPPER_RIGHT' as const,
    durationMs: null,
    actionLabel: 'Retry deploy',
  },
  {
    title: 'Queue pressure rising',
    message: 'Inline notice centered at the top edge.',
    variant: 'INLINE' as const,
    tone: 'WARNING' as const,
    placement: 'TOP_CENTER' as const,
    durationMs: 5_000,
  },
  {
    title: 'Release shipped cleanly',
    message: 'Toast variant stacked near the lower-right anchor.',
    variant: 'TOAST' as const,
    tone: 'SUCCESS' as const,
    placement: 'LOWER_RIGHT' as const,
    durationMs: 4_000,
  },
] as const;

export function seedDemoNotifications(
  model: NotificationDemoModel,
  notificationCtx: BijouContext = ctx,
): NotificationDemoModel {
  let next = model;
  let nowMs = resolveClock(notificationCtx).now();
  for (const entry of SEED_NOTIFICATIONS) {
    const ordinal = next.nextOrdinal;
    const notifications = pushNotification(
      next.notifications,
      {
        title: `${entry.title} #${numberText(ordinal)}`,
        message: entry.message,
        variant: entry.variant,
        tone: entry.tone,
        placement: entry.placement,
        durationMs: entry.durationMs,
        action:
          'actionLabel' in entry
            ? {
                label: entry.actionLabel,
                payload: { type: 'notification-action', ordinal },
              }
            : undefined,
        overflow: next.wrapText ? 'wrap' : 'truncate',
      },
      nowMs,
    );
    next = appendLog(
      {
        ...next,
        notifications,
        nextOrdinal: ordinal + 1,
      },
      `Seeded ${entry.variant} #${numberText(ordinal)} for automated smoke rendering.`,
    );
    nowMs += 60;
  }
  return next;
}
