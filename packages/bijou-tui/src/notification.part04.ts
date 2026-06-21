import type { Surface } from '@flyingrobots/bijou';

import { vstackSurface } from './surface-layout.js';

import type { NotificationRecord, RenderNotificationReviewEntrySurfaceOptions } from './notification.part01.js';

import { createBlankLineSurface, createSegmentSurface, formatTimeLabel, tokenToCellStyle, toneSemanticKey, withModifiers } from './notification.part09.js';

import { renderInsetWrappedSurface } from './notification.part10.js';
export function renderNotificationReviewEntrySurface<Msg>(
  item: NotificationRecord<Msg>,
  options: RenderNotificationReviewEntrySurfaceOptions,
): Surface {
  const safeWidth = Math.max(1, options.width);
  const ctx = options.ctx;
  const meta = options.metaLabel ?? `${formatTimeLabel(item.createdAtMs)} • ${item.variant} • ${item.placement}`;
  const mutedStyle = tokenToCellStyle(ctx?.semantic('muted'));
  const toneStyle = tokenToCellStyle(ctx?.semantic(toneSemanticKey(item.tone)));
  const titleStyle = withModifiers({}, ['bold']);
  const rows: Surface[] = [];

  rows.push(...renderInsetWrappedSurface(createSegmentSurface([
    { text: `[${item.tone}]`, style: toneStyle },
    { text: ' ' },
    { text: item.title, style: titleStyle },
  ]), safeWidth));

  rows.push(...renderInsetWrappedSurface(createSegmentSurface([
    { text: meta, style: mutedStyle },
  ]), safeWidth));

  if (item.message.length > 0) {
    rows.push(...renderInsetWrappedSurface(createSegmentSurface([
      { text: item.message, style: mutedStyle },
    ]), safeWidth));
  }

  if (item.action != null) {
    rows.push(...renderInsetWrappedSurface(createSegmentSurface([
      { text: options.actionLabel?.(item.action.label) ?? `Action: ${item.action.label}`, style: mutedStyle },
    ]), safeWidth));
  }

  return rows.length === 0 ? createBlankLineSurface(safeWidth) : vstackSurface(...rows);
}
