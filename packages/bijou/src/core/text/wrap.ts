import { RESET_SGR } from '../ansi.js';
import { ANSI_SGR_RE, graphemeClusterWidth, segmentGraphemes } from './grapheme.js';

type WrapToken =
  | { readonly kind: 'ansi'; readonly raw: string }
  | { readonly kind: 'grapheme'; readonly raw: string; readonly width: number };

export interface PreparedWrappedLine {
  readonly tokens: readonly WrapToken[];
}

export interface PreparedWrappedText {
  readonly source: string;
  readonly lines: readonly PreparedWrappedLine[];
}

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

export function prepareWrappedText(str: string): PreparedWrappedText {
  const source = str ?? '';
  return {
    source,
    lines: source.split('\n').map((line) => ({
      tokens: tokenizeAnsiText(line),
    })),
  };
}

function isResetEscape(raw: string): boolean {
  return raw === RESET_SGR;
}

function finalizeWrappedLine(raw: string, activeStyle: string): string {
  if (activeStyle.length === 0 || raw.endsWith(RESET_SGR)) return raw;
  return raw + RESET_SGR;
}

function isWhitespaceToken(token: WrapToken): boolean {
  return token.kind === 'grapheme' && /^\s+$/.test(token.raw);
}

function tokensWidth(tokens: readonly WrapToken[]): number {
  let width = 0;
  for (const token of tokens) {
    if (token.kind === 'grapheme') width += token.width;
  }
  return width;
}

function tokensRaw(tokens: readonly WrapToken[]): string {
  return tokens.map((token) => token.raw).join('');
}

function trimLeadingWhitespaceTokens(tokens: readonly WrapToken[]): WrapToken[] {
  const trimmed: WrapToken[] = [];
  let dropping = true;
  for (const token of tokens) {
    if (dropping && isWhitespaceToken(token)) continue;
    if (token.kind === 'grapheme') dropping = false;
    trimmed.push(token);
  }
  return trimmed;
}

function wrapPreparedLine(line: PreparedWrappedLine, maxWidth: number): string[] {
  if (line.tokens.length === 0) return [''];
  if (maxWidth <= 0) return [''];

  const lines: string[] = [];
  let currentTokens: WrapToken[] = [];
  let currentWidth = 0;
  let activeStyle = '';
  let lastBreakIndex = -1;
  let activeStyleAtLastBreak = '';

  for (const token of line.tokens) {
    if (token.kind === 'ansi') {
      currentTokens.push(token);
      activeStyle = isResetEscape(token.raw) ? '' : activeStyle + token.raw;
      continue;
    }

    currentTokens.push(token);
    currentWidth += token.width;

    if (isWhitespaceToken(token)) {
      lastBreakIndex = currentTokens.length - 1;
      activeStyleAtLastBreak = activeStyle;
    }

    if (currentWidth <= maxWidth) {
      continue;
    }

    if (lastBreakIndex >= 0) {
      const lineTokens = currentTokens.slice(0, lastBreakIndex);
      if (tokensWidth(lineTokens) > 0) {
        lines.push(finalizeWrappedLine(tokensRaw(lineTokens), activeStyleAtLastBreak));
      }

      const remainder = trimLeadingWhitespaceTokens(currentTokens.slice(lastBreakIndex + 1));
      currentTokens = activeStyleAtLastBreak.length === 0
        ? remainder
        : [
            ...tokenizeAnsiText(activeStyleAtLastBreak).filter((part): part is Extract<WrapToken, { kind: 'ansi' }> => part.kind === 'ansi'),
            ...remainder,
          ];
      currentWidth = tokensWidth(currentTokens);
      activeStyle = activeStyleAtLastBreak;
      lastBreakIndex = -1;
      activeStyleAtLastBreak = activeStyle;
      continue;
    }

    const lineTokens = currentTokens.slice(0, -1);
    if (tokensWidth(lineTokens) > 0) {
      lines.push(finalizeWrappedLine(tokensRaw(lineTokens), activeStyle));
    }
    currentTokens = activeStyle.length === 0
      ? [token]
      : [
          ...tokenizeAnsiText(activeStyle).filter((part): part is Extract<WrapToken, { kind: 'ansi' }> => part.kind === 'ansi'),
          token,
        ];
    currentWidth = token.width;
  }

  if (currentWidth > 0) {
    lines.push(finalizeWrappedLine(tokensRaw(currentTokens), activeStyle));
  }

  return lines.length > 0 ? lines : [''];
}

export function wrapPreparedTextToWidth(
  prepared: PreparedWrappedText,
  maxWidth: number,
): string[] {
  return prepared.lines.flatMap((line) => wrapPreparedLine(line, maxWidth));
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
  return wrapPreparedTextToWidth(prepareWrappedText(str), maxWidth);
}
