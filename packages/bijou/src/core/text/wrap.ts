import {
  activeAnsiPrefix,
  finalizeWrappedLine,
  isOsc8Close,
  isOsc8Escape,
  isResetEscape,
  isWhitespaceToken,
  prepareWrappedText,
  tokensRaw,
  tokensWidth,
  trimLeadingWhitespaceTokens,
  type PreparedWrappedLine,
  type PreparedWrappedText,
  type WrapToken,
} from './wrap-tokens.js';

function wrapPreparedLine(
  line: PreparedWrappedLine,
  maxWidth: number,
): string[] {
  if (line.tokens.length === 0) return [''];
  if (maxWidth <= 0) return [''];

  const lines: string[] = [];
  let currentTokens: WrapToken[] = [];
  let currentWidth = 0;
  let activeStyle = '';
  let activeOsc8 = '';
  let lastBreakIndex = -1;
  let activeStyleAtLastBreak = '';
  let activeOsc8AtLastBreak = '';

  for (const token of line.tokens) {
    if (token.kind === 'ansi') {
      currentTokens.push(token);
      if (isOsc8Escape(token.raw)) {
        activeOsc8 = isOsc8Close(token.raw) ? '' : token.raw;
        continue;
      }
      activeStyle = isResetEscape(token.raw) ? '' : activeStyle + token.raw;
      continue;
    }

    currentTokens.push(token);
    currentWidth += token.width;

    if (isWhitespaceToken(token)) {
      lastBreakIndex = currentTokens.length - 1;
      activeStyleAtLastBreak = activeStyle;
      activeOsc8AtLastBreak = activeOsc8;
    }

    if (currentWidth <= maxWidth) {
      continue;
    }

    if (lastBreakIndex >= 0) {
      const lineTokens = currentTokens.slice(0, lastBreakIndex);
      if (tokensWidth(lineTokens) > 0) {
        lines.push(
          finalizeWrappedLine(
            tokensRaw(lineTokens),
            activeStyleAtLastBreak,
            activeOsc8AtLastBreak,
          ),
        );
      }

      const remainder = trimLeadingWhitespaceTokens(
        currentTokens.slice(lastBreakIndex + 1),
      );
      const prefix = activeAnsiPrefix(
        activeStyleAtLastBreak,
        activeOsc8AtLastBreak,
      );
      currentTokens =
        prefix.length === 0 ? remainder : [...prefix, ...remainder];
      currentWidth = tokensWidth(currentTokens);
      activeStyle = activeStyleAtLastBreak;
      activeOsc8 = activeOsc8AtLastBreak;
      lastBreakIndex = -1;
      activeStyleAtLastBreak = activeStyle;
      activeOsc8AtLastBreak = activeOsc8;
      continue;
    }

    const lineTokens = currentTokens.slice(0, -1);
    if (tokensWidth(lineTokens) > 0) {
      lines.push(
        finalizeWrappedLine(tokensRaw(lineTokens), activeStyle, activeOsc8),
      );
    }
    const prefix = activeAnsiPrefix(activeStyle, activeOsc8);
    currentTokens = prefix.length === 0 ? [token] : [...prefix, token];
    currentWidth = token.width;
  }

  if (currentWidth > 0) {
    lines.push(
      finalizeWrappedLine(tokensRaw(currentTokens), activeStyle, activeOsc8),
    );
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

export { prepareWrappedText } from './wrap-tokens.js';
export type {
  PreparedWrappedLine,
  PreparedWrappedText,
} from './wrap-tokens.js';
