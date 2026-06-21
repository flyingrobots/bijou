import type { Surface } from '@flyingrobots/bijou';

import { vstackSurface } from './surface-layout.js';

import type { NotificationRecord, NotificationState, NotificationVariant, RenderNotificationHistoryOptions } from './notification.part01.js';

import { filterLabel, matchesHistoryFilter } from './notification.part02.js';

import { renderNotificationReviewEntrySurface } from './notification.part04.js';

import { createBlankLineSurface, createSegmentSurface, tokenToCellStyle, withModifiers } from './notification.part09.js';

import { clipSurfaceHeight, renderInsetWrappedSurface } from './notification.part10.js';
export function renderNotificationHistorySurface<Msg>(
  state: NotificationState<Msg>,
  options: RenderNotificationHistoryOptions,
): Surface {
  const safeWidth = Math.max(1, options.width);
  const safeHeight = Math.max(3, options.height);
  const filter = options.filter ?? 'ALL';
  const filterName = filterLabel(filter, options.labels);
  const filtered = state.history.filter((item) => matchesHistoryFilter(item, filter));
  const maxBodyLines = Math.max(1, safeHeight - 2);
  const start = Math.max(0, Math.min(options.scroll ?? 0, Math.max(0, filtered.length - 1)));

  const first = start + 1;
  const last = Math.min(filtered.length, first);
  const rows: Surface[] = [
    ...renderInsetWrappedSurface(createSegmentSurface([
      { text: filtered.length === 0
        ? (options.labels?.headerLabel?.({
          filterLabel: filterName,
          start: 0,
          end: 0,
          total: 0,
        }) ?? `History • ${filterName} • 0 items`)
        : (options.labels?.headerLabel?.({
          filterLabel: filterName,
          start: first,
          end: last,
          total: filtered.length,
        }) ?? `History • ${filterName} • ${String(first)}-${String(last)} of ${String(filtered.length)}`),
        style: withModifiers({}, ['bold']) },
    ]), safeWidth),
    createBlankLineSurface(safeWidth),
  ];

  if (filtered.length === 0) {
    rows.push(...renderInsetWrappedSurface(createSegmentSurface([{
      text: options.labels?.emptyLabel?.({ filterLabel: filterName }) ?? `No archived notifications for ${filterName} yet.`,
      style: tokenToCellStyle(options.ctx?.semantic('muted')),
    }]), safeWidth));
    return vstackSurface(...rows);
  }

  let bodyLines = 0;
  let end = start;
  for (const item of filtered.slice(start)) {
    const entry = renderNotificationReviewEntrySurface(item, {
      width: safeWidth,
      ctx: options.ctx,
      actionLabel: options.labels?.actionLabel,
    });
    const remaining = maxBodyLines - bodyLines;
    if (remaining <= 0) break;
    if (bodyLines > 0) {
      if (remaining <= 1) break;
      rows.push(createBlankLineSurface(safeWidth));
      bodyLines += 1;
    }
    const clipped = clipSurfaceHeight(entry, maxBodyLines - bodyLines);
    rows.push(clipped);
    bodyLines += clipped.height;
    end += 1;
    if (clipped.height < entry.height || bodyLines >= maxBodyLines) break;
  }

  const actualEnd = Math.max(first, end);
  const headerRow = renderInsetWrappedSurface(createSegmentSurface([
    { text: options.labels?.headerLabel?.({
      filterLabel: filterName,
      start: first,
      end: actualEnd,
      total: filtered.length,
    }) ?? `History • ${filterName} • ${String(first)}-${String(actualEnd)} of ${String(filtered.length)}`,
      style: withModifiers({}, ['bold']) },
  ]), safeWidth)[0];
  if (headerRow !== undefined) rows[0] = headerRow;

  return vstackSurface(...rows);
}
export function defaultDurationMs(variant: NotificationVariant): number | null {
  switch (variant) {
    case 'ACTIONABLE':
      return null;
    case 'INLINE':
      return 5_000;
    case 'TOAST':
      return 4_000;
  }
}
export function focusableIds<Msg>(items: readonly NotificationRecord<Msg>[]): readonly number[] {
  return items
    .filter((item) => item.action != null)
    .map((item) => item.id);
}
