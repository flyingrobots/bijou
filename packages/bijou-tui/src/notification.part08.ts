import type { NotificationRecord, NotificationState } from './notification.part01.js';

import { ENTER_DURATION_MS } from './notification.part02.js';

import { advanceExitRecord, archiveNotifications, normalizeFocusedId } from './notification.part06.js';
export function tickNotifications<Msg>(
  state: NotificationState<Msg>,
  nowMs: number,
): NotificationState<Msg> {
  const nextItems: NotificationRecord<Msg>[] = [];
  const archived: NotificationRecord<Msg>[] = [];
  const nextOverflowExits: NotificationRecord<Msg>[] = [];
  const archivedOverflowExits: NotificationRecord<Msg>[] = [];

  for (const item of state.items) {
    const deltaMs = Math.max(0, nowMs - item.updatedAtMs);

    if (item.phase === 'entering') {
      const progress = Math.min(1, item.progress + (deltaMs / ENTER_DURATION_MS));
      nextItems.push(progress >= 1
        ? {
          ...item,
          phase: 'visible',
          progress: 1,
          enteredAtMs: nowMs,
          updatedAtMs: nowMs,
        }
        : {
          ...item,
          progress,
          updatedAtMs: nowMs,
        });
      continue;
    }

    if (item.phase === 'visible') {
      const visibleSince = item.enteredAtMs ?? item.createdAtMs;
      if (item.durationMs != null && nowMs - visibleSince >= item.durationMs) {
        nextItems.push({
          ...item,
          phase: 'exiting',
          exitStartedAtMs: nowMs,
          updatedAtMs: nowMs,
        });
      } else {
        nextItems.push({
          ...item,
          updatedAtMs: nowMs,
        });
      }
      continue;
    }

    const result = advanceExitRecord(item, nowMs);
    if (result.active != null) {
      nextItems.push(result.active);
      continue;
    }

    if (result.archived != null) {
      archived.push(result.archived);
    }
  }

  for (const item of state.overflowExits) {
    const result = advanceExitRecord(item, nowMs);
    if (result.active != null) {
      nextOverflowExits.push(result.active);
      continue;
    }

    if (result.archived != null) {
      archivedOverflowExits.push(result.archived);
    }
  }

  return {
    ...state,
    items: nextItems,
    overflowExits: nextOverflowExits,
    history: archiveNotifications(state.history, [...archived, ...archivedOverflowExits]),
    focusedId: normalizeFocusedId(nextItems, state.focusedId),
  };
}
export function hasNotifications<Msg>(state: NotificationState<Msg>): boolean {
  return state.items.length > 0;
}
export function notificationsNeedTick<Msg>(state: NotificationState<Msg>): boolean {
  return state.overflowExits.length > 0
    || state.items.some((item) => item.phase !== 'visible' || item.durationMs != null);
}
