import { graphemeClusterWidth, segmentGraphemes } from '@flyingrobots/bijou';

import { stripAnsi } from './viewport.part01.js';
export function sliceAnsi(str: string, startCol: number, endCol: number): string {
  const stripped = stripAnsi(str);
  const graphemes = segmentGraphemes(stripped);

  let visible = 0;
  let inEscape = false;
  let escBuf = '';
  let activeAnsi = '';
  let result = '';
  let collecting = false;
  let hasStyle = false;
  let didBreakAtEnd = false;
  let gi = 0;
  let i = 0;

  while (i < str.length) {
    const ch = str.charAt(i);

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
        if (collecting) {
          result += escBuf;
          hasStyle = true;
        } else {
          activeAnsi += escBuf;
        }
        escBuf = '';
      }
      i++;
      continue;
    }

    if (gi >= graphemes.length) break;

    const grapheme = graphemes[gi];
    if (grapheme === undefined) break;
    const gWidth = graphemeClusterWidth(grapheme);

    if (visible >= endCol) {
      if (hasStyle) result += '\x1b[0m';
      didBreakAtEnd = true;
      break;
    }

    if (visible + gWidth > startCol) {
      if (!collecting) {
        collecting = true;
        result = activeAnsi;
        if (activeAnsi.length > 0) hasStyle = true;
      }
      result += grapheme;
    }

    visible += gWidth;
    gi++;
    i += grapheme.length;
  }

  if (collecting && hasStyle && !didBreakAtEnd) result += '\x1b[0m';

  return result;
}
