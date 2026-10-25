import { RESET_SGR } from '../ansi.js';
import { tokenizeStyledInlineText } from './markdown-inline-tokens.js';

interface StyledInlineState {
  readonly sgr: readonly string[];
  readonly osc8?: string;
}

const ESC = String.fromCharCode(27);
const OSC8_CLOSE = `${ESC}]8;;${ESC}\\`;
const RESET_SGR_SHORT = `${ESC}[m`;

export function sliceStyledVisibleRange(text: string, start: number, end: number): string {
  if (end <= start) return '';

  const state: { sgr: string[]; osc8?: string } = { sgr: [] };
  const tokens = tokenizeStyledInlineText(text);
  let visible = 0;
  let collecting = false;
  let result = '';

  for (const token of tokens) {
    if (token.kind === 'control') {
      if (collecting) {
        result += token.raw;
      }
      applyStyledInlineControl(state, token.raw);
      continue;
    }

    if (visible >= end) break;

    const tokenStart = visible;
    const tokenEnd = visible + (token.width ?? 0);
    if (tokenEnd > start && tokenStart < end) {
      if (!collecting) {
        collecting = true;
        result = buildStyledInlinePrefix(state);
      }
      result += token.raw;
    }
    visible = tokenEnd;
  }

  if (!collecting) return '';
  return result + buildStyledInlineSuffix(state);
}

function applyStyledInlineControl(
  state: { sgr: string[]; osc8?: string },
  raw: string,
): void {
  if (raw.startsWith(`${ESC}]8;;`)) {
    state.osc8 = raw === OSC8_CLOSE ? undefined : raw;
    return;
  }

  if (raw === RESET_SGR || raw === RESET_SGR_SHORT) {
    state.sgr = [];
    return;
  }

  state.sgr.push(raw);
}
function buildStyledInlinePrefix(state: StyledInlineState): string {
  return `${state.osc8 ?? ''}${state.sgr.join('')}`;
}
function buildStyledInlineSuffix(state: StyledInlineState): string {
  let suffix = '';
  if (state.osc8 != null) suffix += OSC8_CLOSE;
  if (state.sgr.length > 0) suffix += RESET_SGR;
  return suffix;
}
