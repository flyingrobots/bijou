import { createSurface, type Surface } from '../../ports/surface.js';
import { graphemeClusterWidth, sanitizePlainTerminalText, segmentGraphemes } from '../text/index.js';
import { writeSurfaceGrapheme } from '../render/differ-string.js';
import { resolveSafeCtx } from '../resolve-ctx.js';
import { orderForDirection, resolveDirection, type InlineDirection } from '../direction/direction.js';

/** One run of text in a drawn row, with optional cell modifiers. */
export interface DrawSpan {
  readonly text: string;
  readonly modifiers?: readonly string[];
}

/** One row of a drawn block, as spans in reading (logical) order. */
export type DrawRow = readonly DrawSpan[];

/** A span of `text` with optional cell modifiers such as `bold`. */
export function span(text: string, ...modifiers: string[]): DrawSpan {
  return modifiers.length === 0 ? { text } : { text, modifiers };
}

/**
 * The inline direction drawings follow: the default context's direction when
 * one is configured, otherwise `ltr`. Block render input carries no context.
 */
export function drawDirection(): InlineDirection {
  return resolveDirection({ ctx: resolveSafeCtx() });
}

function graphemes(text: string): string[] {
  return segmentGraphemes(sanitizePlainTerminalText(text));
}

function cellWidth(grapheme: string): number {
  return Math.max(1, graphemeClusterWidth(grapheme));
}

/** Display width of `text` after terminal-text sanitizing. */
export function textWidth(text: string): number {
  return graphemes(text).reduce((sum, grapheme) => sum + cellWidth(grapheme), 0);
}

/** `text` sanitized and cut to `width` columns, ending in `…` when cut. */
export function fitText(text: string, width: number): string {
  if (width <= 0) return '';
  if (textWidth(text) <= width) return sanitizePlainTerminalText(text);
  let used = 0;
  let kept = '';
  for (const grapheme of graphemes(text)) {
    const next = cellWidth(grapheme);
    if (used + next > width - 1) break;
    kept += grapheme;
    used += next;
  }
  return `${kept}…`;
}

/**
 * `text` fitted to `width` and padded with spaces so it meets the logical
 * `start` or `end` edge of its column (or sits in the centre) under `direction`.
 */
export function alignText(
  text: string,
  width: number,
  align: 'start' | 'end' | 'center',
  direction: InlineDirection,
): string {
  const fitted = fitText(text, width);
  const room = Math.max(0, width - textWidth(fitted));
  const leftEdge = (align === 'start') === (direction === 'ltr');
  if (align !== 'center') return leftEdge ? fitted + ' '.repeat(room) : ' '.repeat(room) + fitted;
  const before = Math.floor(room / 2);
  return ' '.repeat(before) + fitted + ' '.repeat(room - before);
}

/** Short inline `parts` joined by `separator` in visual order for `direction`. Empty parts are left out. */
export function joinInline(parts: readonly (string | undefined)[], direction: InlineDirection, separator = ' '): string {
  const present = parts.filter((part): part is string => part !== undefined && part !== '');
  return orderForDirection(present, direction).join(separator);
}

function drawRow(surface: Surface, row: DrawRow, y: number, direction: InlineDirection): void {
  const visual = orderForDirection(row, direction);
  const used = visual.reduce((sum, part) => sum + textWidth(part.text), 0);
  let x = direction === 'rtl' ? Math.max(0, surface.width - used) : 0;
  for (const part of visual) {
    const style = part.modifiers === undefined ? undefined : { modifiers: [...part.modifiers] };
    for (const grapheme of graphemes(part.text)) {
      if (x + cellWidth(grapheme) > surface.width) return;
      x += writeSurfaceGrapheme(surface, x, y, grapheme, style);
    }
  }
}

/**
 * Draws `rows` into a Surface exactly `width` columns wide. Each row starts at
 * the logical start edge: the left under `ltr`, the right under `rtl`, where
 * the row's spans also run right to left. Text that would pass the edge is cut.
 */
export function drawRows(rows: readonly DrawRow[], width: number, direction: InlineDirection): Surface {
  const surface = createSurface(width, Math.max(1, rows.length));
  rows.forEach((row, y) => {
    drawRow(surface, row, y, direction);
  });
  return surface;
}
