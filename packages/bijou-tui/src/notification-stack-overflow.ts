import type { LayoutRect } from './layout-rect.js';
import type { NotificationRenderEntry } from './notification-card.js';
import type { NotificationPlacement, NotificationRecord } from './notification.js';
import { anchoredCol, applyAnimationOffset, placementSortSign, type PositionedNotificationRenderEntry } from './notification-stack-placement.js';

export function renderOverflowExits<Msg>(
  exits: readonly NotificationRecord<Msg>[],
  placement: NotificationPlacement,
  activeTotalHeight: number,
  region: LayoutRect,
  margin: number,
  gap: number,
  preparedEntries: ReadonlyMap<number, NotificationRenderEntry<Msg>>,
): readonly PositionedNotificationRenderEntry<Msg>[] {
  if (exits.length === 0) return [];

  const rendered = [...exits]
    .sort((left, right) => right.updatedAtMs - left.updatedAtMs || right.id - left.id)
    .flatMap((item) => preparedEntries.get(item.id) ?? []);
  const entries: PositionedNotificationRenderEntry<Msg>[] = [];
  const mode = placementSortSign(placement);

  if (mode === 'bottom') {
    let cursor = Math.max(margin, region.height - activeTotalHeight - margin) - gap;
    for (const entry of rendered) {
      cursor -= entry.surface.height;
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
        row: region.row + cursor + offset.rowDelta,
        col: region.col + baseCol + offset.colDelta,
      });
      cursor -= gap;
    }
    return entries;
  }

  let cursor = mode === 'top'
    ? margin + activeTotalHeight + (activeTotalHeight > 0 ? gap : 0)
    : Math.max(0, Math.floor((region.height + activeTotalHeight) / 2) + gap);

  for (const entry of rendered) {
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
      row: region.row + cursor + offset.rowDelta,
      col: region.col + baseCol + offset.colDelta,
    });
    cursor += entry.surface.height + gap;
  }

  return entries;
}
