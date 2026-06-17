import { surfaceToString } from '@flyingrobots/bijou';
import type { Overlay } from './overlay.js';
import type { LayoutRect } from './layout-rect.js';
import { resolveNotificationGap, resolveOverlayMargin } from './design-language.js';
import { renderNotificationSurface, type NotificationRenderEntry } from './notification-card.js';
import {
  normalizeFocusedId,
  renderPlainSurface,
  resolveRegion,
  type NotificationMouseTarget,
  type NotificationPlacement,
  type NotificationRecord,
  type NotificationState,
  type RenderNotificationStackOptions,
} from './notification.js';

interface PositionedNotificationRenderEntry<Msg> extends NotificationRenderEntry<Msg> {
  readonly row: number;
  readonly col: number;
}

function sortForPlacement<Msg>(
  items: readonly NotificationRecord<Msg>[],
  placement: NotificationPlacement,
): readonly NotificationRecord<Msg>[] {
  const ordered = [...items].sort((left, right) => right.createdAtMs - left.createdAtMs || right.id - left.id);
  return placementSortSign(placement) === 'bottom' ? ordered.reverse() : ordered;
}

function placementSortSign(placement: NotificationPlacement): 'top' | 'bottom' | 'center' {
  switch (placement) {
    case 'UPPER_LEFT':
    case 'UPPER_RIGHT':
    case 'TOP_CENTER':
      return 'top';
    case 'LOWER_LEFT':
    case 'LOWER_RIGHT':
    case 'BOTTOM_CENTER':
      return 'bottom';
    case 'CENTER':
      return 'center';
  }
}

function anchoredCol(placement: NotificationPlacement, width: number, screenWidth: number, margin: number): number {
  switch (placement) {
    case 'UPPER_LEFT':
    case 'LOWER_LEFT':
      return margin;
    case 'UPPER_RIGHT':
    case 'LOWER_RIGHT':
      return Math.max(margin, screenWidth - width - margin);
    case 'TOP_CENTER':
    case 'BOTTOM_CENTER':
    case 'CENTER':
      return Math.max(0, Math.floor((screenWidth - width) / 2));
  }
}

function applyAnimationOffset(
  placement: NotificationPlacement,
  width: number,
  height: number,
  margin: number,
  progress: number,
): { readonly rowDelta: number; readonly colDelta: number } {
  const remaining = 1 - progress;
  const slideX = Math.round(remaining * (width + margin));
  const slideY = Math.round(remaining * (height + margin));

  switch (placement) {
    case 'UPPER_LEFT':
    case 'LOWER_LEFT':
      return { rowDelta: 0, colDelta: -slideX };
    case 'UPPER_RIGHT':
    case 'LOWER_RIGHT':
      return { rowDelta: 0, colDelta: slideX };
    case 'TOP_CENTER':
      return { rowDelta: -slideY, colDelta: 0 };
    case 'BOTTOM_CENTER':
      return { rowDelta: slideY, colDelta: 0 };
    case 'CENTER':
      return { rowDelta: -slideY, colDelta: 0 };
  }
}

function createRenderEntry<Msg>(
  item: NotificationRecord<Msg>,
  options: RenderNotificationStackOptions,
  focusedId: number | undefined,
): NotificationRenderEntry<Msg> {
  return renderNotificationSurface(item, options, focusedId === item.id);
}

function prepareRenderEntriesById<Msg>(
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

function selectVisibleNotificationIds<Msg>(
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
      const entry = preparedEntries.get(item.id)!;
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

function renderOverflowExits<Msg>(
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
    .map((item) => preparedEntries.get(item.id)!)
    .filter((entry): entry is NotificationRenderEntry<Msg> => entry != null);
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

function resolveNotificationOverlayEntries<Msg>(
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
    const rendered = sortForPlacement(items, placement).map((item) =>
      activePrepared.get(item.id)!
    ).filter((entry): entry is NotificationRenderEntry<Msg> => entry != null);

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

function containsRect(rect: LayoutRect | undefined, col: number, row: number): boolean {
  if (rect == null) return false;
  return col >= rect.col
    && col < rect.col + rect.width
    && row >= rect.row
    && row < rect.row + rect.height;
}

export function hitTestNotificationStack<Msg>(
  state: NotificationState<Msg>,
  options: RenderNotificationStackOptions,
  col: number,
  row: number,
): NotificationMouseTarget<Msg> | undefined {
  const entries = resolveNotificationOverlayEntries(state, options);
  for (let index = entries.length - 1; index >= 0; index--) {
    const entry = entries[index]!;
    if (
      col < entry.col
      || col >= entry.col + entry.surface.width
      || row < entry.row
      || row >= entry.row + entry.surface.height
    ) {
      continue;
    }

    const localCol = col - entry.col;
    const localRow = row - entry.row;
    if (containsRect(entry.dismissRect, localCol, localRow)) {
      return { item: entry.item, kind: 'dismiss' };
    }
    if (containsRect(entry.actionRect, localCol, localRow)) {
      return { item: entry.item, kind: 'action' };
    }
    return { item: entry.item, kind: 'body' };
  }

  return undefined;
}

export function renderNotificationStack<Msg>(
  state: NotificationState<Msg>,
  options: RenderNotificationStackOptions,
): readonly Overlay[] {
  return resolveNotificationOverlayEntries(state, options).map((entry) => ({
    row: entry.row,
    col: entry.col,
    surface: entry.surface,
    content: options.ctx != null
      ? surfaceToString(entry.surface, options.ctx.style)
      : renderPlainSurface(entry.surface),
  }));
}
