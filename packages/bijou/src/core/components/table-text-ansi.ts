import { RESET_SGR } from '../ansi.js';
import {
  ANSI_OSC8_RE,
  ANSI_SGR_RE,
  segmentGraphemes,
} from '../text/grapheme.js';
import { tableGraphemeWidth } from './table-measure.js';
import type { TableWrapToken } from './table-model.js';

const OSC8_CLOSE = '\x1b]8;;\x1b\\';
const OSC8_CLOSE_BEL = '\x1b]8;;\x07';

function isOsc8Escape(raw: string): boolean {
  return raw.startsWith('\x1b]8;;');
}

function isOsc8Close(raw: string): boolean {
  return raw === OSC8_CLOSE || raw === OSC8_CLOSE_BEL;
}

function tokenizeTableText(str: string): TableWrapToken[] {
  const regex = new RegExp(`${ANSI_SGR_RE.source}|${ANSI_OSC8_RE.source}`, 'g');
  const tokens: TableWrapToken[] = [];
  let lastIndex = 0;

  for (const match of str.matchAll(regex)) {
    const index = match.index;
    if (index > lastIndex) {
      for (const grapheme of segmentGraphemes(str.slice(lastIndex, index))) {
        tokens.push({
          kind: 'grapheme',
          raw: grapheme,
          width: tableGraphemeWidth(grapheme),
        });
      }
    }
    tokens.push({ kind: 'ansi', raw: match[0] });
    lastIndex = index + match[0].length;
  }

  if (lastIndex < str.length) {
    for (const grapheme of segmentGraphemes(str.slice(lastIndex))) {
      tokens.push({
        kind: 'grapheme',
        raw: grapheme,
        width: tableGraphemeWidth(grapheme),
      });
    }
  }
  return tokens;
}

function finalizeTableWrappedLine(
  raw: string,
  activeOsc8: string,
  activeStyle: string,
): string {
  let result = raw;
  if (
    activeOsc8.length > 0
    && !result.endsWith(OSC8_CLOSE)
    && !result.endsWith(OSC8_CLOSE_BEL)
  ) {
    result += OSC8_CLOSE;
  }
  if (activeStyle.length > 0 && !result.endsWith(RESET_SGR)) {
    result += RESET_SGR;
  }
  return result;
}

export function clipCellToWidth(str: string, maxWidth: number): string {
  if (maxWidth <= 0) return '';
  let visible = 0;
  let result = '';
  let hasStyle = false;
  let activeOsc8 = '';

  for (const token of tokenizeTableText(str)) {
    if (token.kind === 'ansi') {
      result += token.raw;
      if (isOsc8Escape(token.raw)) {
        activeOsc8 = isOsc8Close(token.raw) ? '' : token.raw;
      } else {
        hasStyle = token.raw !== RESET_SGR;
      }
      continue;
    }
    if (visible + token.width > maxWidth) {
      if (activeOsc8.length > 0) result += OSC8_CLOSE;
      if (hasStyle && !result.endsWith(RESET_SGR)) result += RESET_SGR;
      break;
    }
    result += token.raw;
    visible += token.width;
  }

  return activeOsc8.length > 0 || hasStyle
    ? finalizeTableWrappedLine(result, activeOsc8, hasStyle ? RESET_SGR : '')
    : result;
}

export function wrapCellToWidth(str: string, maxWidth: number): string[] {
  if (maxWidth <= 0) return [''];
  const tokens = tokenizeTableText(str);
  if (tokens.length === 0) return [''];
  const lines: string[] = [];
  let current = '';
  let currentWidth = 0;
  let activeStyle = '';
  let activeOsc8 = '';

  for (const token of tokens) {
    if (token.kind === 'ansi') {
      current += token.raw;
      if (isOsc8Escape(token.raw)) {
        activeOsc8 = isOsc8Close(token.raw) ? '' : token.raw;
      } else {
        activeStyle = token.raw === RESET_SGR ? '' : activeStyle + token.raw;
      }
      continue;
    }
    if (currentWidth + token.width > maxWidth && currentWidth > 0) {
      lines.push(finalizeTableWrappedLine(current, activeOsc8, activeStyle));
      current = activeOsc8 + activeStyle + token.raw;
      currentWidth = token.width;
      continue;
    }
    current += token.raw;
    currentWidth += token.width;
  }
  if (current.length > 0) {
    lines.push(finalizeTableWrappedLine(current, activeOsc8, activeStyle));
  }
  return lines.length > 0 ? lines : [''];
}
