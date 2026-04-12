import type {
  BijouContext,
  OverflowBehavior,
  Surface,
  PackedSurface,
  TokenValue,
} from '@flyingrobots/bijou';
import {
  createSurface,
  isPackedSurface,
  prepareWrappedText,
  segmentGraphemes,
  surfaceToString,
  wrapPreparedTextToWidth,
} from '@flyingrobots/bijou';
import { parseHex, encodeModifiers } from '@flyingrobots/bijou/perf';
import type { Overlay } from './overlay.js';
import type { LayoutRect } from './layout-rect.js';
import { visibleLength } from './viewport.js';
import { resolveNotificationGap, resolveOverlayMargin } from './design-language.js';
import { vstackSurface } from './surface-layout.js';

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
}

export interface RenderNotificationReviewEntrySurfaceOptions {
  readonly width: number;
  readonly ctx?: BijouContext;
  readonly metaLabel?: string;
}

export type NotificationMouseTargetKind = 'dismiss' | 'action' | 'body';

export interface NotificationMouseTarget<Msg> {
  readonly item: NotificationRecord<Msg>;
  readonly kind: NotificationMouseTargetKind;
}

interface CellTextStyle {
  readonly fg?: string;
  readonly bg?: string;
  readonly fgRGB?: readonly [number, number, number];
  readonly bgRGB?: readonly [number, number, number];
  readonly modifiers?: readonly string[];
}

interface NotificationRenderEntry<Msg> {
  readonly item: NotificationRecord<Msg>;
  readonly surface: Surface;
  readonly dismissRect: LayoutRect;
  readonly actionRect?: LayoutRect;
}

interface PositionedNotificationRenderEntry<Msg> extends NotificationRenderEntry<Msg> {
  readonly row: number;
  readonly col: number;
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

const TONE_ICONS: Record<NotificationTone, string> = {
  INFO: '\u2139',
  SUCCESS: '\u2714',
  WARNING: '\u26a0',
  ERROR: '\u2718',
};

const TONE_BORDER_KEYS: Record<NotificationTone, 'primary' | 'success' | 'warning' | 'error'> = {
  INFO: 'primary',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
};

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

function filterLabel(filter: NotificationHistoryFilter): string {
  return filter === 'ALL' ? 'All' : filter === 'ACTIONABLE' ? 'Actionable' : filter;
}

function renderHistoryEntry<Msg>(
  item: NotificationRecord<Msg>,
  width: number,
  ctx: BijouContext | undefined,
): readonly string[] {
  const safeWidth = Math.max(1, width);
  const prepared = prepareNotificationHistoryEntry(item, ctx);

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
      ? `Action: ${item.action.label}`
      : ctx.style.styled(ctx.semantic('muted'), `Action: ${item.action.label}`));
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
  const filtered = state.history.filter((item) => matchesHistoryFilter(item, filter));
  const maxBodyLines = Math.max(1, safeHeight - 2);
  const start = Math.max(0, Math.min(options.scroll ?? 0, Math.max(0, filtered.length - 1)));

  if (filtered.length === 0) {
    const emptyText = options.ctx == null
      ? `No archived notifications for ${filterLabel(filter)} yet.`
      : options.ctx.style.styled(
        options.ctx.semantic('muted'),
        `No archived notifications for ${filterLabel(filter)} yet.`,
      );
    const empty = wrapPreparedTextToWidth(prepareWrappedText(emptyText), safeWidth).slice(0, maxBodyLines);
    return [
      `History • ${filterLabel(filter)} • 0 items`,
      '',
      ...empty,
    ].join('\n');
  }

  const bodyLines: string[] = [];
  let renderedCount = 0;

  for (const item of filtered.slice(start)) {
    const entryLines = renderHistoryEntry(item, safeWidth, options.ctx);
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
  return [
    `History • ${filterLabel(filter)} • ${start + 1}-${end} of ${filtered.length}`,
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
      { text: `Action: ${item.action.label}`, style: mutedStyle },
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
  const filtered = state.history.filter((item) => matchesHistoryFilter(item, filter));
  const maxBodyLines = Math.max(1, safeHeight - 2);
  const start = Math.max(0, Math.min(options.scroll ?? 0, Math.max(0, filtered.length - 1)));

  const rows: Surface[] = [
    ...renderInsetWrappedSurface(createSegmentSurface([
      { text: filtered.length === 0
        ? `History • ${filterLabel(filter)} • 0 items`
        : `History • ${filterLabel(filter)} • ${start + 1}-${Math.min(filtered.length, start + 1)} of ${filtered.length}`,
        style: withModifiers({}, ['bold']) },
    ]), safeWidth),
    createBlankLineSurface(safeWidth),
  ];

  if (filtered.length === 0) {
    rows.push(...renderInsetWrappedSurface(createSegmentSurface([{
      text: `No archived notifications for ${filterLabel(filter)} yet.`,
      style: tokenToCellStyle(options.ctx?.semantic('muted')),
    }]), safeWidth));
    return vstackSurface(...rows);
  }

  let bodyLines = 0;
  let end = start;
  for (const item of filtered.slice(start)) {
    const entry = renderNotificationReviewEntrySurface(item, { width: safeWidth, ctx: options.ctx });
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

  // Rewrite header with the actual rendered end range.
  rows[0] = renderInsetWrappedSurface(createSegmentSurface([
    { text: `History • ${filterLabel(filter)} • ${start + 1}-${Math.max(start + 1, end)} of ${filtered.length}`,
      style: withModifiers({}, ['bold']) },
  ]), safeWidth)[0]!;

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

function normalizeFocusedId<Msg>(
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

function toneSemanticKey(tone: NotificationTone): 'info' | 'success' | 'warning' | 'error' {
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

function defaultBgToken(ctx: BijouContext | undefined): TokenValue | undefined {
  return ctx?.theme.theme.surface.overlay;
}

function formatTimeLabel(ms: number): string {
  return new Date(ms).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function tokenToCellStyle(token: TokenValue | undefined): CellTextStyle {
  if (token == null) return {};
  // Pass pre-parsed RGB alongside hex so encodeCellIntoBuf can skip
  // inlineHexRGB on the hot path. Build the object with conditional
  // spreads so readonly fields stay readonly.
  return {
    fg: token.hex,
    bg: token.bg,
    ...(token.fgRGB ? { fgRGB: token.fgRGB } : {}),
    ...(token.bgRGB ? { bgRGB: token.bgRGB } : {}),
    modifiers: token.modifiers,
  };
}

function withModifiers(style: CellTextStyle, modifiers: readonly string[]): CellTextStyle {
  const next = new Set(style.modifiers ?? []);
  for (const modifier of modifiers) {
    next.add(modifier);
  }
  return {
    ...style,
    modifiers: next.size === 0 ? undefined : Array.from(next),
  };
}

function createSegmentSurface(segments: readonly { readonly text: string; readonly style?: CellTextStyle }[]): Surface {
  const graphemeSegments = segments.map((segment) => ({
    graphemes: segmentGraphemes(segment.text ?? ''),
    style: segment.style,
  }));
  const width = graphemeSegments.reduce((sum, segment) => sum + segment.graphemes.length, 0);
  const surface = createSurface(width, 1);
  let x = 0;

  const packed = isPackedSurface(surface);
  for (const segment of graphemeSegments) {
    // Pre-parse style once per segment for setRGB fast path
    const s = segment.style;
    if (packed && s) {
      let fR = -1, fG = 0, fB = 0, bR = -1, bG = 0, bB = 0;
      const fgRgb = s.fg ? parseHex(s.fg) : undefined;
      if (fgRgb) { [fR, fG, fB] = fgRgb; }
      const bgRgb = s.bg ? parseHex(s.bg) : undefined;
      if (bgRgb) { [bR, bG, bB] = bgRgb; }
      const fl = s.modifiers ? encodeModifiers(s.modifiers) : 0;
      for (const char of segment.graphemes) {
        (surface as PackedSurface).setRGB(x, 0, char, fR, fG, fB, bR, bG, bB, fl);
        x++;
      }
    } else {
      for (const char of segment.graphemes) {
        surface.set(x, 0, {
          char,
          fg: s?.fg,
          bg: s?.bg,
          modifiers: s?.modifiers ? [...s.modifiers] : undefined,
          empty: false,
        });
        x++;
      }
    }
  }

  return surface;
}

function createBlankLineSurface(width: number): Surface {
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
  for (let offset = 0; offset < surface.width; offset += safeWidth) {
    const row = createSurface(safeWidth, 1);
    row.blit(surface, 0, 0, offset, 0, safeWidth, 1);
    rows.push(row);
  }
  return rows;
}

function renderPlainSurface(surface: Surface): string {
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

function standaloneRows(
  lineSurface: Surface,
  width: number,
  overflow: OverflowBehavior,
): readonly Surface[] {
  if (overflow === 'truncate') return [fitLineSurface(lineSurface, width)];
  return wrapLineSurface(lineSurface, width);
}

function composeColumnRows(
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

function resolveRegion(options: RenderNotificationStackOptions): LayoutRect {
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

function measureTextWidth<Msg>(
  item: NotificationRecord<Msg>,
  screenWidth: number,
): number {
  const available = Math.max(18, screenWidth - 7);
  if (item.width != null) {
    return Math.max(18, Math.min(available, item.width));
  }
  const titleWidth = visibleLength(item.title);
  const messageWidth = visibleLength(item.message);
  const buttonWidth = item.action == null ? 0 : visibleLength(item.action.label) + 6;
  const base = Math.max(titleWidth + 8, messageWidth + 2, buttonWidth + 2);

  if (item.variant === 'INLINE') {
    const target = Math.max(base + 8, Math.floor(screenWidth * 0.66));
    return Math.min(available, Math.max(28, target));
  }

  return Math.min(available, Math.max(26, Math.min(52, base + 6)));
}

function renderNotificationSurface<Msg>(
  item: NotificationRecord<Msg>,
  options: RenderNotificationStackOptions,
  focused: boolean,
): NotificationRenderEntry<Msg> {
  const ctx = options.ctx;
  const textWidth = measureTextWidth(item, resolveRegion(options).width);
  const mutedStyle = tokenToCellStyle(ctx?.semantic('muted'));
  const titleStyle = withModifiers({}, ['bold']);
  const iconStyle = tokenToCellStyle(ctx?.semantic(toneSemanticKey(item.tone)));
  const accentStyle = tokenToCellStyle(item.accentToken ?? ctx?.border(TONE_BORDER_KEYS[item.tone]));
  const backgroundStyle = tokenToCellStyle(item.bgToken ?? defaultBgToken(ctx));
  const closeSurface = createSegmentSurface([{ text: '\u2715', style: mutedStyle }]);
  const icon = TONE_ICONS[item.tone];
  const overflow = item.overflow;

  const rows: Surface[] = [];
  let actionRect: LayoutRect | undefined;

  if (item.variant === 'INLINE') {
    const left = createSegmentSurface([
      { text: icon, style: iconStyle },
      { text: ' ' },
      { text: item.title, style: titleStyle },
      ...(item.message.length > 0
        ? [
          { text: ' ' },
          { text: item.message, style: mutedStyle },
        ]
        : []),
    ]);
    rows.push(...composeColumnRows(left, closeSurface, textWidth, overflow));
  } else {
    const titleLeft = createSegmentSurface([
      { text: icon, style: iconStyle },
      { text: ' ' },
      { text: item.title, style: titleStyle },
    ]);
    rows.push(...composeColumnRows(titleLeft, closeSurface, textWidth, overflow));

    if (item.message.length > 0) {
      const messageSurface = createSegmentSurface([{ text: item.message, style: mutedStyle }]);
      rows.push(...standaloneRows(messageSurface, textWidth, overflow));
    }

    if (item.variant === 'ACTIONABLE') {
      rows.push(createBlankLineSurface(textWidth));
      const actionLabel = item.action == null
        ? 'Dismiss'
        : (focused ? `[ ${item.action.label} ]` : `  ${item.action.label}  `);
      const actionStyle = focused ? withModifiers({}, ['bold']) : {};
      const actionRows = standaloneRows(
        createSegmentSurface([{ text: actionLabel, style: actionStyle }]),
        textWidth,
        overflow,
      );
      actionRect = {
        row: rows.length,
        col: 2,
        width: textWidth,
        height: actionRows.length,
      };
      rows.push(...actionRows);
    }

    if (item.variant === 'TOAST') {
      rows.push(createBlankLineSurface(textWidth));
      const timestampSurface = createSegmentSurface([{ text: formatTimeLabel(item.createdAtMs), style: mutedStyle }]);
      rows.push(...standaloneRows(timestampSurface, textWidth, overflow));
    }
  }

  const contentRows = rows.length === 0 ? [createBlankLineSurface(textWidth)] : rows;
  const cardWidth = textWidth + 3;
  const cardHeight = contentRows.length;
  const card = createSurface(cardWidth, cardHeight, {
    char: ' ',
    fg: backgroundStyle.fg,
    bg: backgroundStyle.bg,
    modifiers: backgroundStyle.modifiers ? [...backgroundStyle.modifiers] : undefined,
    empty: false,
  });

  const cardPacked = isPackedSurface(card);
  for (let y = 0; y < contentRows.length; y++) {
    const accentRgb = cardPacked && accentStyle.fg ? parseHex(accentStyle.fg) : undefined;
    if (accentRgb) {
      const [fR, fG, fB] = accentRgb;
      let bR = -1, bG = 0, bB = 0;
      const bgRgb = backgroundStyle.bg ? parseHex(backgroundStyle.bg) : undefined;
      if (bgRgb) { [bR, bG, bB] = bgRgb; }
      (card as PackedSurface).setRGB(0, y, '\u258e', fR, fG, fB, bR, bG, bB, encodeModifiers(accentStyle.modifiers));
    } else {
      card.set(0, y, {
        char: '\u258e',
        fg: accentStyle.fg,
        bg: backgroundStyle.bg,
        modifiers: accentStyle.modifiers ? [...accentStyle.modifiers] : undefined,
        empty: false,
      });
    }
    card.blit(
      contentRows[y]!,
      2,
      y,
      0,
      0,
      contentRows[y]!.width,
      1,
      {
        char: true,
        fg: true,
        bg: false,
        modifiers: true,
        alpha: true,
      },
    );
  }

  return {
    item,
    surface: card,
    dismissRect: {
      row: 0,
      col: Math.max(0, card.width - 2),
      width: 1,
      height: 1,
    },
    actionRect,
  };
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
