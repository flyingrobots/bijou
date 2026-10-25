import { ANSI_SGR_RE, ANSI_OSC8_RE, segmentGraphemes, graphemeClusterWidth } from '../text/grapheme.js';

interface StyledInlineToken {
  readonly kind: 'control' | 'grapheme';
  readonly raw: string;
  readonly width?: number;
}

const INLINE_CONTROL_RE = new RegExp(`${ANSI_SGR_RE.source}|${ANSI_OSC8_RE.source}`, 'g');

export function tokenizeStyledInlineText(text: string): StyledInlineToken[] {
  const tokens: StyledInlineToken[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(INLINE_CONTROL_RE)) {
    const index = match.index;
    if (index > lastIndex) {
      const raw = text.slice(lastIndex, index);
      for (const grapheme of segmentGraphemes(raw)) {
        tokens.push({
          kind: 'grapheme',
          raw: grapheme,
          width: graphemeClusterWidth(grapheme),
        });
      }
    }

    tokens.push({ kind: 'control', raw: match[0] });
    lastIndex = index + match[0].length;
  }

  if (lastIndex < text.length) {
    const raw = text.slice(lastIndex);
    for (const grapheme of segmentGraphemes(raw)) {
      tokens.push({
        kind: 'grapheme',
        raw: grapheme,
        width: graphemeClusterWidth(grapheme),
      });
    }
  }

  return tokens;
}
