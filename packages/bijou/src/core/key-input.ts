import type { KeyInputMsg } from '../ports/io.js';

const ESC = String.fromCharCode(0x1b);
const ETX = String.fromCharCode(0x03);
const EOT = String.fromCharCode(0x04);
const DEL = String.fromCharCode(0x7f);
const BACKSPACE = String.fromCharCode(0x08);
const CARRIAGE_RETURN = String.fromCharCode(0x0d);
const LINE_FEED = String.fromCharCode(0x0a);
const ARROW_UP = `${ESC}[A`;
const ARROW_DOWN = `${ESC}[B`;
const ARROW_RIGHT = `${ESC}[C`;
const ARROW_LEFT = `${ESC}[D`;

function keyMsg(
  key: string,
  ctrl = false,
  alt = false,
  shift = false,
  text?: string,
): KeyInputMsg {
  return text === undefined
    ? { key, ctrl, alt, shift }
    : { key, ctrl, alt, shift, text };
}

/**
 * Decode one raw terminal key sequence into a structured semantic key.
 *
 * Returns `null` for unsupported multi-byte sequences so callers can safely
 * ignore unknown transport-layer noise when falling back from `rawInput()`.
 */
export function decodeRawKeyInput(raw: string): KeyInputMsg | null {
  switch (raw) {
    case ARROW_UP:
      return keyMsg('up');
    case ARROW_DOWN:
      return keyMsg('down');
    case ARROW_RIGHT:
      return keyMsg('right');
    case ARROW_LEFT:
      return keyMsg('left');
    case CARRIAGE_RETURN:
    case LINE_FEED:
      return keyMsg('enter');
    case ESC:
      return keyMsg('escape');
    case ETX:
      return keyMsg('c', true);
    case EOT:
      return keyMsg('d', true);
    case DEL:
    case BACKSPACE:
      return keyMsg('backspace');
    case ' ':
      return keyMsg('space', false, false, false, ' ');
    default:
      break;
  }

  if (raw.length !== 1) return null;
  const ch = raw;
  if (ch < ' ') return null;
  if (ch >= 'A' && ch <= 'Z') {
    return keyMsg(ch.toLowerCase(), false, false, true, ch);
  }
  return keyMsg(ch, false, false, false, ch);
}

/**
 * Decode a raw terminal input string into semantic key messages.
 *
 * This is useful for deterministic tests that want to express scripted input
 * in familiar raw strings (for example `\"my-app\\n\"` or an ESC-arrow sequence) while
 * still driving consumers through the higher-level semantic key stream.
 */
export function decodeRawKeySequence(raw: string): KeyInputMsg[] {
  const messages: KeyInputMsg[] = [];
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i]!;
    if (ch === ESC) {
      const sequence = raw.slice(i, i + 3);
      const parsedSequence = decodeRawKeyInput(sequence);
      if (parsedSequence !== null) {
        messages.push(parsedSequence);
        i += sequence.length - 1;
        continue;
      }
      const parsedEscape = decodeRawKeyInput(ch);
      if (parsedEscape !== null) {
        messages.push(parsedEscape);
      }
      continue;
    }

    const parsed = decodeRawKeyInput(ch);
    if (parsed !== null) {
      messages.push(parsed);
    }
  }
  return messages;
}
