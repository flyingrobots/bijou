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
let _segmenter: Intl.Segmenter | undefined;

/**
 * Return the lazily-initialized grapheme segmenter singleton.
 *
 * @returns The shared `Intl.Segmenter` configured for English grapheme granularity.
 */
function segmenter(): Intl.Segmenter {
  if (!_segmenter) {
    _segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
  }
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
  if (cp >= 0xFF01 && cp <= 0xFF60) return true;
  if (cp >= 0xFFE0 && cp <= 0xFFE6) return true;

  // CJK Radicals, Kangxi Radicals
  if (cp >= 0x2E80 && cp <= 0x2FDF) return true;

  // CJK Symbols and Punctuation, Hiragana, Katakana
  if (cp >= 0x3000 && cp <= 0x33FF) return true;

  // CJK Extension A
  if (cp >= 0x3400 && cp <= 0x4DBF) return true;

  // CJK Unified Ideographs
  if (cp >= 0x4E00 && cp <= 0x9FFF) return true;

  // Hangul Syllables (U+AC00–U+D7A3; excludes Jamo Extended-B which are narrow)
  if (cp >= 0xAC00 && cp <= 0xD7A3) return true;

  // CJK Compatibility Ideographs
  if (cp >= 0xF900 && cp <= 0xFAFF) return true;

  // CJK Compatibility Forms
  if (cp >= 0xFE30 && cp <= 0xFE4F) return true;

  // CJK Extension B–I and beyond
  if (cp >= 0x20000 && cp <= 0x3FFFF) return true;

  // Emoji blocks (most render as 2 columns)
  // Miscellaneous Symbols and Pictographs
  if (cp >= 0x1F300 && cp <= 0x1F9FF) return true;
  // Supplemental Symbols and Pictographs
  if (cp >= 0x1FA00 && cp <= 0x1FA6F) return true;
  // Symbols and Pictographs Extended-A
  if (cp >= 0x1FA70 && cp <= 0x1FAFF) return true;
  // Emoticons
  if (cp >= 0x1F600 && cp <= 0x1F64F) return true;
  // Transport and Map Symbols
  if (cp >= 0x1F680 && cp <= 0x1F6FF) return true;
  // Dingbats (common emoji like ✂️ ✈️)
  if (cp >= 0x2702 && cp <= 0x27B0) return true;
  // Regional indicators (flags)
  if (cp >= 0x1F1E0 && cp <= 0x1F1FF) return true;
  // Playing Cards, Mahjong Tiles
  if (cp >= 0x1F000 && cp <= 0x1F02F) return true;

  return false;
}

// ---------------------------------------------------------------------------
// Grapheme segmentation
// ---------------------------------------------------------------------------

/**
 * Split a string into an array of grapheme clusters.
 *
 * Each element is a single user-perceived character (handles combining
 * marks, ZWJ sequences, flag pairs, skin tones, etc.).
 *
 * @param str - Input string to segment.
 * @returns Array of grapheme cluster strings.
 */
export function segmentGraphemes(str: string): string[] {
  const segments = segmenter().segment(str);
  const result: string[] = [];
  for (const { segment } of segments) {
    result.push(segment);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Display width
// ---------------------------------------------------------------------------

/**
 * Compute the terminal display width of a single grapheme cluster.
 *
 * The width is determined by the widest code point in the cluster:
 * - East Asian Wide / Fullwidth characters → 2
 * - Emoji (U+1F300+) → 2
 * - Everything else (ASCII, Latin, combining marks, etc.) → 1
 *
 * Zero-width characters (combining marks, ZWJ, variation selectors)
 * don't add width on their own — they're part of the cluster.
 *
 * @param grapheme - A single grapheme cluster string.
 * @returns Display width: 1 for narrow characters, 2 for wide/emoji.
 */
export function graphemeClusterWidth(grapheme: string): number {
  let maxWidth = 1;
  for (const ch of grapheme) {
    const cp = ch.codePointAt(0)!;
    // Skip zero-width joiners and variation selectors
    if (cp === 0x200D || (cp >= 0xFE00 && cp <= 0xFE0F) || (cp >= 0xE0100 && cp <= 0xE01EF)) {
      continue;
    }
    if (isWideChar(cp)) {
      maxWidth = 2;
      break;  // Can't be wider than 2
    }
  }
  return maxWidth;
}

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
  const clean = str.replace(/\x1b\[[0-9;]*m/g, '');
  if (clean.length === 0) return 0;

  let width = 0;
  for (const { segment } of segmenter().segment(clean)) {
    width += graphemeClusterWidth(segment);
  }
  return width;
}
