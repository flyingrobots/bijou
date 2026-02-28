/**
 * Layout primitives for composing terminal UI views.
 *
 * Provides `place()` for positioning content within a fixed rectangle,
 * and `vstack()`/`hstack()` for vertical and horizontal composition.
 *
 * @module layout
 */

import { visibleLength, clipToWidth } from './viewport.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Horizontal alignment option for {@link place}. */
export type HAlign = 'left' | 'center' | 'right';
/** Vertical alignment option for {@link place}. */
export type VAlign = 'top' | 'middle' | 'bottom';

/** Configuration for the {@link place} layout function. */
export interface PlaceOptions {
  /** Width of the bounding rectangle in visible characters. */
  readonly width: number;
  /** Height of the bounding rectangle in lines. */
  readonly height: number;
  /** Horizontal alignment within the rectangle. Default: `'left'`. */
  readonly hAlign?: HAlign;
  /** Vertical alignment within the rectangle. Default: `'top'`. */
  readonly vAlign?: VAlign;
}

// ---------------------------------------------------------------------------
// place()
// ---------------------------------------------------------------------------

/**
 * Place content within a fixed-size rectangle, aligned horizontally and
 * vertically. Lines are padded/clipped to exactly `width` visible characters
 * and the output is exactly `height` lines tall.
 *
 * @param content - The text content to place (may contain newlines).
 * @param options - Rectangle dimensions and alignment settings.
 * @returns A string of exactly `height` lines, each exactly `width` visible characters.
 */
export function place(content: string, options: PlaceOptions): string {
  const { width, height, hAlign = 'left', vAlign = 'top' } = options;

  if (height <= 0 || width <= 0) return '';

  const emptyLine = ' '.repeat(width);

  // Split content into lines, handle empty content
  let lines = content === '' ? [] : content.split('\n');

  // Truncate to height if too tall
  if (lines.length > height) {
    lines = lines.slice(0, height);
  }

  // Horizontal alignment: pad/clip each line to exactly `width`
  const aligned = lines.map((line) => {
    const vis = visibleLength(line);

    if (vis > width) {
      // Clip to width
      return clipToWidth(line, width);
    }

    const pad = width - vis;

    switch (hAlign) {
      case 'right':
        return ' '.repeat(pad) + line;
      case 'center': {
        const leftPad = Math.floor(pad / 2);
        const rightPad = pad - leftPad;
        return ' '.repeat(leftPad) + line + ' '.repeat(rightPad);
      }
      case 'left':
      default:
        return line + ' '.repeat(pad);
    }
  });

  // Vertical alignment: pad with empty lines to reach height
  const vPad = height - aligned.length;

  if (vPad <= 0) {
    return aligned.join('\n');
  }

  let topPad: number;
  switch (vAlign) {
    case 'bottom':
      topPad = vPad;
      break;
    case 'middle':
      topPad = Math.floor(vPad / 2);
      break;
    case 'top':
    default:
      topPad = 0;
      break;
  }

  const bottomPad = vPad - topPad;
  const result: string[] = [];

  for (let i = 0; i < topPad; i++) result.push(emptyLine);
  result.push(...aligned);
  for (let i = 0; i < bottomPad; i++) result.push(emptyLine);

  return result.join('\n');
}

// ---------------------------------------------------------------------------
// vstack / hstack
// ---------------------------------------------------------------------------

/**
 * Vertical stack — join blocks with newlines.
 *
 * @param blocks - One or more rendered string blocks to stack vertically.
 * @returns A single string with blocks separated by newlines.
 */
export function vstack(...blocks: string[]): string {
  return blocks.join('\n');
}

/**
 * Horizontal stack — place blocks side by side with a gap between columns.
 * Pads shorter blocks with empty lines to align rows.
 *
 * @param gap    - Number of space characters between adjacent columns.
 * @param blocks - One or more rendered string blocks to stack horizontally.
 * @returns A single string with blocks arranged side by side.
 */
export function hstack(gap: number, ...blocks: string[]): string {
  if (blocks.length === 0) return '';
  if (blocks.length === 1) return blocks[0]!;

  const split = blocks.map((b) => b.split('\n'));
  const maxRows = Math.max(...split.map((lines) => lines.length));
  const widths = split.map((lines) => Math.max(...lines.map(visualWidth)));
  const spacer = ' '.repeat(Math.max(0, gap));

  const rows: string[] = [];
  for (let r = 0; r < maxRows; r++) {
    const parts: string[] = [];
    for (let c = 0; c < split.length; c++) {
      const line = split[c]![r] ?? '';
      // Last column doesn't need right-padding
      if (c < split.length - 1) {
        parts.push(line + ' '.repeat(Math.max(0, widths[c]! - visualWidth(line))));
      } else {
        parts.push(line);
      }
    }
    rows.push(parts.join(spacer).trimEnd());
  }
  return rows.join('\n');
}

/**
 * Compute the visible width of a string after stripping ANSI escape sequences.
 *
 * @param s - The string possibly containing ANSI color/style codes.
 * @returns The character count excluding escape sequences.
 */
function visualWidth(s: string): number {
  // Strip ANSI escape sequences
  // eslint-disable-next-line no-control-regex
  return s.replace(/\x1b\[[0-9;]*m/g, '').length;
}
