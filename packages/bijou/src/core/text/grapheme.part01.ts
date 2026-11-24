/**
 * Grapheme cluster utilities for correct Unicode text measurement.
 *
 * Uses `Intl.Segmenter` for proper grapheme cluster iteration and a table
 * generated from UAX #11 East_Asian_Width for display widths.
 */
import { EAST_ASIAN_WIDE_RANGES } from './generated/east-asian-wide.js';

// ---------------------------------------------------------------------------
// Segmenter (lazy singleton)
// ---------------------------------------------------------------------------

/** Cached singleton `Intl.Segmenter` instance for grapheme-level segmentation. */
export let _segmenter: Intl.Segmenter | undefined;
/**
 * Return the lazily-initialized grapheme segmenter singleton.
 *
 * @returns The shared `Intl.Segmenter` configured for English grapheme granularity.
 */
export function segmenter(): Intl.Segmenter {
  _segmenter ??= new Intl.Segmenter('en', { granularity: 'grapheme' });
  return _segmenter;
}
// ---------------------------------------------------------------------------
// Wide character detection
// ---------------------------------------------------------------------------

/**
 * Determine whether a Unicode code point occupies two terminal columns.
 *
 * A code point is wide when its UAX #11 East_Asian_Width is W (Wide) or
 * F (Fullwidth), from the table generated from the Unicode Character Database
 * (`EAST_ASIAN_WIDE_UNICODE_VERSION`; regenerate with
 * `npm run unicode:wide-table`). East Asian Ambiguous (A) is narrow by policy.
 *
 * One addition is Bijou policy, not UAX #11: the regional indicators
 * U+1F1E6..U+1F1FF are N in the UCD but wide here, so a flag (a pair of
 * them) measures two cells.
 *
 * @param cp - Unicode code point to test.
 * @returns `true` if the code point renders as two columns wide.
 */
export function isWideChar(cp: number): boolean {
  if (cp >= 0x1f1e6 && cp <= 0x1f1ff) return true;
  let low = 0;
  let high = EAST_ASIAN_WIDE_RANGES.length - 1;
  while (low <= high) {
    const middle = (low + high) >>> 1;
    const range = EAST_ASIAN_WIDE_RANGES[middle];
    if (range === undefined) return false;
    if (cp < range[0]) high = middle - 1;
    else if (cp > range[1]) low = middle + 1;
    else return true;
  }
  return false;
}
