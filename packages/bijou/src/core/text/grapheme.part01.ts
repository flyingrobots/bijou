/**
 * Grapheme cluster utilities for correct Unicode text measurement.
 *
 * Uses `Intl.Segmenter` for proper grapheme cluster iteration and a compact
 * lookup for East Asian Wide / emoji display widths.
 */

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
 * Covers:
 * - CJK Unified Ideographs (U+4E00–U+9FFF)
 * - CJK Extension A (U+3400–U+4DBF)
 * - CJK Extension B–I (U+20000–U+3FFFF)
 * - CJK Compatibility Ideographs (U+F900–U+FAFF)
 * - Fullwidth Forms (U+FF01–U+FF60, U+FFE0–U+FFE6)
 * - CJK Radicals / Kangxi (U+2E80–U+2FDF)
 * - CJK Symbols and Punctuation (U+3000–U+303F)
 * - Enclosed CJK Letters (U+3200–U+33FF)
 * - CJK Compatibility (U+FE30–U+FE4F)
 * - Hangul Syllables (U+AC00–U+D7A3)
 * - Emoji (most U+1F000+)
 *
 * @param cp - Unicode code point to test.
 * @returns `true` if the code point renders as two columns wide.
 */
export function isWideChar(cp: number): boolean {
  // Fullwidth Forms
  if (cp >= 0xff01 && cp <= 0xff60) return true;
  if (cp >= 0xffe0 && cp <= 0xffe6) return true;

  // CJK Radicals, Kangxi Radicals
  if (cp >= 0x2e80 && cp <= 0x2fdf) return true;

  // CJK Symbols and Punctuation, Hiragana, Katakana
  if (cp >= 0x3000 && cp <= 0x33ff) return true;

  // CJK Extension A
  if (cp >= 0x3400 && cp <= 0x4dbf) return true;

  // CJK Unified Ideographs
  if (cp >= 0x4e00 && cp <= 0x9fff) return true;

  // Hangul Syllables (U+AC00–U+D7A3; excludes Jamo Extended-B which are narrow)
  if (cp >= 0xac00 && cp <= 0xd7a3) return true;

  // CJK Compatibility Ideographs
  if (cp >= 0xf900 && cp <= 0xfaff) return true;

  // CJK Compatibility Forms
  if (cp >= 0xfe30 && cp <= 0xfe4f) return true;

  // CJK Extension B–I and beyond
  if (cp >= 0x20000 && cp <= 0x3ffff) return true;

  // Emoji blocks (most render as 2 columns)
  // Miscellaneous Symbols and Pictographs
  if (cp >= 0x1f300 && cp <= 0x1f9ff) return true;
  // Supplemental Symbols and Pictographs
  if (cp >= 0x1fa00 && cp <= 0x1fa6f) return true;
  // Symbols and Pictographs Extended-A
  if (cp >= 0x1fa70 && cp <= 0x1faff) return true;
  // Emoticons
  if (cp >= 0x1f600 && cp <= 0x1f64f) return true;
  // Transport and Map Symbols
  if (cp >= 0x1f680 && cp <= 0x1f6ff) return true;
  // Dingbats (U+2702–U+27B0) are NOT uniformly wide per Unicode
  // East Asian Width. Most are Narrow text characters (✓ ✗ ✌).
  // They only become wide with emoji presentation (U+FE0F), which
  // is handled by graphemeClusterWidth checking for the variation
  // selector in the grapheme cluster.
  // Regional indicators (flags)
  if (cp >= 0x1f1e0 && cp <= 0x1f1ff) return true;
  // Playing Cards, Mahjong Tiles
  if (cp >= 0x1f000 && cp <= 0x1f02f) return true;

  return false;
}
