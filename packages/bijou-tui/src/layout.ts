import { visibleLength, clipToWidth } from './viewport.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type HAlign = 'left' | 'center' | 'right';
export type VAlign = 'top' | 'middle' | 'bottom';

export interface PlaceOptions {
  readonly width: number;
  readonly height: number;
  readonly hAlign?: HAlign;
  readonly vAlign?: VAlign;
}

// ---------------------------------------------------------------------------
// place()
// ---------------------------------------------------------------------------

/**
 * Place content within a fixed-size rectangle, aligned horizontally and
 * vertically. Lines are padded/clipped to exactly `width` visible characters
 * and the output is exactly `height` lines tall.
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
 */
export function vstack(...blocks: string[]): string {
  return blocks.join('\n');
}

/**
 * Horizontal stack — place blocks side by side with a gap between columns.
 * Pads shorter blocks with empty lines to align rows.
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

/** Width of a string with ANSI escapes stripped. */
function visualWidth(s: string): number {
  // Strip ANSI escape sequences
  // eslint-disable-next-line no-control-regex
  return s.replace(/\x1b\[[0-9;]*m/g, '').length;
}
