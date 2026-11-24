import { graphemeWidth } from '../text/grapheme.part04.js';

/**
 * Right-align lines for right-to-left layout.
 *
 * The block width is the widest line by display width (ANSI ignored, wide and
 * combining characters measured), so no width option or context width is
 * needed. Shorter lines get leading spaces; empty lines stay empty.
 */
export function alignEnd(lines: readonly string[]): string {
  const width = Math.max(0, ...lines.map((line) => graphemeWidth(line)));
  return lines
    .map((line) => (line === '' ? line : ' '.repeat(width - graphemeWidth(line)) + line))
    .join('\n');
}
