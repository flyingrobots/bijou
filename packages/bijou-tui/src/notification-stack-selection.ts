import { resolveNotificationGap, resolveOverlayMargin } from './design-language.js';
import { renderNotificationSurface, type NotificationRenderEntry } from './notification-card.js';
import { resolveRegion, type NotificationPlacement, type NotificationRecord, type NotificationState, type RenderNotificationStackOptions } from './notification.js';

function createRenderEntry<Msg>(
  item: NotificationRecord<Msg>,
  options: RenderNotificationStackOptions,
  focusedId: number | undefined,
): NotificationRenderEntry<Msg> {
  return renderNotificationSurface(item, options, focusedId === item.id);
}

export function prepareRenderEntriesById<Msg>(
  items: readonly NotificationRecord<Msg>[],
  options: RenderNotificationStackOptions,
  focusedId: number | undefined,
): ReadonlyMap<number, NotificationRenderEntry<Msg>> {
  const prepared = new Map<number, NotificationRenderEntry<Msg>>();
  for (const item of items) {
    prepared.set(item.id, createRenderEntry(item, options, focusedId));
  }
  return prepared;
}

export function selectVisibleNotificationIds<Msg>(
  state: NotificationState<Msg>,
  options: RenderNotificationStackOptions,
  preparedEntries: ReadonlyMap<number, NotificationRenderEntry<Msg>> = prepareRenderEntriesById(
    state.items,
    options,
    state.focusedId,
  ),
): ReadonlySet<number> {
  const region = resolveRegion(options);
  const margin = resolveOverlayMargin(region.width, region.height, options.margin);
  const gap = resolveNotificationGap(options.gap);
  const availableHeight = Math.max(1, region.height - (margin * 2));
  const grouped = new Map<NotificationPlacement, NotificationRecord<Msg>[]>();

  for (const item of state.items) {
    const placementItems = grouped.get(item.placement) ?? [];
    placementItems.push(item);
    grouped.set(item.placement, placementItems);
  }

  const visibleIds = new Set<number>();

  for (const items of grouped.values()) {
    const newestFirst = [...items].sort((left, right) => right.createdAtMs - left.createdAtMs || right.id - left.id);
    let usedHeight = 0;
    let keptCount = 0;

    for (const item of newestFirst) {
      const entry = preparedEntries.get(item.id);
      if (entry === undefined) continue;
      const required = entry.surface.height + (keptCount > 0 ? gap : 0);
      if (keptCount === 0 || usedHeight + required <= availableHeight) {
        visibleIds.add(item.id);
        usedHeight += required;
        keptCount++;
      }
    }
  }

  return visibleIds;
}
