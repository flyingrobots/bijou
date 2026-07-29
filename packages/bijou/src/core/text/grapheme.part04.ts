import { segmenter } from './grapheme.part01.js';
import { stripAnsi } from './grapheme.part02.js';
import { graphemeClusterWidth } from './grapheme.part03.js';

/**
 * Compute the terminal display width of a string.
 *
 * Strip ANSI escape sequences, segment into grapheme clusters,
 * and sum display widths. Correctly handles:
 * - Multi-codepoint emoji (flags, ZWJ families, skin tones)
 * - East Asian Wide characters (CJK, fullwidth forms)
 * - Combining marks (accented characters)
 * - ANSI escape sequences (ignored)
 *
 * @param str - Input string, may contain ANSI escape sequences.
 * @returns Total display width in terminal columns.
 */
export function graphemeWidth(str: string): number {
  // Strip ANSI escapes first
  const clean = stripAnsi(str);
  if (clean.length === 0) return 0;

  let width = 0;
  for (const { segment } of segmenter().segment(clean)) {
    width += graphemeClusterWidth(segment);
  }
  return width;
}
