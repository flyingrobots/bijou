import type { NotificationPlacement, NotificationState } from './notification.part01.js';

import { focusableIds } from './notification.part05.js';

import { normalizeFocusedId } from './notification.part06.js';
export function dismissNotification<Msg>(
  state: NotificationState<Msg>,
  id: number,
  nowMs: number,
): NotificationState<Msg> {
  const items = state.items.map((item) => {
    if (item.id !== id || item.phase === 'exiting') return item;
    return {
      ...item,
      phase: 'exiting' as const,
      updatedAtMs: nowMs,
      exitStartedAtMs: nowMs,
    };
  });

  return {
    ...state,
    items,
    focusedId: normalizeFocusedId(items, state.focusedId),
  };
}
export function dismissFocusedNotification<Msg>(
  state: NotificationState<Msg>,
  nowMs: number,
): NotificationState<Msg> {
  if (state.focusedId == null) return state;
  return dismissNotification(state, state.focusedId, nowMs);
}
export function relocateNotifications<Msg>(
  state: NotificationState<Msg>,
  placement: NotificationPlacement,
  nowMs?: number,
): NotificationState<Msg> {
  if (state.items.every((item) => item.placement === placement)) return state;
  return {
    ...state,
    items: state.items.map((item) => {
      if (nowMs == null || item.phase === 'exiting') {
        return { ...item, placement };
      }

      return {
        ...item,
        placement,
        phase: 'entering' as const,
        progress: 0,
        updatedAtMs: nowMs,
        enteredAtMs: undefined,
        exitStartedAtMs: undefined,
      };
    }),
  };
}
export function cycleNotificationFocus<Msg>(
  state: NotificationState<Msg>,
  delta: number,
): NotificationState<Msg> {
  const focusable = focusableIds(state.items);
  if (focusable.length === 0) return state;

  const index = state.focusedId == null ? -1 : focusable.indexOf(state.focusedId);
  const nextIndex = index < 0
    ? (delta >= 0 ? 0 : focusable.length - 1)
    : (index + delta + focusable.length) % focusable.length;

  return {
    ...state,
    focusedId: focusable[nextIndex],
  };
}
export function activateFocusedNotification<Msg>(
  state: NotificationState<Msg>,
  nowMs: number,
): { readonly state: NotificationState<Msg>; readonly payload?: Msg } {
  if (state.focusedId == null) return { state };
  const target = state.items.find((item) => item.id === state.focusedId);
  if (target?.action == null) return { state };
  return {
    state: dismissNotification(state, target.id, nowMs),
    payload: target.action.payload,
  };
}
