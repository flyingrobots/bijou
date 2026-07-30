import type { BijouContext } from '@flyingrobots/bijou';
import { resolveClock } from '@flyingrobots/bijou';
import {
  isMouseMsg,
  relocateNotifications,
  type FramePageMsg,
} from '../../packages/bijou-tui/src/index.js';
import type {
  NotificationDemoModel,
  NotificationDemoMsg,
  NotificationDemoUpdate,
} from './notification-demo-contract.js';
import { updateNotificationActions } from './notification-demo-action-update.js';
import { handleNotificationMouse } from './notification-demo-mouse.js';
import {
  applyNotificationState,
  spawnConfiguredNotification,
} from './notification-demo-overlay.js';
import {
  DURATION_OPTIONS,
  HISTORY_FILTERS,
  PLACEMENTS,
  TONES,
  VARIANTS,
  ctx,
} from './notification-demo-options.js';
import {
  appendLog,
  at,
  currentHistoryFilter,
  recordInput,
} from './notification-demo-state.js';

function cycleOption(
  model: NotificationDemoModel,
  field: 'variantIndex' | 'toneIndex' | 'durationIndex',
  values: readonly { readonly toString: () => string }[],
  key: string,
  label: string,
): NotificationDemoUpdate {
  const nextIndex = (model[field] + 1) % values.length;
  const value = at(values, nextIndex);
  return [
    recordInput(
      { ...model, [field]: nextIndex },
      key,
      `${label} -> ${value.toString()}.`,
    ),
    [],
  ];
}

export function updateNotificationDemo(
  msg: FramePageMsg<NotificationDemoMsg>,
  model: NotificationDemoModel,
  notificationCtx: BijouContext = ctx,
): NotificationDemoUpdate {
  if (isMouseMsg(msg)) {
    return handleNotificationMouse(model, msg, notificationCtx);
  }
  switch (msg.type) {
    case 'spawn-notification':
      return spawnConfiguredNotification(model, notificationCtx);
    case 'cycle-variant':
      return cycleOption(model, 'variantIndex', VARIANTS, 'v', 'Variant');
    case 'cycle-tone':
      return cycleOption(model, 'toneIndex', TONES, 't', 'Tone');
    case 'cycle-duration': {
      const nextIndex = (model.durationIndex + 1) % DURATION_OPTIONS.length;
      return [
        recordInput(
          { ...model, durationIndex: nextIndex },
          'd',
          `Duration -> ${at(DURATION_OPTIONS, nextIndex).label}.`,
        ),
        [],
      ];
    }
    case 'cycle-placement': {
      const nextIndex = (model.placementIndex + 1) % PLACEMENTS.length;
      const placement = at(PLACEMENTS, nextIndex);
      const notifications = relocateNotifications(
        model.notifications,
        placement,
        resolveClock(notificationCtx).now(),
      );
      const nextModel = appendLog(
        {
          ...model,
          lastHandledInput: 'l',
          placementIndex: nextIndex,
          notifications,
        },
        `[l] Placement -> ${placement}; active notifications relocated.`,
      );
      return applyNotificationState(nextModel, notifications, notificationCtx);
    }
    case 'toggle-action':
      return [
        recordInput(
          { ...model, actionEnabled: !model.actionEnabled },
          'a',
          `Action button ${!model.actionEnabled ? 'enabled' : 'disabled'}.`,
        ),
        [],
      ];
    case 'toggle-wrap':
      return [
        recordInput(
          { ...model, wrapText: !model.wrapText },
          'w',
          `Wrap ${!model.wrapText ? 'enabled' : 'disabled'}.`,
        ),
        [],
      ];
    case 'set-history-filter':
      if (msg.filter === currentHistoryFilter(model)) return [model, []];
      return [
        recordInput(
          {
            ...model,
            historyFilterIndex: HISTORY_FILTERS.indexOf(msg.filter),
          },
          'f',
          `History filter -> ${msg.filter}.`,
        ),
        [],
      ];
    case 'focus-next':
    case 'focus-prev':
    case 'dismiss-notification':
    case 'activate-focused':
    case 'notification-action':
    case 'notification-tick':
    case 'key-observed':
    case 'quit-app':
    case 'pulse':
      return updateNotificationActions(msg, model, notificationCtx);
  }
}
