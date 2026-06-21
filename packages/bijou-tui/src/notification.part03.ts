import { prepareWrappedText, wrapPreparedTextToWidth } from '@flyingrobots/bijou';

import type { BijouContext } from '@flyingrobots/bijou';

import type { NotificationRecord, NotificationState, RenderNotificationHistoryOptions } from './notification.part01.js';

import { filterLabel, matchesHistoryFilter, renderHistoryEntry } from './notification.part02.js';

import type { PreparedNotificationHistoryEntry } from './notification.part02.js';

import { formatTimeLabel, toneSemanticKey } from './notification.part09.js';
export function prepareNotificationHistoryEntry<Msg>(
  item: NotificationRecord<Msg>,
  ctx: BijouContext | undefined,
  actionLabel: ((label: string) => string) | undefined,
): PreparedNotificationHistoryEntry {
  const toneLabel = `[${item.tone}]`;
  const title = ctx == null
    ? `${toneLabel} ${item.title}`
    : `${ctx.style.styled(ctx.semantic(toneSemanticKey(item.tone)), toneLabel)} ${ctx.style.bold(item.title)}`;
  const meta = `${formatTimeLabel(item.createdAtMs)} • ${item.variant} • ${item.placement}`;
  const metaLine = ctx == null ? meta : ctx.style.styled(ctx.semantic('muted'), meta);
  const actionLine = item.action == null
    ? undefined
    : (ctx == null
      ? (actionLabel?.(item.action.label) ?? `Action: ${item.action.label}`)
      : ctx.style.styled(
        ctx.semantic('muted'),
        actionLabel?.(item.action.label) ?? `Action: ${item.action.label}`,
      ));
  const messageLine = item.message.length === 0
    ? undefined
    : (ctx == null ? item.message : ctx.style.styled(ctx.semantic('muted'), item.message));

  return {
    title: prepareWrappedText(title),
    metaLine: prepareWrappedText(metaLine),
    messageLine: messageLine == null ? undefined : prepareWrappedText(messageLine),
    actionLine: actionLine == null ? undefined : prepareWrappedText(actionLine),
  };
}
export function renderNotificationHistory<Msg>(
  state: NotificationState<Msg>,
  options: RenderNotificationHistoryOptions,
): string {
  const safeWidth = Math.max(1, options.width);
  const safeHeight = Math.max(3, options.height);
  const filter = options.filter ?? 'ALL';
  const filterName = filterLabel(filter, options.labels);
  const filtered = state.history.filter((item) => matchesHistoryFilter(item, filter));
  const maxBodyLines = Math.max(1, safeHeight - 2);
  const start = Math.max(0, Math.min(options.scroll ?? 0, Math.max(0, filtered.length - 1)));

  if (filtered.length === 0) {
    const emptyText = options.ctx == null
      ? (options.labels?.emptyLabel?.({ filterLabel: filterName }) ?? `No archived notifications for ${filterName} yet.`)
      : options.ctx.style.styled(
        options.ctx.semantic('muted'),
        options.labels?.emptyLabel?.({ filterLabel: filterName }) ?? `No archived notifications for ${filterName} yet.`,
      );
    const empty = wrapPreparedTextToWidth(prepareWrappedText(emptyText), safeWidth).slice(0, maxBodyLines);
    const header = options.labels?.headerLabel?.({
      filterLabel: filterName,
      start: 0,
      end: 0,
      total: 0,
    }) ?? `History • ${filterName} • 0 items`;
    return [
      header,
      '',
      ...empty,
    ].join('\n');
  }

  const bodyLines: string[] = [];
  let renderedCount = 0;

  for (const item of filtered.slice(start)) {
    const entryLines = renderHistoryEntry(item, safeWidth, options.ctx, options.labels?.actionLabel);
    const remaining = maxBodyLines - bodyLines.length;
    if (remaining <= 0) break;

    if (bodyLines.length > 0) {
      if (remaining <= 1) break;
      bodyLines.push('');
    }

    bodyLines.push(...entryLines.slice(0, maxBodyLines - bodyLines.length));
    renderedCount++;

    if (bodyLines.length >= maxBodyLines) break;
  }

  const end = Math.min(filtered.length, start + Math.max(1, renderedCount));
  const header = options.labels?.headerLabel?.({
    filterLabel: filterName,
    start: start + 1,
    end,
    total: filtered.length,
  }) ?? `History • ${filterName} • ${String(start + 1)}-${String(end)} of ${String(filtered.length)}`;
  return [
    header,
    '',
    ...bodyLines,
  ].join('\n');
}
