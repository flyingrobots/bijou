import { graphemeWidth } from '../text/grapheme.js';

export function resolveFillChar(fillChar: string | undefined): string {
  if (fillChar == null || fillChar.length === 0) return ' ';
  return graphemeWidth(fillChar) === 1 ? fillChar : ' ';
}
