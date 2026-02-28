/**
 * Grapheme-aware text clipping for terminal display.
 *
 * Clips a string to a maximum visible width, preserving ANSI escapes.
 * Won't split multi-codepoint grapheme clusters (emoji, CJK, ZWJ sequences).
 */

import { segmentGraphemes, graphemeClusterWidth } from './grapheme.js';

/**
 * Pattern matching ANSI SGR escape sequences (e.g. `\x1b[31m`).
 *
 * Used to strip style escapes before measuring visible width.
 */
// eslint-disable-next-line no-control-regex
const ANSI_RE = /\x1b\[[0-9;]*m/g;

/**
 * Clip a string to a maximum visible width, preserving ANSI escapes.
 *
 * Grapheme-cluster aware: won't split multi-codepoint sequences.
 * Appends a reset sequence (`\x1b[0m`) if the string was clipped mid-style.
 *
 * O(n): pre-segments stripped text once, then walks the original string
 * with a grapheme pointer instead of re-segmenting per character.
 *
 * @param str - Input string, may contain ANSI escape sequences.
 * @param maxWidth - Maximum visible width in terminal columns.
 * @returns The clipped string, with ANSI escapes intact and a reset appended if needed.
 */
export function clipToWidth(str: string, maxWidth: number): string {
  if (maxWidth <= 0) return '';

  const stripped = str.replace(ANSI_RE, '');
  const graphemes = segmentGraphemes(stripped);

  let result = '';
  let visible = 0;
  let inEscape = false;
  let escBuf = '';
  let hasStyle = false;
  let gi = 0;
  let i = 0;

  while (i < str.length) {
    const ch = str[i]!;

    if (ch === '\x1b') {
      inEscape = true;
      escBuf = ch;
      i++;
      continue;
    }

    if (inEscape) {
      escBuf += ch;
      if (ch === 'm') {
        inEscape = false;
        result += escBuf;
        escBuf = '';
        hasStyle = true;
      }
      i++;
      continue;
    }

    // Visible character — consume next pre-segmented grapheme
    if (gi >= graphemes.length) break;

    const grapheme = graphemes[gi]!;
    const gWidth = graphemeClusterWidth(grapheme);

    if (visible + gWidth > maxWidth) {
      if (hasStyle) result += '\x1b[0m';
      break;
    }

    result += grapheme;
    visible += gWidth;
    gi++;
    i += grapheme.length;
  }

  return result;
}
