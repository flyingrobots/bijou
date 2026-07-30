import type {
  MouseMsg,
  NotificationHistoryFilter,
} from '../../packages/bijou-tui/src/index.js';
import { createNotificationState } from '../../packages/bijou-tui/src/index.js';
import type { NotificationDemoModel } from './notification-demo-contract.js';
import {
  DURATION_OPTIONS,
  HISTORY_FILTERS,
  PLACEMENTS,
  TONES,
  VARIANTS,
} from './notification-demo-options.js';

export function at<T>(values: readonly T[], index: number): T {
  const value = values[index];
  if (value === undefined) throw new Error('Bad notification state.');
  return value;
}

export function createInitialPageModel(): NotificationDemoModel {
  return {
    notifications: createNotificationState(),
    notificationLoopActive: false,
    variantIndex: 0,
    toneIndex: 0,
    placementIndex: 3,
    durationIndex: 0,
    actionEnabled: true,
    wrapText: true,
    historyFilterIndex: 0,
    nextOrdinal: 1,
    lastHandledInput: 'none',
    log: ['Notification lab ready.', 'Press n to spawn a new notification.'],
  };
}

export function currentVariant(model: NotificationDemoModel) {
  return at(VARIANTS, model.variantIndex);
}

export function currentTone(model: NotificationDemoModel) {
  return at(TONES, model.toneIndex);
}

export function currentPlacement(model: NotificationDemoModel) {
  return at(PLACEMENTS, model.placementIndex);
}

export function currentDuration(model: NotificationDemoModel) {
  return at(DURATION_OPTIONS, model.durationIndex);
}

export function currentHistoryFilter(
  model: NotificationDemoModel,
): NotificationHistoryFilter {
  return at(HISTORY_FILTERS, model.historyFilterIndex);
}

export function appendLog(
  model: NotificationDemoModel,
  message: string,
): NotificationDemoModel {
  return { ...model, log: [message, ...model.log].slice(0, 12) };
}

export function recordInput(
  model: NotificationDemoModel,
  key: string,
  message: string,
): NotificationDemoModel {
  return appendLog({ ...model, lastHandledInput: key }, `[${key}] ${message}`);
}

export function numberText(value: number): string {
  return String(value);
}

export function mouseText(msg: MouseMsg): string {
  return `mouse:${numberText(msg.col)},${numberText(msg.row)}`;
}
