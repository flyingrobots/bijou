import { RESET_SGR } from '../ansi.js';
import {
  ANSI_OSC8_RE,
  ANSI_SGR_RE,
  graphemeClusterWidth,
  segmentGraphemes,
} from './grapheme.js';

export type WrapToken =
  | { readonly kind: 'ansi'; readonly raw: string }
  | {
      readonly kind: 'grapheme';
      readonly raw: string;
      readonly width: number;
    };

export interface PreparedWrappedLine {
  readonly tokens: readonly WrapToken[];
}

export interface PreparedWrappedText {
  readonly source: string;
  readonly lines: readonly PreparedWrappedLine[];
}

export function tokenizeAnsiText(text: string): WrapToken[] {
  const regex = new RegExp(`${ANSI_SGR_RE.source}|${ANSI_OSC8_RE.source}`, 'g');
  const tokens: WrapToken[] = [];
  let lastIndex = 0;
  for (const match of text.matchAll(regex)) {
    const index = match.index;
    if (index > lastIndex) {
      appendGraphemeTokens(tokens, text.slice(lastIndex, index));
    }
    tokens.push({ kind: 'ansi', raw: match[0] });
    lastIndex = index + match[0].length;
  }
  if (lastIndex < text.length) {
    appendGraphemeTokens(tokens, text.slice(lastIndex));
  }
  return tokens;
}

function appendGraphemeTokens(tokens: WrapToken[], text: string): void {
  for (const grapheme of segmentGraphemes(text)) {
    tokens.push({
      kind: 'grapheme',
      raw: grapheme,
      width: graphemeClusterWidth(grapheme),
    });
  }
}

export function prepareWrappedText(
  text: string | null | undefined,
): PreparedWrappedText {
  const source = text ?? '';
  return {
    source,
    lines: source.split('\n').map((line) => ({
      tokens: tokenizeAnsiText(line),
    })),
  };
}

const ESC = String.fromCharCode(27);
const BEL = String.fromCharCode(7);
const OSC8_PREFIX = `${ESC}]8;;`;
export const OSC8_CLOSE = `${OSC8_PREFIX}${ESC}\\`;
export const OSC8_CLOSE_BEL = `${OSC8_PREFIX}${BEL}`;

export function isResetEscape(raw: string): boolean {
  return raw === RESET_SGR;
}

export function isOsc8Escape(raw: string): boolean {
  return raw.startsWith(OSC8_PREFIX);
}

export function isOsc8Close(raw: string): boolean {
  return raw === OSC8_CLOSE || raw === OSC8_CLOSE_BEL;
}

export function finalizeWrappedLine(
  raw: string,
  activeStyle: string,
  activeOsc8: string,
): string {
  let result = raw;
  if (
    activeOsc8.length > 0 &&
    !result.endsWith(OSC8_CLOSE) &&
    !result.endsWith(OSC8_CLOSE_BEL)
  ) {
    result += OSC8_CLOSE;
  }
  if (activeStyle.length > 0 && !result.endsWith(RESET_SGR)) {
    result += RESET_SGR;
  }
  return result;
}

export function activeAnsiPrefix(
  activeStyle: string,
  activeOsc8: string,
): WrapToken[] {
  return [
    ...tokenizeAnsiText(activeOsc8),
    ...tokenizeAnsiText(activeStyle),
  ].filter(
    (part): part is Extract<WrapToken, { kind: 'ansi' }> =>
      part.kind === 'ansi',
  );
}

export function isWhitespaceToken(token: WrapToken): boolean {
  return token.kind === 'grapheme' && /^\s+$/.test(token.raw);
}

export function tokensWidth(tokens: readonly WrapToken[]): number {
  let width = 0;
  for (const token of tokens) {
    if (token.kind === 'grapheme') width += token.width;
  }
  return width;
}

export function tokensRaw(tokens: readonly WrapToken[]): string {
  return tokens.map((token) => token.raw).join('');
}

export function trimLeadingWhitespaceTokens(
  tokens: readonly WrapToken[],
): WrapToken[] {
  const trimmed: WrapToken[] = [];
  let dropping = true;
  for (const token of tokens) {
    if (dropping && isWhitespaceToken(token)) continue;
    if (token.kind === 'grapheme') dropping = false;
    trimmed.push(token);
  }
  return trimmed;
}
