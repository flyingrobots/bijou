import type { BijouContext, OverflowBehavior, TokenValue } from '@flyingrobots/bijou';
import { makeBgFill, wrapToWidth } from '@flyingrobots/bijou';
import type { Overlay } from './overlay.js';
import type { LayoutRect } from './layout-rect.js';
import { clipToWidth, visibleLength } from './viewport.js';

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

const ENTER_DURATION_MS = 180;
const EXIT_DURATION_MS = 140;
const DEFAULT_MARGIN = 1;
const DEFAULT_GAP = 1;

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
    nextId: 1,
  };
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

    const progress = Math.max(0, item.progress - (deltaMs / EXIT_DURATION_MS));
    if (progress > 0) {
      nextItems.push({
        ...item,
        progress,
        updatedAtMs: nowMs,
      });
    }
  }

  return {
    ...state,
    items: nextItems,
    focusedId: normalizeFocusedId(nextItems, state.focusedId),
  };
}

export function hasNotifications<Msg>(state: NotificationState<Msg>): boolean {
  return state.items.length > 0;
}

export function notificationsNeedTick<Msg>(state: NotificationState<Msg>): boolean {
  return state.items.some((item) => item.phase !== 'visible' || item.durationMs != null);
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

function styleAccent(
  text: string,
  item: NotificationRecord<unknown>,
  ctx: BijouContext | undefined,
): string {
  if (!ctx) return text;
  return ctx.style.styled(item.accentToken ?? ctx.border(TONE_BORDER_KEYS[item.tone]), text);
}

function styleIcon(
  item: NotificationRecord<unknown>,
  ctx: BijouContext | undefined,
): string {
  const icon = TONE_ICONS[item.tone];
  if (!ctx) return icon;
  return ctx.style.styled(ctx.semantic(toneSemanticKey(item.tone)), icon);
}

function styleTitle(text: string, ctx: BijouContext | undefined): string {
  return ctx ? ctx.style.bold(text) : text;
}

function styleMuted(text: string, ctx: BijouContext | undefined): string {
  return ctx ? ctx.style.styled(ctx.semantic('muted'), text) : text;
}

function styleButton(text: string, focused: boolean, ctx: BijouContext | undefined): string {
  const raw = focused ? `[ ${text} ]` : `  ${text}  `;
  return focused && ctx ? ctx.style.bold(raw) : raw;
}

function padLine(line: string, width: number): string {
  const clipped = clipToWidth(line, width);
  return clipped + ' '.repeat(Math.max(0, width - visibleLength(clipped)));
}

function composeColumns(left: string, right: string, width: number): string {
  const safeRight = clipToWidth(right, width);
  const rightWidth = visibleLength(safeRight);
  const safeLeft = clipToWidth(left, Math.max(0, width - rightWidth));
  const gap = Math.max(0, width - visibleLength(safeLeft) - rightWidth);
  return safeLeft + ' '.repeat(gap) + safeRight;
}

function fitOverflowLines(line: string, width: number, overflow: OverflowBehavior): string[] {
  if (overflow === 'truncate') return [padLine(line, width)];
  return wrapToWidth(line, width).map((fragment) => padLine(fragment, width));
}

function composeOverflowColumns(
  left: string,
  right: string,
  width: number,
  overflow: OverflowBehavior,
): string[] {
  if (overflow === 'truncate') return [composeColumns(left, right, width)];

  const safeRight = clipToWidth(right, width);
  const rightWidth = visibleLength(safeRight);
  const leftWidth = Math.max(1, width - rightWidth - (rightWidth > 0 ? 1 : 0));
  const wrappedLeft = wrapToWidth(left, leftWidth);

  if (wrappedLeft.length === 0) return [composeColumns('', safeRight, width)];

  return [
    composeColumns(wrappedLeft[0]!, safeRight, width),
    ...wrappedLeft.slice(1).map((fragment) => padLine(fragment, width)),
  ];
}

function wrapPanelLines(
  accent: string,
  bodyLines: readonly string[],
  textWidth: number,
  fill: (text: string) => string,
  overflow: OverflowBehavior,
): string {
  return bodyLines
    .flatMap((line) => fitOverflowLines(line, textWidth, overflow))
    .map((line) => accent + fill(` ${line} `))
    .join('\n');
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

function renderNotificationContent<Msg>(
  item: NotificationRecord<Msg>,
  options: RenderNotificationStackOptions,
  focused: boolean,
): string {
  const ctx = options.ctx;
  const accent = styleAccent('\u258e', item, ctx);
  const fill = makeBgFill(item.bgToken ?? defaultBgToken(ctx), ctx) ?? ((text: string) => text);
  const icon = styleIcon(item, ctx);
  const closeMark = styleMuted('\u2715', ctx);
  const textWidth = measureTextWidth(item, options.region?.width ?? options.screenWidth);
  const subtitle = styleMuted(item.message, ctx);
  const title = styleTitle(item.title, ctx);
  const overflow = item.overflow;

  if (item.variant === 'INLINE') {
    const left = `${icon} ${title}${item.message ? ` ${subtitle}` : ''}`;
    return wrapPanelLines(accent, composeOverflowColumns(left, closeMark, textWidth, overflow), textWidth, fill, 'truncate');
  }

  const lines: string[] = [
    ...composeOverflowColumns(`${icon} ${title}`, closeMark, textWidth, overflow),
  ];

  if (item.message.length > 0) {
    lines.push(subtitle);
  }

  if (item.variant === 'ACTIONABLE') {
    lines.push('');
    if (item.action != null) {
      lines.push(styleButton(item.action.label, focused, ctx));
    } else {
      lines.push(styleMuted('Dismiss', ctx));
    }
  }

  if (item.variant === 'TOAST') {
    lines.push('');
    lines.push(styleMuted(formatTimeLabel(item.createdAtMs), ctx));
  }

  return wrapPanelLines(accent, lines, textWidth, fill, overflow);
}

function sortForPlacement<Msg>(
  items: readonly NotificationRecord<Msg>[],
  placement: NotificationPlacement,
): readonly NotificationRecord<Msg>[] {
  const ordered = [...items].sort((left, right) => right.createdAtMs - left.createdAtMs);
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
  progress: number,
): { readonly rowDelta: number; readonly colDelta: number } {
  const remaining = 1 - progress;
  const slideX = Math.round(remaining * Math.max(2, Math.min(8, Math.floor(width / 4))));
  const slideY = Math.round(remaining * Math.max(1, Math.min(3, Math.floor(height / 2))));

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

export function renderNotificationStack<Msg>(
  state: NotificationState<Msg>,
  options: RenderNotificationStackOptions,
): readonly Overlay[] {
  const screenWidth = Math.max(0, options.screenWidth);
  const screenHeight = Math.max(0, options.screenHeight);
  if (screenWidth <= 0 || screenHeight <= 0) return [];

  const region = options.region == null
    ? { row: 0, col: 0, width: screenWidth, height: screenHeight }
    : {
      row: Math.max(0, options.region.row),
      col: Math.max(0, options.region.col),
      width: Math.max(0, options.region.width),
      height: Math.max(0, options.region.height),
    };
  if (region.width <= 0 || region.height <= 0) return [];

  const margin = options.margin ?? DEFAULT_MARGIN;
  const gap = options.gap ?? DEFAULT_GAP;
  const grouped = new Map<NotificationPlacement, NotificationRecord<Msg>[]>();

  for (const item of state.items) {
    const placementItems = grouped.get(item.placement) ?? [];
    placementItems.push(item);
    grouped.set(item.placement, placementItems);
  }

  const overlays: Overlay[] = [];

  for (const [placement, items] of grouped) {
    const rendered = sortForPlacement(items, placement).map((item) => {
      const content = renderNotificationContent(item, options, state.focusedId === item.id);
      const lines = content.split('\n');
      return {
        item,
        content,
        width: visibleLength(lines[0] ?? ''),
        height: lines.length,
      };
    });

    const totalHeight = rendered.reduce((sum, entry) => sum + entry.height, 0) + Math.max(0, rendered.length - 1) * gap;
    const mode = placementSortSign(placement);
    let cursor = mode === 'top'
      ? margin
      : (mode === 'bottom'
        ? Math.max(margin, region.height - totalHeight - margin)
        : Math.max(0, Math.floor((region.height - totalHeight) / 2)));

    for (const entry of rendered) {
      const baseRow = cursor;
      const baseCol = anchoredCol(placement, entry.width, region.width, margin);
      const offset = applyAnimationOffset(placement, entry.width, entry.height, entry.item.progress);
      overlays.push({
        row: Math.max(0, region.row + baseRow + offset.rowDelta),
        col: Math.max(0, region.col + baseCol + offset.colDelta),
        content: entry.content,
      });
      cursor += entry.height + gap;
    }
  }

  return overlays;
}
