/**
 * Overlay compositing primitives for TUI apps.
 *
 * - `composite()` — paint overlays onto a background string (ANSI-safe)
 * - `modal()` — centered dialog overlay with title, body, hint
 * - `toast()` — anchored notification overlay with variant icons
 * - `tooltip()` — positioned overlay relative to a target element
 */

import type { BijouContext, Surface, TokenValue } from '@flyingrobots/bijou';
import { makeBgFill } from '@flyingrobots/bijou';
import { sliceAnsi, visibleLength, clipToWidth } from './viewport.js';
import type { LayoutRect } from './layout-rect.js';
import { clampCenteredPosition, resolveOverlayMargin } from './design-language.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Positioned content block that can be composited onto a background.
 */
export interface Overlay {
  /** Rendered content string (newline-delimited lines). */
  readonly content: string;
  /** Optional cell-accurate overlay surface used by surface-first render paths. */
  readonly surface?: Surface;
  /** Top-left row position (0-based). */
  readonly row: number;
  /** Top-left column position (0-based). */
  readonly col: number;
}

/**
 * Options for the {@link composite} function.
 */
export interface CompositeOptions {
  /** Wrap background lines in dim (ANSI 2m). */
  readonly dim?: boolean;
}

/**
 * Configuration for the {@link modal} overlay.
 */
export interface ModalOptions {
  /** Optional title displayed at the top of the modal (bolded when ctx provided). */
  readonly title?: string;
  /** Body content of the modal. */
  readonly body: string;
  /** Optional hint text displayed below the body (muted when ctx provided). */
  readonly hint?: string;
  /** Screen width in columns, used for centering. */
  readonly screenWidth: number;
  /** Screen height in rows, used for centering. */
  readonly screenHeight: number;
  /** Preferred minimum width — shorter lines are padded but longer lines are not truncated (default: auto from content). */
  readonly width?: number;
  /** Preferred edge inset from the viewport when the dialog is centered. */
  readonly margin?: number;
  /** Design token for the border color. */
  readonly borderToken?: TokenValue;
  /** Background fill token for the overlay interior. */
  readonly bgToken?: TokenValue;
  /** Bijou context for styled output. */
  readonly ctx?: BijouContext;
}

/** Visual variant controlling the toast icon and border color. */
export type ToastVariant = 'success' | 'error' | 'info';

/** Screen corner where the toast is anchored. */
export type ToastAnchor = 'top-right' | 'bottom-right' | 'bottom-left' | 'top-left';

/**
 * Configuration for the {@link toast} overlay.
 */
export interface ToastOptions {
  /** Message text displayed beside the variant icon. */
  readonly message: string;
  /** Visual variant controlling icon and border color. Default: 'info'. */
  readonly variant?: ToastVariant;
  /** Screen corner to anchor the toast. Default: 'bottom-right'. */
  readonly anchor?: ToastAnchor;
  /** Screen width in columns, used for positioning. */
  readonly screenWidth: number;
  /** Screen height in rows, used for positioning. */
  readonly screenHeight: number;
  /** Rows/cols from edge. Default: 1. */
  readonly margin?: number;
  /** Background fill token for the toast interior. */
  readonly bgToken?: TokenValue;
  /** Bijou context for styled output. */
  readonly ctx?: BijouContext;
}

// ---------------------------------------------------------------------------
// Border characters (same as core box.ts)
// ---------------------------------------------------------------------------

/** Unicode box-drawing characters for overlay borders. */
const BORDER = {
  tl: '\u250c', // ┌
  tr: '\u2510', // ┐
  bl: '\u2514', // └
  br: '\u2518', // ┘
  h: '\u2500',  // ─
  v: '\u2502',  // │
};

// ---------------------------------------------------------------------------
// spliceLine (internal)
// ---------------------------------------------------------------------------

/**
 * Splice an overlay line into a background line at a given column.
 *
 * Preserve background content to the left and right of the overlay,
 * inserting ANSI resets at splice boundaries.
 *
 * @param bgLine - Background line (may contain ANSI escapes).
 * @param overlayLine - Overlay line to paint over the background.
 * @param col - Starting visible column for the overlay (0-based).
 * @returns Merged line with the overlay replacing background characters.
 */
function spliceLine(bgLine: string, overlayLine: string, col: number): string {
  const overlayVis = visibleLength(overlayLine);
  const bgVis = visibleLength(bgLine);

  const left = bgVis <= col
    ? bgLine + ' '.repeat(col - bgVis)
    : sliceAnsi(bgLine, 0, col);

  const right = sliceAnsi(bgLine, col + overlayVis, bgVis);

  return left + '\x1b[0m' + overlayLine + '\x1b[0m' + right;
}

// ---------------------------------------------------------------------------
// composite()
// ---------------------------------------------------------------------------

/**
 * Paint one or more overlays onto a background string.
 *
 * Overlay content replaces background characters at the specified position.
 * Overlays are applied in array order (later overlays paint over earlier ones).
 * ANSI escape sequences are preserved correctly at splice boundaries.
 *
 * @param background - Background content string (newline-delimited).
 * @param overlays - Positioned overlays to composite onto the background.
 * @param options - Optional compositing settings (e.g., dim background).
 * @returns Composited string with all overlays applied.
 */
export function composite(
  background: string,
  overlays: readonly Overlay[],
  options?: CompositeOptions,
): string {
  const bgLines = background.split('\n');

  if (options?.dim) {
    for (let i = 0; i < bgLines.length; i++) {
      if (visibleLength(bgLines[i]!) > 0) {
        bgLines[i] = '\x1b[2m' + bgLines[i] + '\x1b[0m';
      }
    }
  }

  for (const overlay of overlays) {
    const oLines = overlay.content.split('\n');
    for (let i = 0; i < oLines.length; i++) {
      const targetRow = overlay.row + i;
      if (targetRow < 0 || targetRow >= bgLines.length) continue;
      bgLines[targetRow] = spliceLine(bgLines[targetRow]!, oLines[i]!, overlay.col);
    }
  }

  return bgLines.join('\n');
}

// ---------------------------------------------------------------------------
// renderBox (shared between modal and toast)
// ---------------------------------------------------------------------------

/**
 * Render lines inside a unicode box border.
 *
 * Compute inner width from the widest line, then wrap all lines
 * with vertical borders and pad to uniform width.
 *
 * @param lines - Content lines to place inside the box.
 * @param borderColor - Function to apply border styling (identity for unstyled).
 * @param bgFill - Optional function to wrap interior content with background color styling.
 * @returns Box string with top/bottom borders and bordered content lines.
 */
function renderBox(
  lines: string[],
  borderColor: (s: string) => string,
  bgFill?: (s: string) => string,
): string {
  const innerWidth = lines.reduce((max, l) => Math.max(max, visibleLength(l)), 0);
  const top = borderColor(BORDER.tl + BORDER.h.repeat(innerWidth + 2) + BORDER.tr);
  const bottom = borderColor(BORDER.bl + BORDER.h.repeat(innerWidth + 2) + BORDER.br);
  const fill = bgFill ?? ((s: string) => s);
  const body = lines.map((l) => {
    const pad = innerWidth - visibleLength(l);
    return borderColor(BORDER.v) + fill(' ' + l + ' '.repeat(pad) + ' ') + borderColor(BORDER.v);
  });
  return [top, ...body, bottom].join('\n');
}

// ---------------------------------------------------------------------------
// modal()
// ---------------------------------------------------------------------------

/**
 * Create a centered modal dialog overlay.
 *
 * Build a bordered box with optional title, body, and hint text,
 * then center it on screen.
 *
 * @param options - Modal configuration including content and screen dimensions.
 * @returns Overlay positioned at the center of the screen.
 */
export function modal(options: ModalOptions): Overlay {
  const { title, body, hint, screenWidth, screenHeight, ctx } = options;

  const contentLines: string[] = [];

  if (title != null) {
    const titleText = ctx ? ctx.style.bold(title) : title;
    contentLines.push(titleText, '');
  }

  contentLines.push(...body.split('\n'));

  if (hint != null) {
    contentLines.push('');
    const hintText = ctx
      ? ctx.style.styled(ctx.semantic('muted'), hint)
      : hint;
    contentLines.push(hintText);
  }

  // If width override, constrain inner width
  if (options.width != null) {
    const targetInner = options.width - 4; // border + padding
    // Pad short lines, but don't truncate (user controls width)
    for (let i = 0; i < contentLines.length; i++) {
      const vis = visibleLength(contentLines[i]!);
      if (vis < targetInner) {
        contentLines[i] = contentLines[i]! + ' '.repeat(targetInner - vis);
      }
    }
  }

  const borderColor = ctx && options.borderToken
    ? (s: string) => ctx.style.styled(options.borderToken!, s)
    : (s: string) => s;

  const bgFill = makeBgFill(options.bgToken, ctx);

  const boxStr = renderBox(contentLines, borderColor, bgFill);
  const boxLines = boxStr.split('\n');
  const boxHeight = boxLines.length;
  const boxWidth = visibleLength(boxLines[0]!);
  const margin = resolveOverlayMargin(screenWidth, screenHeight, options.margin);

  const row = clampCenteredPosition(screenHeight, boxHeight, margin);
  const col = clampCenteredPosition(screenWidth, boxWidth, margin);

  return { content: boxStr, row, col };
}

// ---------------------------------------------------------------------------
// toast()
// ---------------------------------------------------------------------------

/** Unicode icon characters mapped by toast variant. */
const TOAST_ICONS: Record<ToastVariant, string> = {
  success: '\u2714', // ✔
  error: '\u2718',   // ✘
  info: '\u2139',    // ℹ
};

/** Semantic border token keys mapped by toast variant. */
const TOAST_BORDER: Record<ToastVariant, 'success' | 'error' | 'primary'> = {
  success: 'success',
  error: 'error',
  info: 'primary',
};

/**
 * Create an anchored toast notification overlay.
 *
 * Render a bordered box with a variant icon and message, positioned
 * at the specified screen corner with configurable margin.
 *
 * @param options - Toast configuration including message, variant, and screen dimensions.
 * @returns Overlay positioned at the specified screen corner.
 */
export function toast(options: ToastOptions): Overlay {
  const {
    message,
    variant = 'info',
    anchor = 'bottom-right',
    screenWidth,
    screenHeight,
    margin,
    ctx,
  } = options;
  const resolvedMargin = resolveOverlayMargin(screenWidth, screenHeight, margin);

  const icon = TOAST_ICONS[variant];
  let line = icon + ' ' + message;

  if (ctx) {
    line = ctx.style.styled(ctx.semantic(variant), line);
  }

  const borderKey = TOAST_BORDER[variant];
  const borderColor = ctx
    ? (s: string) => ctx.style.styled(ctx.border(borderKey), s)
    : (s: string) => s;

  const bgFill = makeBgFill(options.bgToken, ctx);

  const boxStr = renderBox([line], borderColor, bgFill);
  const boxLines = boxStr.split('\n');
  const boxHeight = boxLines.length;
  const boxWidth = visibleLength(boxLines[0]!);

  let row: number;
  let col: number;

  switch (anchor) {
    case 'top-right':
      row = resolvedMargin;
      col = screenWidth - boxWidth - resolvedMargin;
      break;
    case 'bottom-right':
      row = screenHeight - boxHeight - resolvedMargin;
      col = screenWidth - boxWidth - resolvedMargin;
      break;
    case 'bottom-left':
      row = screenHeight - boxHeight - resolvedMargin;
      col = resolvedMargin;
      break;
    case 'top-left':
      row = resolvedMargin;
      col = resolvedMargin;
      break;
  }

  row = Math.max(0, row);
  col = Math.max(0, col);

  return { content: boxStr, row, col };
}

// ---------------------------------------------------------------------------
// Drawer types
// ---------------------------------------------------------------------------

/** Side of the screen (or region) where the drawer is anchored. */
export type DrawerAnchor = 'left' | 'right' | 'top' | 'bottom';

/**
 * Configuration for the {@link drawer} overlay.
 */
interface DrawerBaseOptions {
  /** Content string to display inside the drawer. */
  readonly content: string;
  /** Screen width in columns, used for positioning. */
  readonly screenWidth: number;
  /** Screen height in rows, used for sizing. */
  readonly screenHeight: number;
  /** Optional region rectangle to attach inside, instead of full screen. */
  readonly region?: LayoutRect;
  /** Optional title displayed in the top border. */
  readonly title?: string;
  /** Design token for the border color. */
  readonly borderToken?: TokenValue;
  /** Background fill token for the drawer interior. */
  readonly bgToken?: TokenValue;
  /** Bijou context for styled output. */
  readonly ctx?: BijouContext;
}

/** Drawer options with default (right) anchor and required width. */
interface DrawerDefaultOptions extends DrawerBaseOptions {
  /** Side of the screen/region to anchor the drawer. Default: 'right'. */
  readonly anchor?: undefined;
  /** Total drawer width including borders and padding. */
  readonly width: number;
  readonly height?: never;
}

/** Drawer options for left/right anchor with required width. */
interface DrawerHorizontalOptions extends DrawerBaseOptions {
  /** Side of the screen/region to anchor the drawer. */
  readonly anchor: 'left' | 'right';
  /** Total drawer width including borders and padding. */
  readonly width: number;
  readonly height?: never;
}

/** Drawer options for top/bottom anchor with required height. */
interface DrawerVerticalOptions extends DrawerBaseOptions {
  /** Side of the screen/region to anchor the drawer. */
  readonly anchor: 'top' | 'bottom';
  /** Total drawer height including borders and padding. */
  readonly height: number;
  readonly width?: never;
}

/** Union of all drawer anchor variants (default/right, left/right, top/bottom). */
export type DrawerOptions = DrawerDefaultOptions | DrawerHorizontalOptions | DrawerVerticalOptions;

// ---------------------------------------------------------------------------
// drawer()
// ---------------------------------------------------------------------------

/**
 * Create a drawer overlay anchored to a screen edge.
 *
 * Supports horizontal anchors (`left`/`right`) that span the full screen height,
 * and vertical anchors (`top`/`bottom`) that span the full screen width.
 * Defaults to the right edge when no anchor is specified.
 * Renders a bordered panel with optional title in the top border.
 *
 * When an optional `region` is provided, the drawer is constrained to that
 * sub-region rectangle instead of spanning the full screen dimensions.
 *
 * @param options - Drawer configuration including content, anchor, and dimensions.
 * @returns Overlay positioned at the specified screen edge.
 */
export function drawer(options: DrawerOptions): Overlay {
  const {
    content,
    screenWidth,
    screenHeight,
    title,
    ctx,
  } = options;

  const region = clampRegion(options.region, screenWidth, screenHeight);
  const dims = resolveDrawerDimensions(options, region);
  const { width, height, row, col } = dims;
  const innerWidth = Math.max(0, width - 4); // border + padding on each side

  const borderColor = ctx && options.borderToken
    ? (s: string) => ctx.style.styled(options.borderToken!, s)
    : (s: string) => s;

  const bgFill = makeBgFill(options.bgToken, ctx);
  const fill = bgFill ?? ((s: string) => s);

  // Build top border
  let topInner: string;
  if (title) {
    const titleText = ctx ? ctx.style.bold(title) : title;
    const titleVis = visibleLength(titleText);
    const remaining = Math.max(0, innerWidth + 2 - titleVis - 2); // +2 for padding around border, -2 for spaces around title
    const leftDash = Math.floor(remaining / 2);
    const rightDash = remaining - leftDash;
    topInner = BORDER.h.repeat(leftDash) + ' ' + titleText + ' ' + BORDER.h.repeat(rightDash);
  } else {
    topInner = BORDER.h.repeat(innerWidth + 2);
  }
  const topLine = fitLineExact(borderColor(BORDER.tl + topInner + BORDER.tr), width);
  const bottomLine = fitLineExact(borderColor(BORDER.bl + BORDER.h.repeat(innerWidth + 2) + BORDER.br), width);

  // Build content lines
  const contentLines = content.split('\n');
  const availableHeight = Math.max(0, height - 2); // minus top + bottom border

  const bodyLines: string[] = [];
  for (let i = 0; i < availableHeight; i++) {
    const raw = contentLines[i] ?? '';
    const vis = visibleLength(raw);
    let clipped: string;
    if (vis > innerWidth) {
      clipped = clipToWidth(raw, innerWidth);
    } else {
      clipped = raw + ' '.repeat(innerWidth - vis);
    }
    bodyLines.push(fitLineExact(borderColor(BORDER.v) + fill(' ' + clipped + ' ') + borderColor(BORDER.v), width));
  }

  const allLines: string[] = [];
  if (height === 1) {
    allLines.push(topLine);
  } else if (height >= 2) {
    allLines.push(topLine, ...bodyLines, bottomLine);
  }

  return {
    content: allLines.join('\n'),
    row,
    col,
  };
}

/** Compute the final width, height, row, and col for a drawer given its anchor. */
function resolveDrawerDimensions(
  options: DrawerOptions,
  region: LayoutRect,
): { width: number; height: number; row: number; col: number } {
  if (options.anchor === 'top' || options.anchor === 'bottom') {
    const anchor = options.anchor;
    const heightRaw = options.height;
    if (heightRaw == null || !Number.isFinite(heightRaw)) {
      throw new Error(`drawer(): "height" is required for anchor "${anchor}"`);
    }
    const height = clamp(Math.floor(heightRaw), 0, region.height);
    const width = region.width;
    const col = region.col;
    const row = anchor === 'top'
      ? region.row
      : region.row + region.height - height;
    return { width, height, row: Math.max(region.row, row), col };
  }

  const anchor = options.anchor ?? 'right';
  if (anchor === 'left' || anchor === 'right') {
    const widthRaw = options.width;
    if (widthRaw == null || !Number.isFinite(widthRaw)) {
      throw new Error(`drawer(): "width" is required for anchor "${anchor}"`);
    }
    const width = clamp(Math.floor(widthRaw), 0, region.width);
    const height = region.height;
    const row = region.row;
    const col = anchor === 'left'
      ? region.col
      : region.col + region.width - width;
    return { width, height, row, col: Math.max(region.col, col) };
  }

  return assertNever(anchor);
}

/** Exhaustive check — always throws. */
function assertNever(value: never): never {
  throw new Error(`Unexpected drawer anchor: ${String(value)}`);
}

/** Normalize an optional region into a clamped LayoutRect within screen bounds. */
function clampRegion(region: LayoutRect | undefined, screenWidth: number, screenHeight: number): LayoutRect {
  const sw = Math.floor(screenWidth);
  const sh = Math.floor(screenHeight);

  if (region == null) {
    return {
      row: 0,
      col: 0,
      width: Math.floor(Math.max(0, sw)),
      height: Math.floor(Math.max(0, sh)),
    };
  }

  const row = Math.floor(clamp(region.row, 0, Math.max(0, sh)));
  const col = Math.floor(clamp(region.col, 0, Math.max(0, sw)));
  const maxWidth = Math.max(0, sw - col);
  const maxHeight = Math.max(0, sh - row);

  return {
    row,
    col,
    width: Math.floor(clamp(region.width, 0, maxWidth)),
    height: Math.floor(clamp(region.height, 0, maxHeight)),
  };
}

/** Clip or pad a single line to exactly `width` visible columns. */
function fitLineExact(line: string, width: number): string {
  const target = Math.max(0, width);
  const clipped = clipToWidth(line, target);
  const vis = visibleLength(clipped);
  return clipped + ' '.repeat(Math.max(0, target - vis));
}

/** Clamp a number between min and max. */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ---------------------------------------------------------------------------
// Tooltip types
// ---------------------------------------------------------------------------

/** Direction to place the tooltip relative to its target element. */
export type TooltipDirection = 'top' | 'bottom' | 'left' | 'right';

/**
 * Configuration for the {@link tooltip} overlay.
 */
export interface TooltipOptions {
  /** Content string to display inside the tooltip. */
  readonly content: string;
  /** Row of the target element (0-based). */
  readonly row: number;
  /** Column of the target element (0-based). */
  readonly col: number;
  /** Direction to place the tooltip relative to the target. Default: 'top'. */
  readonly direction?: TooltipDirection;
  /** Screen width in columns, used for clamping. */
  readonly screenWidth: number;
  /** Screen height in rows, used for clamping. */
  readonly screenHeight: number;
  /** Design token for the border color. */
  readonly borderToken?: TokenValue;
  /** Background fill token for the tooltip interior. */
  readonly bgToken?: TokenValue;
  /** Bijou context for styled output. */
  readonly ctx?: BijouContext;
}

// ---------------------------------------------------------------------------
// tooltip()
// ---------------------------------------------------------------------------

/**
 * Create a tooltip overlay positioned relative to a target element.
 *
 * Render a bordered box containing the content, placed in the specified
 * direction from the target. Clamp to screen bounds to prevent overflow.
 *
 * @param options - Tooltip configuration including content, target position, and direction.
 * @returns Overlay positioned relative to the target, clamped to screen bounds.
 */
export function tooltip(options: TooltipOptions): Overlay {
  const {
    content,
    row: targetRow,
    col: targetCol,
    direction = 'top',
    screenWidth,
    screenHeight,
    borderToken,
    bgToken,
    ctx,
  } = options;

  const maxContentWidth = Math.max(0, screenWidth - 4);
  const contentLines = content.split('\n').map((l) => clipToWidth(l, maxContentWidth));

  const borderColor = ctx && borderToken
    ? (s: string) => ctx.style.styled(borderToken, s)
    : (s: string) => s;

  const bgFill = makeBgFill(bgToken, ctx);

  const boxStr = renderBox(contentLines, borderColor, bgFill);
  const boxLines = boxStr.split('\n');
  const boxHeight = boxLines.length;
  const boxWidth = visibleLength(boxLines[0]!);

  let tipRow: number;
  let tipCol: number;

  switch (direction) {
    case 'top':
      tipRow = targetRow - boxHeight;
      tipCol = targetCol - Math.floor(boxWidth / 2);
      break;
    case 'bottom':
      tipRow = targetRow + 1;
      tipCol = targetCol - Math.floor(boxWidth / 2);
      break;
    case 'left':
      tipRow = targetRow - Math.floor(boxHeight / 2);
      tipCol = targetCol - boxWidth;
      break;
    case 'right':
      tipRow = targetRow - Math.floor(boxHeight / 2);
      tipCol = targetCol + 1;
      break;
  }

  // Clamp to screen bounds
  tipRow = Math.max(0, Math.min(tipRow, screenHeight - boxHeight));
  tipCol = Math.max(0, Math.min(tipCol, screenWidth - boxWidth));

  return { content: boxStr, row: tipRow, col: tipCol };
}
