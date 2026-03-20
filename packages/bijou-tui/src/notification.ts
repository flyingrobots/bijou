import type {
  BijouContext,
  OverflowBehavior,
  Surface,
  TokenValue,
} from '@flyingrobots/bijou';
import {
  createSurface,
  segmentGraphemes,
  surfaceToString,
  wrapToWidth,
} from '@flyingrobots/bijou';
import type { Overlay } from './overlay.js';
import type { LayoutRect } from './layout-rect.js';
import { visibleLength } from './viewport.js';
import { resolveNotificationGap, resolveOverlayMargin } from './design-language.js';

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

interface CellTextStyle {
  readonly fg?: string;
  readonly bg?: string;
  readonly modifiers?: readonly string[];
}

interface NotificationRenderEntry<Msg> {
  readonly item: NotificationRecord<Msg>;
  readonly surface: Surface;
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

  const lines = [
    ...wrapToWidth(title, safeWidth),
    ...wrapToWidth(metaLine, safeWidth),
    ...(messageLine == null ? [] : wrapToWidth(messageLine, safeWidth)),
    ...(actionLine == null ? [] : wrapToWidth(actionLine, safeWidth)),
  ];

  return lines.length === 0 ? [''] : lines;
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
    const empty = wrapToWidth(
      options.ctx == null
        ? `No archived notifications for ${filterLabel(filter)} yet.`
        : options.ctx.style.styled(
          options.ctx.semantic('muted'),
          `No archived notifications for ${filterLabel(filter)} yet.`,
        ),
      safeWidth,
    ).slice(0, maxBodyLines);
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
  return {
    fg: token.hex,
    bg: token.bg,
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

  for (const segment of graphemeSegments) {
    for (const char of segment.graphemes) {
      surface.set(x, 0, {
        char,
        fg: segment.style?.fg,
        bg: segment.style?.bg,
        modifiers: segment.style?.modifiers ? [...segment.style.modifiers] : undefined,
        empty: false,
      });
      x++;
    }
  }

  return surface;
}

function createBlankLineSurface(width: number): Surface {
  return createSurface(Math.max(0, width), 1);
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
): Surface {
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
      rows.push(...standaloneRows(createSegmentSurface([{ text: actionLabel, style: actionStyle }]), textWidth, overflow));
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

  for (let y = 0; y < contentRows.length; y++) {
    card.set(0, y, {
      char: '\u258e',
      fg: accentStyle.fg,
      bg: backgroundStyle.bg,
      modifiers: accentStyle.modifiers ? [...accentStyle.modifiers] : undefined,
      empty: false,
    });
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

  return card;
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
  return {
    item,
    surface: renderNotificationSurface(item, options, focusedId === item.id),
  };
}

function selectVisibleNotificationIds<Msg>(
  state: NotificationState<Msg>,
  options: RenderNotificationStackOptions,
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
      const entry = createRenderEntry(item, options, state.focusedId);
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
  options: RenderNotificationStackOptions,
  focusedId: number | undefined,
): readonly Overlay[] {
  if (exits.length === 0) return [];

  const rendered = [...exits]
    .sort((left, right) => right.updatedAtMs - left.updatedAtMs || right.id - left.id)
    .map((item) => createRenderEntry(item, options, focusedId));
  const overlays: Overlay[] = [];
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
      overlays.push({
        row: region.row + cursor + offset.rowDelta,
        col: region.col + baseCol + offset.colDelta,
        surface: entry.surface,
        content: options.ctx != null
          ? surfaceToString(entry.surface, options.ctx.style)
          : renderPlainSurface(entry.surface),
      });
      cursor -= gap;
    }
    return overlays;
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
    overlays.push({
      row: region.row + cursor + offset.rowDelta,
      col: region.col + baseCol + offset.colDelta,
      surface: entry.surface,
      content: options.ctx != null
        ? surfaceToString(entry.surface, options.ctx.style)
        : renderPlainSurface(entry.surface),
    });
    cursor += entry.surface.height + gap;
  }

  return overlays;
}

export function renderNotificationStack<Msg>(
  state: NotificationState<Msg>,
  options: RenderNotificationStackOptions,
): readonly Overlay[] {
  const screenWidth = Math.max(0, options.screenWidth);
  const screenHeight = Math.max(0, options.screenHeight);
  if (screenWidth <= 0 || screenHeight <= 0) return [];

  const region = resolveRegion(options);
  if (region.width <= 0 || region.height <= 0) return [];

  const margin = resolveOverlayMargin(region.width, region.height, options.margin);
  const gap = resolveNotificationGap(options.gap);
  const visibleIds = selectVisibleNotificationIds(state, options);
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

  const overlays: Overlay[] = [];
  const placements = new Set<NotificationPlacement>([
    ...grouped.keys(),
    ...overflowGrouped.keys(),
  ]);

  for (const placement of placements) {
    const items = grouped.get(placement) ?? [];
    const rendered = sortForPlacement(items, placement).map((item) =>
      createRenderEntry(item, options, state.focusedId)
    );

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
      overlays.push({
        row: region.row + baseRow + offset.rowDelta,
        col: region.col + baseCol + offset.colDelta,
        surface: entry.surface,
        content: options.ctx != null
          ? surfaceToString(entry.surface, options.ctx.style)
          : renderPlainSurface(entry.surface),
      });
      cursor += entry.surface.height + gap;
    }

    overlays.push(...renderOverflowExits(
      overflowGrouped.get(placement) ?? [],
      placement,
      totalHeight,
      region,
      margin,
      gap,
      options,
      state.focusedId,
    ));
  }

  return overlays;
}
