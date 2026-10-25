import { resolveNotificationGap, resolveOverlayMargin } from './design-language.js';
import { resolveRegion, type NotificationPlacement, type NotificationRecord, type NotificationState, type RenderNotificationStackOptions } from './notification.js';
import { anchoredCol, applyAnimationOffset, placementSortSign, sortForPlacement, type PositionedNotificationRenderEntry } from './notification-stack-placement.js';
import { prepareRenderEntriesById, selectVisibleNotificationIds } from './notification-stack-selection.js';
import { renderOverflowExits } from './notification-stack-overflow.js';

export function resolveNotificationOverlayEntries<Msg>(
  state: NotificationState<Msg>,
  options: RenderNotificationStackOptions,
): readonly PositionedNotificationRenderEntry<Msg>[] {
  const screenWidth = Math.max(0, options.screenWidth);
  const screenHeight = Math.max(0, options.screenHeight);
  if (screenWidth <= 0 || screenHeight <= 0) return [];

  const region = resolveRegion(options);
  if (region.width <= 0 || region.height <= 0) return [];

  const margin = resolveOverlayMargin(region.width, region.height, options.margin);
  const gap = resolveNotificationGap(options.gap);
  const activePrepared = prepareRenderEntriesById(state.items, options, state.focusedId);
  const overflowPrepared = prepareRenderEntriesById(state.overflowExits, options, state.focusedId);
  const visibleIds = selectVisibleNotificationIds(state, options, activePrepared);
  const grouped = new Map<NotificationPlacement, NotificationRecord<Msg>[]>();
  const overflowGrouped = new Map<NotificationPlacement, NotificationRecord<Msg>[]>();

  for (const item of state.items) {
    if (!visibleIds.has(item.id)) continue;
    const placementItems = grouped.get(item.placement) ?? [];
    placementItems.push(item);
    grouped.set(item.placement, placementItems);
  }

  for (const item of state.overflowExits) {
    const placementItems = overflowGrouped.get(item.placement) ?? [];
    placementItems.push(item);
    overflowGrouped.set(item.placement, placementItems);
  }

  const entries: PositionedNotificationRenderEntry<Msg>[] = [];
  const placements = new Set<NotificationPlacement>([
    ...grouped.keys(),
    ...overflowGrouped.keys(),
  ]);

  for (const placement of placements) {
    const items = grouped.get(placement) ?? [];
    const rendered = sortForPlacement(items, placement).flatMap((item) => activePrepared.get(item.id) ?? []);

    const totalHeight = rendered.reduce((sum, entry) => sum + entry.surface.height, 0)
      + Math.max(0, rendered.length - 1) * gap;
    const mode = placementSortSign(placement);
    let cursor = mode === 'top'
      ? margin
      : (mode === 'bottom'
        ? Math.max(margin, region.height - totalHeight - margin)
        : Math.max(0, Math.floor((region.height - totalHeight) / 2)));

    for (const entry of rendered) {
      const baseRow = cursor;
      const baseCol = anchoredCol(placement, entry.surface.width, region.width, margin);
      const offset = applyAnimationOffset(
        placement,
        entry.surface.width,
        entry.surface.height,
        margin,
        entry.item.progress,
      );
      entries.push({
        ...entry,
        row: region.row + baseRow + offset.rowDelta,
        col: region.col + baseCol + offset.colDelta,
      });
      cursor += entry.surface.height + gap;
    }

    entries.push(...renderOverflowExits(
      overflowGrouped.get(placement) ?? [],
      placement,
      totalHeight,
      region,
      margin,
      gap,
      overflowPrepared,
    ));
  }

  return entries;
}
