import { normalizeFocusedId, type NotificationState, type RenderNotificationStackOptions } from './notification.js';
import { selectVisibleNotificationIds } from './notification-stack-selection.js';

export function trimNotificationsToViewport<Msg>(
  state: NotificationState<Msg>,
  options: RenderNotificationStackOptions,
  nowMs?: number,
): NotificationState<Msg> {
  const visibleIds = selectVisibleNotificationIds(state, options);
  const keptItems = state.items.filter((item) => visibleIds.has(item.id));

  if (keptItems.length === state.items.length) {
    const focusedId = normalizeFocusedId(keptItems, state.focusedId);
    return focusedId === state.focusedId ? state : { ...state, focusedId };
  }

  const evictedItems = state.items.filter((item) => !visibleIds.has(item.id));
  const exitStartedAtMs = nowMs ?? evictedItems.reduce(
    (max, item) => Math.max(max, item.updatedAtMs, item.createdAtMs),
    0,
  );
  const overflowExits = [
    ...state.overflowExits,
    ...evictedItems.map((item) => ({
      ...item,
      phase: 'exiting' as const,
      progress: 1,
      updatedAtMs: exitStartedAtMs,
      exitStartedAtMs,
    })),
  ].sort((left, right) => right.updatedAtMs - left.updatedAtMs || right.id - left.id);

  return {
    ...state,
    items: keptItems,
    overflowExits,
    focusedId: normalizeFocusedId(keptItems, state.focusedId),
  };
}
