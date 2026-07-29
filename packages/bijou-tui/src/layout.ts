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

export { hstack, vstack } from './layout-stack.js';
