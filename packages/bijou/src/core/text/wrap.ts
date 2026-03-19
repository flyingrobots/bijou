import { RESET_SGR } from '../ansi.js';
import { ANSI_SGR_RE, graphemeClusterWidth, segmentGraphemes } from './grapheme.js';

type WrapToken =
  | { readonly kind: 'ansi'; readonly raw: string }
  | { readonly kind: 'grapheme'; readonly raw: string; readonly width: number };

function tokenizeAnsiText(str: string): WrapToken[] {
  const regex = new RegExp(ANSI_SGR_RE.source, 'g');
  const tokens: WrapToken[] = [];
  let lastIndex = 0;

  for (const match of str.matchAll(regex)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      const raw = str.slice(lastIndex, index);
      for (const grapheme of segmentGraphemes(raw)) {
        tokens.push({
          kind: 'grapheme',
          raw: grapheme,
          width: graphemeClusterWidth(grapheme),
        });
      }
    }

    tokens.push({ kind: 'ansi', raw: match[0] });
    lastIndex = index + match[0].length;
  }

  if (lastIndex < str.length) {
    const raw = str.slice(lastIndex);
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

function isResetEscape(raw: string): boolean {
  return raw === RESET_SGR;
}

function finalizeWrappedLine(raw: string, activeStyle: string): string {
  if (activeStyle.length === 0 || raw.endsWith(RESET_SGR)) return raw;
  return raw + RESET_SGR;
}

function wrapSingleLine(str: string, maxWidth: number): string[] {
  if (str.length === 0) return [''];
  if (maxWidth <= 0) return [''];

  const tokens = tokenizeAnsiText(str);
  const lines: string[] = [];
  let currentRaw = '';
  let currentWidth = 0;
  let activeStyle = '';

  const pushLine = (): void => {
    if (currentWidth <= 0) return;
    lines.push(finalizeWrappedLine(currentRaw, activeStyle));
    currentRaw = activeStyle;
    currentWidth = 0;
  };

  for (const token of tokens) {
    if (token.kind === 'ansi') {
      currentRaw += token.raw;
      activeStyle = isResetEscape(token.raw) ? '' : activeStyle + token.raw;
      continue;
    }

    if (currentWidth > 0 && currentWidth + token.width > maxWidth) {
      pushLine();
    }

    currentRaw += token.raw;
    currentWidth += token.width;
  }

  if (currentWidth > 0) {
    lines.push(finalizeWrappedLine(currentRaw, activeStyle));
  }

  return lines.length > 0 ? lines : [''];
}

/**
 * Wrap a string to the requested display width while preserving ANSI styling.
 *
 * Wrapping is grapheme-aware and hard-wraps long lines without adding ellipses.
 *
 * @param str - Input string, possibly containing ANSI SGR escapes.
 * @param maxWidth - Maximum display width in columns.
 * @returns Wrapped lines.
 */
export function wrapToWidth(str: string, maxWidth: number): string[] {
  const source = str ?? '';
  const rawLines = source.split('\n');
  return rawLines.flatMap((line) => wrapSingleLine(line, maxWidth));
}
