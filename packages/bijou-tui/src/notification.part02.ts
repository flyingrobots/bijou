import { wrapPreparedTextToWidth } from '@flyingrobots/bijou';

import type { BijouContext, prepareWrappedText } from '@flyingrobots/bijou';

import type { NotificationHistoryFilter, NotificationRecord, NotificationState } from './notification.part01.js';

import { prepareNotificationHistoryEntry } from './notification.part03.js';
export interface NotificationHistoryLabels {
  readonly filterLabel?: (filter: NotificationHistoryFilter) => string;
  readonly headerLabel?: (args: {
    readonly filterLabel: string;
    readonly start: number;
    readonly end: number;
    readonly total: number;
  }) => string;
  readonly emptyLabel?: (args: {
    readonly filterLabel: string;
  }) => string;
  readonly actionLabel?: (label: string) => string;
}
export type NotificationMouseTargetKind = 'dismiss' | 'action' | 'body';
export interface NotificationMouseTarget<Msg> {
  readonly item: NotificationRecord<Msg>;
  readonly kind: NotificationMouseTargetKind;
}
export interface CellTextStyle {
  readonly fg?: string;
  readonly bg?: string;
  readonly fgRGB?: readonly [number, number, number];
  readonly bgRGB?: readonly [number, number, number];
  readonly modifiers?: readonly string[];
}
export interface PreparedNotificationHistoryEntry {
  readonly title: ReturnType<typeof prepareWrappedText>;
  readonly metaLine: ReturnType<typeof prepareWrappedText>;
  readonly messageLine?: ReturnType<typeof prepareWrappedText>;
  readonly actionLine?: ReturnType<typeof prepareWrappedText>;
}
export const ENTER_DURATION_MS = 180;
export const EXIT_DURATION_MS = 320;
export const HISTORY_LIMIT = 250;
export function createNotificationState<Msg>(): NotificationState<Msg> {
  return {
    items: [],
    overflowExits: [],
    history: [],
    nextId: 1,
  };
}
export function matchesHistoryFilter<Msg>(
  item: NotificationRecord<Msg>,
  filter: NotificationHistoryFilter,
): boolean {
  if (filter === 'ALL') return true;
  if (filter === 'ACTIONABLE') return item.variant === 'ACTIONABLE';
  return item.tone === filter;
}
export function countNotificationHistory<Msg>(
  state: NotificationState<Msg>,
  filter: NotificationHistoryFilter = 'ALL',
): number {
  let count = 0;
  for (const item of state.history) {
    if (matchesHistoryFilter(item, filter)) count++;
  }
  return count;
}
export function filterLabel(
  filter: NotificationHistoryFilter,
  labels?: NotificationHistoryLabels,
): string {
  return labels?.filterLabel?.(filter)
    ?? (filter === 'ALL' ? 'All' : filter === 'ACTIONABLE' ? 'Actionable' : filter);
}
export function renderHistoryEntry<Msg>(
  item: NotificationRecord<Msg>,
  width: number,
  ctx: BijouContext | undefined,
  actionLabel: ((label: string) => string) | undefined,
): readonly string[] {
  const safeWidth = Math.max(1, width);
  const prepared = prepareNotificationHistoryEntry(item, ctx, actionLabel);

  const lines = [
    ...wrapPreparedTextToWidth(prepared.title, safeWidth),
    ...wrapPreparedTextToWidth(prepared.metaLine, safeWidth),
    ...(prepared.messageLine == null ? [] : wrapPreparedTextToWidth(prepared.messageLine, safeWidth)),
    ...(prepared.actionLine == null ? [] : wrapPreparedTextToWidth(prepared.actionLine, safeWidth)),
  ];

  return lines.length === 0 ? [''] : lines;
}
