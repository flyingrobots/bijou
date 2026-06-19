import type {
  BijouContext,
  OverflowBehavior,
  Surface,
  TokenValue,
} from '@flyingrobots/bijou';
import {
  createSurface,
  isPackedSurface,
  prepareWrappedText,
  segmentGraphemes,
  wrapPreparedTextToWidth,
} from '@flyingrobots/bijou';
import { parseHex, encodeModifiers } from '@flyingrobots/bijou/perf';
import type { LayoutRect } from './layout-rect.js';
import { vstackSurface } from './surface-layout.js';

export function resolvedColorRgb(ref: unknown): readonly [number, number, number] | undefined {
  if (typeof ref !== 'object' || ref === null || !('kind' in ref) || ref.kind !== 'resolved-color' || !('rgb' in ref)) return undefined;
  const rgb = ref.rgb;
  if (!Array.isArray(rgb) || rgb.length !== 3) return undefined;
  const r: unknown = rgb[0], g: unknown = rgb[1], b: unknown = rgb[2];
  return typeof r === 'number' && typeof g === 'number' && typeof b === 'number'
    ? [r, g, b]
    : undefined;
}

export function resolvedColorHex(ref: unknown): string | undefined {
  if (typeof ref === 'string') return ref;
  if (typeof ref !== 'object' || ref === null || !('kind' in ref) || ref.kind !== 'resolved-color') return undefined;
  return 'hex' in ref && typeof ref.hex === 'string' ? ref.hex : undefined;
}

export type NotificationVariant = 'ACTIONABLE' | 'INLINE' | 'TOAST';
export type NotificationTone = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
export type NotificationPlacement =
  | 'UPPER_LEFT'
  | 'UPPER_RIGHT'
  | 'LOWER_LEFT'
  | 'LOWER_RIGHT'
  | 'TOP_CENTER'
  | 'BOTTOM_CENTER'
  | 'CENTER';

export type NotificationHistoryFilter =
  | 'ALL'
  | 'ACTIONABLE'
  | NotificationTone;

export interface NotificationAction<Msg> {
  readonly label: string;
  readonly payload: Msg;
}

export interface NotificationSpec<Msg> {
  readonly title: string;
  readonly message?: string;
  readonly variant?: NotificationVariant;
  readonly tone?: NotificationTone;
  readonly width?: number;
  readonly durationMs?: number | null;
  readonly placement?: NotificationPlacement;
  readonly action?: NotificationAction<Msg>;
  readonly bgToken?: TokenValue;
  readonly accentToken?: TokenValue;
  readonly overflow?: OverflowBehavior;
}

export type NotificationPhase = 'entering' | 'visible' | 'exiting';

export interface NotificationRecord<Msg> {
  readonly id: number;
  readonly title: string;
  readonly message: string;
  readonly variant: NotificationVariant;
  readonly tone: NotificationTone;
  readonly width?: number;
  readonly durationMs: number | null;
  readonly placement: NotificationPlacement;
  readonly action?: NotificationAction<Msg>;
  readonly bgToken?: TokenValue;
  readonly accentToken?: TokenValue;
  readonly overflow: OverflowBehavior;
  readonly createdAtMs: number;
  readonly updatedAtMs: number;
  readonly enteredAtMs?: number;
  readonly exitStartedAtMs?: number;
  readonly phase: NotificationPhase;
  readonly progress: number;
}

export interface NotificationState<Msg> {
  readonly items: readonly NotificationRecord<Msg>[];
  readonly overflowExits: readonly NotificationRecord<Msg>[];
  readonly history: readonly NotificationRecord<Msg>[];
  readonly nextId: number;
  readonly focusedId?: number;
}

export interface RenderNotificationStackOptions {
  readonly screenWidth: number;
  readonly screenHeight: number;
  readonly region?: LayoutRect;
  readonly ctx?: BijouContext;
  readonly margin?: number;
  readonly gap?: number;
}

export interface RenderNotificationHistoryOptions {
  readonly width: number;
  readonly height: number;
  readonly scroll?: number;
  readonly filter?: NotificationHistoryFilter;
  readonly ctx?: BijouContext;
  readonly labels?: NotificationHistoryLabels;
}

export interface RenderNotificationReviewEntrySurfaceOptions {
  readonly width: number;
  readonly ctx?: BijouContext;
  readonly metaLabel?: string;
  readonly actionLabel?: (label: string) => string;
}

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

interface PreparedNotificationHistoryEntry {
  readonly title: ReturnType<typeof prepareWrappedText>;
  readonly metaLine: ReturnType<typeof prepareWrappedText>;
  readonly messageLine?: ReturnType<typeof prepareWrappedText>;
  readonly actionLine?: ReturnType<typeof prepareWrappedText>;
}

const ENTER_DURATION_MS = 180;
const EXIT_DURATION_MS = 320;
const HISTORY_LIMIT = 250;

export function createNotificationState<Msg>(): NotificationState<Msg> {
  return {
    items: [],
    overflowExits: [],
    history: [],
    nextId: 1,
  };
}

function matchesHistoryFilter<Msg>(
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

function filterLabel(
  filter: NotificationHistoryFilter,
  labels?: NotificationHistoryLabels,
): string {
  return labels?.filterLabel?.(filter)
    ?? (filter === 'ALL' ? 'All' : filter === 'ACTIONABLE' ? 'Actionable' : filter);
}

function renderHistoryEntry<Msg>(
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

function prepareNotificationHistoryEntry<Msg>(
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

function defaultDurationMs(variant: NotificationVariant): number | null {
  switch (variant) {
    case 'ACTIONABLE':
      return null;
    case 'INLINE':
      return 5_000;
    case 'TOAST':
      return 4_000;
  }
}

function focusableIds<Msg>(items: readonly NotificationRecord<Msg>[]): readonly number[] {
  return items
    .filter((item) => item.action != null)
    .map((item) => item.id);
}

export function normalizeFocusedId<Msg>(
  items: readonly NotificationRecord<Msg>[],
  focusedId: number | undefined,
): number | undefined {
  const focusable = focusableIds(items);
  if (focusable.length === 0) return undefined;
  if (focusedId != null && focusable.includes(focusedId)) return focusedId;
  return focusable[focusable.length - 1];
}

function archiveNotifications<Msg>(
  history: readonly NotificationRecord<Msg>[],
  items: readonly NotificationRecord<Msg>[],
): readonly NotificationRecord<Msg>[] {
  if (items.length === 0) return history;
  const archived = [...items].sort(
    (left, right) => right.updatedAtMs - left.updatedAtMs || right.id - left.id,
  );
  return [...archived, ...history].slice(0, HISTORY_LIMIT);
}

function advanceExitRecord<Msg>(
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

export function dismissNotification<Msg>(
  state: NotificationState<Msg>,
  id: number,
  nowMs: number,
): NotificationState<Msg> {
  const items = state.items.map((item) => {
    if (item.id !== id || item.phase === 'exiting') return item;
    return {
      ...item,
      phase: 'exiting' as const,
      updatedAtMs: nowMs,
      exitStartedAtMs: nowMs,
    };
  });

  return {
    ...state,
    items,
    focusedId: normalizeFocusedId(items, state.focusedId),
  };
}

export function dismissFocusedNotification<Msg>(
  state: NotificationState<Msg>,
  nowMs: number,
): NotificationState<Msg> {
  if (state.focusedId == null) return state;
  return dismissNotification(state, state.focusedId, nowMs);
}

export function relocateNotifications<Msg>(
  state: NotificationState<Msg>,
  placement: NotificationPlacement,
  nowMs?: number,
): NotificationState<Msg> {
  if (state.items.every((item) => item.placement === placement)) return state;
  return {
    ...state,
    items: state.items.map((item) => {
      if (nowMs == null || item.phase === 'exiting') {
        return { ...item, placement };
      }

      return {
        ...item,
        placement,
        phase: 'entering' as const,
        progress: 0,
        updatedAtMs: nowMs,
        enteredAtMs: undefined,
        exitStartedAtMs: undefined,
      };
    }),
  };
}

export function cycleNotificationFocus<Msg>(
  state: NotificationState<Msg>,
  delta: number,
): NotificationState<Msg> {
  const focusable = focusableIds(state.items);
  if (focusable.length === 0) return state;

  const index = state.focusedId == null ? -1 : focusable.indexOf(state.focusedId);
  const nextIndex = index < 0
    ? (delta >= 0 ? 0 : focusable.length - 1)
    : (index + delta + focusable.length) % focusable.length;

  return {
    ...state,
    focusedId: focusable[nextIndex],
  };
}

export function activateFocusedNotification<Msg>(
  state: NotificationState<Msg>,
  nowMs: number,
): { readonly state: NotificationState<Msg>; readonly payload?: Msg } {
  if (state.focusedId == null) return { state };
  const target = state.items.find((item) => item.id === state.focusedId);
  if (target?.action == null) return { state };
  return {
    state: dismissNotification(state, target.id, nowMs),
    payload: target.action.payload,
  };
}

export function tickNotifications<Msg>(
  state: NotificationState<Msg>,
  nowMs: number,
): NotificationState<Msg> {
  const nextItems: NotificationRecord<Msg>[] = [];
  const archived: NotificationRecord<Msg>[] = [];
  const nextOverflowExits: NotificationRecord<Msg>[] = [];
  const archivedOverflowExits: NotificationRecord<Msg>[] = [];

  for (const item of state.items) {
    const deltaMs = Math.max(0, nowMs - item.updatedAtMs);

    if (item.phase === 'entering') {
      const progress = Math.min(1, item.progress + (deltaMs / ENTER_DURATION_MS));
      nextItems.push(progress >= 1
        ? {
          ...item,
          phase: 'visible',
          progress: 1,
          enteredAtMs: nowMs,
          updatedAtMs: nowMs,
        }
        : {
          ...item,
          progress,
          updatedAtMs: nowMs,
        });
      continue;
    }

    if (item.phase === 'visible') {
      const visibleSince = item.enteredAtMs ?? item.createdAtMs;
      if (item.durationMs != null && nowMs - visibleSince >= item.durationMs) {
        nextItems.push({
          ...item,
          phase: 'exiting',
          exitStartedAtMs: nowMs,
          updatedAtMs: nowMs,
        });
      } else {
        nextItems.push({
          ...item,
          updatedAtMs: nowMs,
        });
      }
      continue;
    }

    const result = advanceExitRecord(item, nowMs);
    if (result.active != null) {
      nextItems.push(result.active);
      continue;
    }

    if (result.archived != null) {
      archived.push(result.archived);
    }
  }

  for (const item of state.overflowExits) {
    const result = advanceExitRecord(item, nowMs);
    if (result.active != null) {
      nextOverflowExits.push(result.active);
      continue;
    }

    if (result.archived != null) {
      archivedOverflowExits.push(result.archived);
    }
  }

  return {
    ...state,
    items: nextItems,
    overflowExits: nextOverflowExits,
    history: archiveNotifications(state.history, [...archived, ...archivedOverflowExits]),
    focusedId: normalizeFocusedId(nextItems, state.focusedId),
  };
}

export function hasNotifications<Msg>(state: NotificationState<Msg>): boolean {
  return state.items.length > 0;
}

export function notificationsNeedTick<Msg>(state: NotificationState<Msg>): boolean {
  return state.overflowExits.length > 0
    || state.items.some((item) => item.phase !== 'visible' || item.durationMs != null);
}

export function toneSemanticKey(tone: NotificationTone): 'info' | 'success' | 'warning' | 'error' {
  switch (tone) {
    case 'INFO':
      return 'info';
    case 'SUCCESS':
      return 'success';
    case 'WARNING':
      return 'warning';
    case 'ERROR':
      return 'error';
  }
}

export function defaultBgToken(ctx: BijouContext | undefined): TokenValue | undefined {
  return ctx?.theme.theme.surface.overlay;
}

export function formatTimeLabel(ms: number): string {
  return new Date(ms).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function tokenToCellStyle(token: TokenValue | undefined): CellTextStyle {
  if (token == null) return {};
  return {
    fg: token.hex,
    bg: token.bg,
    ...(token.fgRGB ? { fgRGB: token.fgRGB } : {}),
    ...(token.bgRGB ? { bgRGB: token.bgRGB } : {}),
    modifiers: token.modifiers,
  };
}

export function withModifiers(style: CellTextStyle, modifiers: readonly string[]): CellTextStyle {
  const next = new Set(style.modifiers ?? []);
  for (const modifier of modifiers) {
    next.add(modifier);
  }
  return {
    ...style,
    modifiers: next.size === 0 ? undefined : Array.from(next),
  };
}

export function createSegmentSurface(segments: readonly { readonly text: string; readonly style?: CellTextStyle }[]): Surface {
  const graphemeSegments = segments.map((segment) => ({
    graphemes: segmentGraphemes(segment.text),
    style: segment.style,
  }));
  const width = graphemeSegments.reduce((sum, segment) => sum + segment.graphemes.length, 0);
  const surface = createSurface(width, 1);
  let x = 0;

  const packed = isPackedSurface(surface);
  for (const segment of graphemeSegments) {
    const s = segment.style;
    if (packed && s) {
      let fR = -1, fG = 0, fB = 0, bR = -1, bG = 0, bB = 0;
      const fgHex = resolvedColorHex(s.fg);
      const fgRgb = s.fgRGB ?? resolvedColorRgb(s.fg) ?? (fgHex ? parseHex(fgHex) : undefined);
      if (fgRgb) { [fR, fG, fB] = fgRgb; }
      const bgHex = resolvedColorHex(s.bg);
      const bgRgb = s.bgRGB ?? resolvedColorRgb(s.bg) ?? (bgHex ? parseHex(bgHex) : undefined);
      if (bgRgb) { [bR, bG, bB] = bgRgb; }
      const fl = s.modifiers ? encodeModifiers(s.modifiers) : 0;
      for (const char of segment.graphemes) {
        (surface).setRGB(x, 0, char, fR, fG, fB, bR, bG, bB, fl);
        x++;
      }
    } else {
      for (const char of segment.graphemes) {
        surface.set(x, 0, {
          char,
          fg: s?.fg,
          bg: s?.bg,
          fgRGB: s?.fgRGB,
          bgRGB: s?.bgRGB,
          modifiers: s?.modifiers ? [...s.modifiers] : undefined,
          empty: false,
        });
        x++;
      }
    }
  }

  return surface;
}

export function createBlankLineSurface(width: number): Surface {
  return createSurface(Math.max(0, width), 1);
}

function insetContentSurface(surface: Surface, width: number): Surface {
  const safeWidth = Math.max(1, width);
  const inset = safeWidth >= 3 ? 1 : 0;
  const innerWidth = Math.max(1, safeWidth - (inset * 2));
  const result = createSurface(safeWidth, surface.height);
  result.blit(surface, inset, 0, 0, 0, innerWidth, surface.height);
  return result;
}

function renderInsetWrappedSurface(lineSurface: Surface, width: number): readonly Surface[] {
  const safeWidth = Math.max(1, width);
  const inset = safeWidth >= 3 ? 1 : 0;
  const innerWidth = Math.max(1, safeWidth - (inset * 2));
  return standaloneRows(lineSurface, innerWidth, 'wrap').map((row) => insetContentSurface(row, safeWidth));
}

function clipSurfaceHeight(surface: Surface, height: number): Surface {
  const safeHeight = Math.max(0, height);
  if (surface.height <= safeHeight) return surface;
  const clipped = createSurface(surface.width, safeHeight);
  clipped.blit(surface, 0, 0, 0, 0, surface.width, safeHeight);
  return clipped;
}

function fitLineSurface(surface: Surface, width: number): Surface {
  const safeWidth = Math.max(0, width);
  const line = createSurface(safeWidth, 1);
  if (safeWidth > 0) {
    line.blit(surface, 0, 0, 0, 0, safeWidth, 1);
  }
  return line;
}

function wrapLineSurface(surface: Surface, width: number): readonly Surface[] {
  const safeWidth = Math.max(1, width);
  if (surface.width === 0) return [createBlankLineSurface(safeWidth)];

  const rows: Surface[] = [];
  let offset = 0;
  while (offset < surface.width) {
    const hardEnd = Math.min(surface.width, offset + safeWidth);
    const end = hardEnd >= surface.width
      ? surface.width
      : wordBoundarySurfaceEnd(surface, offset, hardEnd);
    rows.push(sliceLineSurface(surface, offset, end, safeWidth));
    offset = hardEnd >= surface.width
      ? surface.width
      : trimLeadingSurfaceWhitespace(surface, end < hardEnd ? end + 1 : hardEnd);
  }
  return rows.length === 0 ? [createBlankLineSurface(safeWidth)] : rows;
}

function sliceLineSurface(surface: Surface, start: number, end: number, width: number): Surface {
  const row = createSurface(width, 1);
  const span = Math.max(0, Math.min(surface.width, end) - start);
  if (span > 0) {
    row.blit(surface, 0, 0, start, 0, span, 1);
  }
  return row;
}

function wordBoundarySurfaceEnd(surface: Surface, start: number, hardEnd: number): number {
  let breakAt = -1;
  for (let index = start; index < hardEnd; index++) {
    if (isWhitespaceSurfaceCell(surface, index)) {
      breakAt = index;
    }
  }
  return breakAt > start ? breakAt : hardEnd;
}

function trimLeadingSurfaceWhitespace(surface: Surface, start: number): number {
  let offset = start;
  while (offset < surface.width && isWhitespaceSurfaceCell(surface, offset)) {
    offset++;
  }
  return offset;
}

function isWhitespaceSurfaceCell(surface: Surface, col: number): boolean {
  return /^\s+$/.test(surface.get(col, 0).char);
}

export function renderPlainSurface(surface: Surface): string {
  const lines: string[] = [];
  for (let y = 0; y < surface.height; y++) {
    let line = '';
    for (let x = 0; x < surface.width; x++) {
      line += surface.get(x, y).char;
    }
    lines.push(line);
  }
  return lines.join('\n');
}

export function standaloneRows(
  lineSurface: Surface,
  width: number,
  overflow: OverflowBehavior,
): readonly Surface[] {
  if (overflow === 'truncate') return [fitLineSurface(lineSurface, width)];
  return wrapLineSurface(lineSurface, width);
}

export function composeColumnRows(
  left: Surface,
  right: Surface,
  width: number,
  overflow: OverflowBehavior,
): readonly Surface[] {
  const safeWidth = Math.max(1, width);
  const rightWidth = Math.min(right.width, safeWidth);

  if (overflow === 'truncate') {
    const row = createSurface(safeWidth, 1);
    const leftWidth = Math.max(0, safeWidth - rightWidth);
    if (leftWidth > 0) {
      row.blit(left, 0, 0, 0, 0, leftWidth, 1);
    }
    if (rightWidth > 0) {
      row.blit(right, safeWidth - rightWidth, 0, Math.max(0, right.width - rightWidth), 0, rightWidth, 1);
    }
    return [row];
  }

  const gap = rightWidth > 0 ? 1 : 0;
  const leftWidth = Math.max(1, safeWidth - rightWidth - gap);
  const wrappedLeft = wrapLineSurface(left, leftWidth);
  return wrappedLeft.map((rowSurface, index) => {
    const row = createSurface(safeWidth, 1);
    row.blit(rowSurface, 0, 0);
    if (index === 0 && rightWidth > 0) {
      row.blit(right, safeWidth - rightWidth, 0, Math.max(0, right.width - rightWidth), 0, rightWidth, 1);
    }
    return row;
  });
}

export function resolveRegion(options: RenderNotificationStackOptions): LayoutRect {
  const screenWidth = Math.max(0, options.screenWidth);
  const screenHeight = Math.max(0, options.screenHeight);
  if (options.region == null) {
    return { row: 0, col: 0, width: screenWidth, height: screenHeight };
  }
  return {
    row: Math.max(0, options.region.row),
    col: Math.max(0, options.region.col),
    width: Math.max(0, options.region.width),
    height: Math.max(0, options.region.height),
  };
}

export {
  hitTestNotificationStack,
  renderNotificationStack,
  trimNotificationsToViewport,
} from './notification-stack.js';
