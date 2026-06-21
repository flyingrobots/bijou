import type { NotificationRecord, NotificationSpec, NotificationState } from './notification.part01.js';

import { EXIT_DURATION_MS, HISTORY_LIMIT } from './notification.part02.js';

import { defaultDurationMs, focusableIds } from './notification.part05.js';
export function normalizeFocusedId<Msg>(
  items: readonly NotificationRecord<Msg>[],
  focusedId: number | undefined,
): number | undefined {
  const focusable = focusableIds(items);
  if (focusable.length === 0) return undefined;
  if (focusedId != null && focusable.includes(focusedId)) return focusedId;
  return focusable[focusable.length - 1];
}
export function archiveNotifications<Msg>(
  history: readonly NotificationRecord<Msg>[],
  items: readonly NotificationRecord<Msg>[],
): readonly NotificationRecord<Msg>[] {
  if (items.length === 0) return history;
  const archived = [...items].sort(
    (left, right) => right.updatedAtMs - left.updatedAtMs || right.id - left.id,
  );
  return [...archived, ...history].slice(0, HISTORY_LIMIT);
}
export function advanceExitRecord<Msg>(
  item: NotificationRecord<Msg>,
  nowMs: number,
): { readonly active?: NotificationRecord<Msg>; readonly archived?: NotificationRecord<Msg> } {
  const deltaMs = Math.max(0, nowMs - item.updatedAtMs);
  const progress = Math.max(0, item.progress - (deltaMs / EXIT_DURATION_MS));

  if (progress > 0) {
    return {
      active: {
        ...item,
        progress,
        updatedAtMs: nowMs,
      },
    };
  }

  return {
    archived: {
      ...item,
      progress: 0,
      updatedAtMs: nowMs,
    },
  };
}
export function pushNotification<Msg>(
  state: NotificationState<Msg>,
  spec: NotificationSpec<Msg>,
  nowMs: number,
): NotificationState<Msg> {
  const variant = spec.variant ?? 'TOAST';
  const next: NotificationRecord<Msg> = {
    id: state.nextId,
    title: spec.title,
    message: spec.message ?? '',
    variant,
    tone: spec.tone ?? 'INFO',
    width: spec.width,
    durationMs: spec.durationMs === undefined ? defaultDurationMs(variant) : spec.durationMs,
    placement: spec.placement ?? 'LOWER_RIGHT',
    action: spec.action,
    bgToken: spec.bgToken,
    accentToken: spec.accentToken,
    overflow: spec.overflow ?? 'wrap',
    createdAtMs: nowMs,
    updatedAtMs: nowMs,
    phase: 'entering',
    progress: 0,
  };

  const items = [...state.items, next];
  return {
    ...state,
    items,
    nextId: state.nextId + 1,
    focusedId: normalizeFocusedId(items, next.action != null ? next.id : state.focusedId),
  };
}
