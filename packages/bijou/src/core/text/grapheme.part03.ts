import { isWideChar } from './grapheme.part01.js';
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
  let hasEmojiPresentation = false;
  for (const ch of grapheme) {
    const cp = ch.codePointAt(0);
    if (cp === undefined) continue;
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
    if (isWideChar(cp)) {
      maxWidth = 2;
      break; // Can't be wider than 2
    }
  }
  // Emoji presentation (U+FE0F) makes any base character 2-wide.
  // This handles Dingbats (✂️ ✈️) and other text chars presented as emoji.
  if (hasEmojiPresentation && maxWidth < 2) maxWidth = 2;
  return maxWidth;
}
