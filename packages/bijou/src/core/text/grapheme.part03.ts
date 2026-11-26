import { isHalfwidthChar, isWideChar } from './grapheme.part01.js';
export function stashTerminalSequences(
  text: string,
  pattern: RegExp,
  placeholders: string[],
): string {
  return text.replace(pattern, (match) => {
    const index = placeholders.push(match) - 1;
    return `\uE000${String(index)}\uE001`;
  });
}
export function restoreTerminalSequences(
  text: string,
  placeholders: readonly string[],
): string {
  return text.replace(/\uE000(\d+)\uE001/g, (_match, rawIndex: string) => {
    const index = Number.parseInt(rawIndex, 10);
    return placeholders[index] ?? '';
  });
}
export function stripUnsafeControlChars(text: string): string {
  let result = '';
  for (const ch of text) {
    const cp = ch.codePointAt(0);
    if (cp === undefined) continue;
    if ((cp >= 0 && cp <= 8) || (cp >= 11 && cp <= 31) || cp === 127) continue;
    result += ch;
  }
  return result;
}
// ---------------------------------------------------------------------------
// Display width
// ---------------------------------------------------------------------------

const GRAPHEME_EXTEND_RE = /^\p{Grapheme_Extend}$/u;

/**
 * Compute the terminal display width of a single grapheme cluster.
 *
 * A cluster occupies the cells of its base plus one cell for every extender
 * that is itself a spacing character:
 * - The base is as wide as the widest code point of the cluster: 2 for East
 *   Asian Wide / Fullwidth characters (including the leading jamo of a
 *   conjoining Hangul syllable) and emoji, or for emoji presentation (U+FE0F);
 *   1 otherwise.
 * - An extender (UAX #29 Grapheme_Extend) that UAX #11 classes Halfwidth adds
 *   one cell: the halfwidth sound marks U+FF9E and U+FF9F, so `ｶﾞ` is 2.
 * - Every other extender adds nothing: combining marks, ZWJ and the
 *   pictographs it joins, variation selectors, skin-tone modifiers, tag
 *   characters, the second flag letter, and conjoining vowel and final jamo.
 *
 * @param grapheme - A single grapheme cluster string.
 * @returns Display width in terminal cells (at least 1).
 */
export function graphemeClusterWidth(grapheme: string): number {
  return measureGraphemeCluster(grapheme, isWideChar);
}

/**
 * The cluster rule of {@link graphemeClusterWidth} over a given wide-code-point
 * predicate. Internal: lets the width report compare two tables under one rule.
 * The halfwidth extender cell always comes from the generated table.
 */
export function measureGraphemeCluster(
  grapheme: string,
  isWide: (cp: number) => boolean,
): number {
  let baseWidth = 1;
  let hasEmojiPresentation = false;
  let spacingExtenders = 0;
  let isFirst = true;
  for (const ch of grapheme) {
    const cp = ch.codePointAt(0);
    if (cp === undefined) continue;
    if (!isFirst && isHalfwidthChar(cp) && GRAPHEME_EXTEND_RE.test(ch)) {
      spacingExtenders++;
    }
    isFirst = false;
    // Detect emoji presentation selector (U+FE0F) — forces base char to 2-wide
    if (cp === 0xfe0f) {
      hasEmojiPresentation = true;
      continue;
    }
    // Skip zero-width joiners and other variation selectors
    if (
      cp === 0x200d ||
      (cp >= 0xfe00 && cp <= 0xfe0e) ||
      (cp >= 0xe0100 && cp <= 0xe01ef)
    ) {
      continue;
    }
    if (isWide(cp)) baseWidth = 2;
  }
  // Emoji presentation (U+FE0F) makes any base character 2-wide.
  // This handles Dingbats (✂️ ✈️) and other text chars presented as emoji.
  if (hasEmojiPresentation) baseWidth = 2;
  return baseWidth + spacingExtenders;
}
