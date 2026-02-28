import type { BijouContext } from '../../ports/context.js';
import type { TokenValue } from '../theme/tokens.js';
import { getDefaultContext } from '../../context.js';
import { graphemeWidth } from '../text/grapheme.js';
import { clipToWidth } from '../text/clip.js';

/** Configuration for rendering a bordered box. */
export interface BoxOptions {
  /** Theme token applied to border characters. */
  borderToken?: TokenValue;
  /** Inner padding between the border and content (in characters/lines). */
  padding?: { top?: number; bottom?: number; left?: number; right?: number };
  /** Lock outer width (including borders). Content is clipped/padded to fit. */
  width?: number;
  /** Bijou context for I/O, styling, and mode detection. */
  ctx?: BijouContext;
}

/** Unicode box-drawing characters for single-line borders. */
const BORDER = { tl: '\u250c', tr: '\u2510', bl: '\u2514', br: '\u2518', h: '\u2500', v: '\u2502' };

/**
 * Draw a unicode box around the given content string.
 *
 * Supports both auto-width (measured from content) and fixed-width modes.
 * Content lines wider than the available space are clipped.
 *
 * @param content - Multiline string to place inside the box.
 * @param borderColor - Function that wraps border characters with color styling.
 * @param padding - Resolved padding values (top, bottom, left, right).
 * @param fixedWidth - If provided, lock the outer width and clip/pad content to fit.
 * @returns The rendered box as a multiline string.
 */
function drawBox(
  content: string,
  borderColor: (s: string) => string,
  padding: { top: number; bottom: number; left: number; right: number },
  fixedWidth?: number,
): string {
  const contentLines = content.split('\n');

  let innerWidth: number;
  let contentWidth: number;

  if (fixedWidth !== undefined) {
    // Fixed outer width: outer = border(1) + inner + border(1)
    innerWidth = Math.max(0, fixedWidth - 2);
    contentWidth = Math.max(0, innerWidth - padding.left - padding.right);
  } else {
    // Auto width: measure content
    const maxWidth = contentLines.reduce((max, line) => Math.max(max, graphemeWidth(line)), 0);
    contentWidth = maxWidth;
    innerWidth = maxWidth + padding.left + padding.right;
  }

  // When fixed width, padding may exceed innerWidth — clamp to fit
  const effectiveLeft = fixedWidth !== undefined ? Math.min(padding.left, innerWidth) : padding.left;
  const effectiveRight = fixedWidth !== undefined ? Math.min(padding.right, Math.max(0, innerWidth - effectiveLeft)) : padding.right;

  const pad = (line: string): string => {
    const visible = graphemeWidth(line);
    let processed = line;
    if (visible > contentWidth) {
      processed = clipToWidth(line, contentWidth);
    }
    const processedVisible = graphemeWidth(processed);
    const leftPad = ' '.repeat(effectiveLeft);
    const rightPad = ' '.repeat(effectiveRight + Math.max(0, contentWidth - processedVisible));
    return leftPad + processed + rightPad;
  };

  const top = borderColor(BORDER.tl + BORDER.h.repeat(innerWidth) + BORDER.tr);
  const bottom = borderColor(BORDER.bl + BORDER.h.repeat(innerWidth) + BORDER.br);
  const emptyLine = borderColor(BORDER.v) + ' '.repeat(innerWidth) + borderColor(BORDER.v);

  const lines: string[] = [top];
  for (let i = 0; i < padding.top; i++) lines.push(emptyLine);
  for (const line of contentLines) {
    lines.push(borderColor(BORDER.v) + pad(line) + borderColor(BORDER.v));
  }
  for (let i = 0; i < padding.bottom; i++) lines.push(emptyLine);
  lines.push(bottom);

  return lines.join('\n');
}

/**
 * Resolve the provided context or fall back to the default context.
 *
 * @param ctx - Optional context override.
 * @returns The resolved {@link BijouContext}.
 */
function resolveCtx(ctx?: BijouContext): BijouContext {
  if (ctx) return ctx;
  return getDefaultContext();
}

/**
 * Render content inside a bordered box.
 *
 * Output adapts to the current output mode:
 * - `interactive` / `static` — unicode box with themed border color.
 * - `pipe` / `accessible` — raw content without borders.
 *
 * @param content - Text to display inside the box (may contain newlines).
 * @param options - Box configuration.
 * @returns The rendered box string, or plain content in non-visual modes.
 */
export function box(content: string, options: BoxOptions = {}): string {
  const ctx = resolveCtx(options.ctx);
  const mode = ctx.mode;

  if (mode === 'pipe' || mode === 'accessible') {
    return content;
  }

  const borderToken = options.borderToken ?? ctx.theme.theme.border.primary;
  const padding = {
    top: options.padding?.top ?? 0,
    bottom: options.padding?.bottom ?? 0,
    left: options.padding?.left ?? 1,
    right: options.padding?.right ?? 1,
  };

  const colorize = (s: string): string => ctx.style.styled(borderToken, s);

  return drawBox(content, colorize, padding, options.width);
}

/** Configuration for {@link headerBox}, extending {@link BoxOptions} with label support. */
export interface HeaderBoxOptions extends BoxOptions {
  /** Optional detail text displayed after the label in a muted style. */
  detail?: string;
  /** Theme token applied to the label text. */
  labelToken?: TokenValue;
}

/**
 * Render a labeled box with an optional detail line.
 *
 * In visual modes the label is styled with the primary semantic token and
 * wrapped in a {@link box}. Pipe mode returns plain text; accessible mode
 * uses a colon separator.
 *
 * @param label - Primary heading text.
 * @param options - Header box configuration.
 * @returns The rendered header box string.
 */
export function headerBox(label: string, options: HeaderBoxOptions = {}): string {
  const ctx = resolveCtx(options.ctx);
  const mode = ctx.mode;
  const detail = options.detail ?? '';

  if (mode === 'pipe') {
    return detail ? `${label}  ${detail}` : label;
  }
  if (mode === 'accessible') {
    return detail ? `${label}: ${detail}` : label;
  }

  const labelToken = options.labelToken ?? ctx.theme.theme.semantic.primary;
  const content = detail
    ? ctx.style.styled(labelToken, label) + ctx.style.styled(ctx.theme.theme.semantic.muted, `  ${detail}`)
    : ctx.style.styled(labelToken, label);

  return box(content, options);
}
