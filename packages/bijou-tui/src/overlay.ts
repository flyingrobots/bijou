/**
 * Overlay compositing primitives for TUI apps.
 *
 * - `composite()` — paint overlays onto a background string (ANSI-safe)
 * - `compositeSurface()` — paint overlays onto a background surface
 * - `modal()` — centered dialog overlay with title, body, hint
 * - `toast()` — anchored notification overlay with variant icons
 * - `tooltip()` — positioned overlay relative to a target element
 */

import type { BijouContext, Surface, PackedSurface, TokenValue, Cell } from '@flyingrobots/bijou';
import { FLAG_DIM, FLAG_EMPTY } from '@flyingrobots/bijou';
import { CELL_STRIDE, OFF_FLAGS, OFF_ALPHA, FLAG_BG_SET, parseHex } from '@flyingrobots/bijou/perf';
import {
  createSurface,
  graphemeClusterWidth,
  parseAnsiToSurface,
  segmentGraphemes,
  shouldApplyBg,
  stripAnsi,
  surfaceToString,
} from '@flyingrobots/bijou';
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

/** Structured overlay content accepted by the surface-native overlay family. */
export type OverlayContent = string | Surface;

/**
 * Configuration for the {@link modal} overlay.
 */
export interface ModalOptions {
  /** Optional title displayed at the top of the modal (bolded when ctx provided). */
  readonly title?: string;
  /** Body content of the modal. Accepts plain text or a structured surface. */
  readonly body: OverlayContent;
  /** Optional hint content displayed below the body (muted when ctx provided). */
  readonly hint?: OverlayContent;
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

/**
 * Paint one or more overlays onto a background surface.
 *
 * Overlays are applied in array order, with later overlays painting over
 * earlier ones. String-only overlays are normalized through an explicit
 * ANSI-to-surface bridge at the composition edge.
 */
export function compositeSurface(
  background: Surface,
  overlays: readonly Overlay[],
  options?: CompositeOptions,
): Surface {
  const result = background.clone();
  return compositeSurfaceInto(result, result, overlays, options);
}

/**
 * Paint overlays onto an existing target surface, optionally starting from an
 * existing background surface.
 *
 * When `background` and `target` are the same object, the surface is
 * composited in place without an extra clone.
 */
export function compositeSurfaceInto(
  background: Surface,
  target: Surface,
  overlays: readonly Overlay[],
  options?: CompositeOptions,
): Surface {
  if (target !== background) {
    target.clear();
    target.blit(background, 0, 0);
  }

  if (options?.dim) {
    const packed = 'buffer' in target && (target as PackedSurface).buffer instanceof Uint8Array;
    if (packed) {
      // Fast path: set the dim flag bit directly in the buffer
      const buf = (target as PackedSurface).buffer;
      const size = target.width * target.height;
      for (let i = 0; i < size; i++) {
        const off = i * CELL_STRIDE;
        if (buf[off + OFF_FLAGS]! & FLAG_EMPTY) continue;
        // Skip space chars (charCode 0x20)
        if (buf[off]! === 0x20 && buf[off + 1]! === 0) continue;
        buf[off + OFF_FLAGS] = buf[off + OFF_FLAGS]! | FLAG_DIM;
      }
      (target as PackedSurface).markAllDirty();
    } else {
      for (let y = 0; y < target.height; y++) {
        for (let x = 0; x < target.width; x++) {
          const cell = target.get(x, y);
          if (cell.empty || cell.char === ' ') continue;
          const modifiers = cell.modifiers ?? [];
          if (!modifiers.includes('dim')) {
            target.set(x, y, { ...cell, modifiers: [...modifiers, 'dim'], empty: false });
          }
        }
      }
    }
  }

  for (const overlay of overlays) {
    target.blit(overlay.surface ?? surfaceFromContent(overlay.content), overlay.col, overlay.row);
  }

  return target;
}

// ---------------------------------------------------------------------------
// surface helpers
// ---------------------------------------------------------------------------

type CellStyle = Pick<Cell, 'fg' | 'bg' | 'modifiers'>;

function styleFromToken(token: TokenValue | undefined, ctx: BijouContext | undefined): CellStyle {
  if (!ctx || token == null) return {};
  return {
    fg: token.hex,
    bg: token.bg,
    modifiers: token.modifiers ? [...token.modifiers] : undefined,
  };
}

function backgroundStyleFromToken(token: TokenValue | undefined, ctx: BijouContext | undefined): CellStyle {
  if (!ctx || !shouldApplyBg(ctx) || !token?.bg) return {};
  return { bg: token.bg };
}

function mergeStyles(base: CellStyle, extra: CellStyle): CellStyle {
  const modifiers = [...(base.modifiers ?? []), ...(extra.modifiers ?? [])];
  return {
    fg: extra.fg ?? base.fg,
    bg: extra.bg ?? base.bg,
    modifiers: modifiers.length > 0 ? Array.from(new Set(modifiers)) : undefined,
  };
}

function plainSurfaceToString(surface: Surface): string {
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

function overlayContentFromSurface(surface: Surface, ctx: BijouContext | undefined): string {
  return ctx ? surfaceToString(surface, ctx.style) : plainSurfaceToString(surface);
}

function setStyledCell(surface: Surface, x: number, y: number, char: string, style: CellStyle, numStyle?: { fR: number; fG: number; fB: number; bR: number; bG: number; bB: number; fl: number }): void {
  if (numStyle && 'buffer' in surface) {
    (surface as PackedSurface).setRGB(x, y, char, numStyle.fR, numStyle.fG, numStyle.fB, numStyle.bR, numStyle.bG, numStyle.bB, numStyle.fl);
  } else {
    surface.set(x, y, { char, ...style, empty: false });
  }
}

function setStyledGrapheme(surface: Surface, x: number, y: number, char: string, style: CellStyle, numStyle?: { fR: number; fG: number; fB: number; bR: number; bG: number; bB: number; fl: number }): number {
  if (x >= surface.width) return 0;

  const width = Math.max(1, graphemeClusterWidth(char));
  setStyledCell(surface, x, y, char, style, numStyle);
  for (let offset = 1; offset < width && x + offset < surface.width; offset++) {
    setStyledCell(surface, x + offset, y, '', style);
  }
  return width;
}

function lineSurface(text: string, style: CellStyle = {}): Surface {
  if (text.length === 0) return createSurface(0, 1);

  const plain = stripAnsi(text);
  const width = Math.max(0, visibleLength(text));

  if (width === 0) return createSurface(0, 1);
  if (plain !== text && style.fg == null && style.bg == null && style.modifiers == null) {
    return parseAnsiToSurface(text, width, 1);
  }

  const graphemes = segmentGraphemes(plain);
  const surface = createSurface(width, 1);
  // Pre-parse style for setRGB fast path
  let ns: { fR: number; fG: number; fB: number; bR: number; bG: number; bB: number; fl: number } | undefined;
  if ('buffer' in surface) {
    let fR = -1, fG = 0, fB = 0, bR = -1, bG = 0, bB = 0;
    const fgRgb = style.fg ? parseHex(style.fg) : undefined;
    if (fgRgb) { [fR, fG, fB] = fgRgb; }
    const bgRgb = style.bg ? parseHex(style.bg) : undefined;
    if (bgRgb) { [bR, bG, bB] = bgRgb; }
    ns = { fR, fG, fB, bR, bG, bB, fl: 0 };
  }
  let x = 0;
  for (const grapheme of graphemes) {
    if (x >= width) break;
    x += setStyledGrapheme(surface, x, 0, grapheme, style, ns);
  }
  return surface;
}

function lineWithInheritedBackground(line: Surface, bg: string | undefined): Surface {
  if (bg == null || line.width === 0) return line;
  const result = line.clone();
  // Fast path: packed surface — write bg bytes directly
  const packed = 'buffer' in result && (result as PackedSurface).buffer instanceof Uint8Array;
  const rgb = packed ? parseHex(bg) : undefined;
  if (rgb) {
    const [bgR, bgG, bgB] = rgb;
    const buf = (result as PackedSurface).buffer;
    for (let i = 0; i < result.width; i++) {
      const off = i * CELL_STRIDE;
      if (buf[off + OFF_FLAGS]! & FLAG_EMPTY) continue;
      if (buf[off + OFF_ALPHA]! & FLAG_BG_SET) continue;
      buf[off + 5] = bgR; buf[off + 6] = bgG; buf[off + 7] = bgB;
      buf[off + OFF_ALPHA] = buf[off + OFF_ALPHA]! | FLAG_BG_SET;
    }
    (result as PackedSurface).markAllDirty();
    return result;
  }
  for (let x = 0; x < result.width; x++) {
    const cell = result.get(x, 0);
    if (cell.empty) continue;
    result.set(x, 0, { ...cell, bg: cell.bg ?? bg, empty: false });
  }
  return result;
}

function surfaceRows(surface: Surface, maxWidth?: number): Surface[] {
  const width = maxWidth != null ? Math.max(0, Math.min(surface.width, maxWidth)) : surface.width;
  if (surface.height <= 0) return [createSurface(width, 1)];

  const rows: Surface[] = [];
  for (let y = 0; y < surface.height; y++) {
    const row = createSurface(width, 1);
    if (width > 0) row.blit(surface, 0, 0, 0, y, width, 1);
    rows.push(row);
  }
  return rows;
}

function contentLines(content: OverlayContent, maxWidth?: number): Surface[] {
  if (typeof content === 'string') {
    return content.split('\n').map((line) => lineSurface(maxWidth != null ? clipToWidth(line, maxWidth) : line));
  }

  return surfaceRows(content, maxWidth);
}

function renderBoxSurface(
  lines: readonly Surface[],
  borderStyle: CellStyle,
  fillStyle: CellStyle,
  innerWidthOverride?: number,
): Surface {
  const innerWidth = innerWidthOverride ?? lines.reduce((max, line) => Math.max(max, line.width), 0);
  const width = innerWidth + 4;
  const height = lines.length + 2;
  const surface = createSurface(width, height);

  setStyledCell(surface, 0, 0, BORDER.tl, borderStyle);
  for (let x = 1; x < width - 1; x++) setStyledCell(surface, x, 0, BORDER.h, borderStyle);
  setStyledCell(surface, width - 1, 0, BORDER.tr, borderStyle);

  setStyledCell(surface, 0, height - 1, BORDER.bl, borderStyle);
  for (let x = 1; x < width - 1; x++) setStyledCell(surface, x, height - 1, BORDER.h, borderStyle);
  setStyledCell(surface, width - 1, height - 1, BORDER.br, borderStyle);

  for (let i = 0; i < lines.length; i++) {
    const y = i + 1;
    setStyledCell(surface, 0, y, BORDER.v, borderStyle);
    for (let x = 1; x < width - 1; x++) setStyledCell(surface, x, y, ' ', fillStyle);
    setStyledCell(surface, width - 1, y, BORDER.v, borderStyle);

    const line = lineWithInheritedBackground(lines[i]!, fillStyle.bg);
    if (line.width > 0 && innerWidth > 0) {
      surface.blit(line, 2, y, 0, 0, Math.min(line.width, innerWidth), 1);
    }
  }

  return surface;
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

  const lines: Surface[] = [];

  if (title != null) {
    lines.push(lineSurface(title, ctx ? { modifiers: ['bold'] } : {}), createSurface(0, 1));
  }

  lines.push(...contentLines(body));

  if (hint != null) {
    lines.push(createSurface(0, 1));
    if (typeof hint === 'string') {
      lines.push(lineSurface(hint, styleFromToken(ctx?.semantic('muted'), ctx)));
    } else {
      lines.push(...surfaceRows(hint));
    }
  }

  const surface = renderBoxSurface(
    lines,
    styleFromToken(options.borderToken, ctx),
    backgroundStyleFromToken(options.bgToken, ctx),
    options.width != null ? Math.max(0, options.width - 4) : undefined,
  );
  const margin = resolveOverlayMargin(screenWidth, screenHeight, options.margin);
  const row = clampCenteredPosition(screenHeight, surface.height, margin);
  const col = clampCenteredPosition(screenWidth, surface.width, margin);

  return { content: overlayContentFromSurface(surface, ctx), surface, row, col };
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
  const line = lineSurface(`${icon} ${message}`, styleFromToken(ctx?.semantic(variant), ctx));
  const surface = renderBoxSurface(
    [line],
    styleFromToken(ctx?.border(TOAST_BORDER[variant]), ctx),
    backgroundStyleFromToken(options.bgToken, ctx),
  );

  let row: number;
  let col: number;

  switch (anchor) {
    case 'top-right':
      row = resolvedMargin;
      col = screenWidth - surface.width - resolvedMargin;
      break;
    case 'bottom-right':
      row = screenHeight - surface.height - resolvedMargin;
      col = screenWidth - surface.width - resolvedMargin;
      break;
    case 'bottom-left':
      row = screenHeight - surface.height - resolvedMargin;
      col = resolvedMargin;
      break;
    case 'top-left':
      row = resolvedMargin;
      col = resolvedMargin;
      break;
  }

  row = Math.max(0, row);
  col = Math.max(0, col);

  return { content: overlayContentFromSurface(surface, ctx), surface, row, col };
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
  /** Content to display inside the drawer. Accepts plain text or a structured surface. */
  readonly content: OverlayContent;
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

  const borderStyle = styleFromToken(options.borderToken, ctx);
  const fillStyle = backgroundStyleFromToken(options.bgToken, ctx);
  const titleStyle = ctx ? { modifiers: ['bold'] as string[] } : {};
  const surface = createSurface(width, height);

  if (width === 0 || height === 0) {
    return { content: overlayContentFromSurface(surface, ctx), surface, row, col };
  }

  for (let x = 0; x < width; x++) {
    const topChar = x === 0 ? BORDER.tl : x === width - 1 ? BORDER.tr : BORDER.h;
    setStyledCell(surface, x, 0, topChar, borderStyle);
    if (height > 1) {
      const bottomChar = x === 0 ? BORDER.bl : x === width - 1 ? BORDER.br : BORDER.h;
      setStyledCell(surface, x, height - 1, bottomChar, borderStyle);
    }
  }

  if (title != null && width > 2) {
    const titleLine = lineSurface(title, titleStyle);
    const spanWidth = Math.min(width - 2, titleLine.width + 2);
    const startX = 1 + Math.max(0, Math.floor(((width - 2) - spanWidth) / 2));
    setStyledCell(surface, startX, 0, ' ', borderStyle);
    const mergedTitleStyle = mergeStyles(borderStyle, titleStyle);
    for (let x = 0; x < Math.min(titleLine.width, Math.max(0, spanWidth - 2)); x++) {
      setStyledCell(surface, startX + 1 + x, 0, titleLine.get(x, 0).char, mergedTitleStyle);
    }
    if (spanWidth >= 2) {
      setStyledCell(surface, startX + spanWidth - 1, 0, ' ', borderStyle);
    }
  }

  const rows = contentLines(content, innerWidth);
  const availableHeight = Math.max(0, height - 2);

  for (let i = 0; i < availableHeight; i++) {
    const y = i + 1;
    if (width >= 1) setStyledCell(surface, 0, y, BORDER.v, borderStyle);
    for (let x = 1; x < Math.max(1, width - 1); x++) {
      if (x < width - 1) setStyledCell(surface, x, y, ' ', fillStyle);
    }
    if (width >= 2) setStyledCell(surface, width - 1, y, BORDER.v, borderStyle);

    const line = lineWithInheritedBackground(rows[i] ?? createSurface(0, 1), fillStyle.bg);
    if (line.width > 0 && innerWidth > 0 && width >= 4) {
      surface.blit(line, 2, y, 0, 0, Math.min(line.width, innerWidth), 1);
    }
  }

  return {
    content: overlayContentFromSurface(surface, ctx),
    surface,
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
  /** Content to display inside the tooltip. Accepts plain text or a structured surface. */
  readonly content: OverlayContent;
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
  const lines = contentLines(content, maxContentWidth);
  const surface = renderBoxSurface(
    lines,
    styleFromToken(borderToken, ctx),
    backgroundStyleFromToken(bgToken, ctx),
  );

  let tipRow: number;
  let tipCol: number;

  switch (direction) {
    case 'top':
      tipRow = targetRow - surface.height;
      tipCol = targetCol - Math.floor(surface.width / 2);
      break;
    case 'bottom':
      tipRow = targetRow + 1;
      tipCol = targetCol - Math.floor(surface.width / 2);
      break;
    case 'left':
      tipRow = targetRow - Math.floor(surface.height / 2);
      tipCol = targetCol - surface.width;
      break;
    case 'right':
      tipRow = targetRow - Math.floor(surface.height / 2);
      tipCol = targetCol + 1;
      break;
  }

  // Clamp to screen bounds
  tipRow = Math.max(0, Math.min(tipRow, screenHeight - surface.height));
  tipCol = Math.max(0, Math.min(tipCol, screenWidth - surface.width));

  return { content: overlayContentFromSurface(surface, ctx), surface, row: tipRow, col: tipCol };
}

function surfaceFromContent(content: string): Surface {
  const lines = content.split('\n');
  const width = Math.max(1, ...lines.map((line) => visibleLength(line)));
  const height = Math.max(1, lines.length);
  return parseAnsiToSurface(content, width, height);
}
