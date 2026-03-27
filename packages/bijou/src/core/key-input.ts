import type { KeyInputMsg } from '../ports/io.js';

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
    case '\x1b[A':
      return keyMsg('up');
    case '\x1b[B':
      return keyMsg('down');
    case '\x1b[C':
      return keyMsg('right');
    case '\x1b[D':
      return keyMsg('left');
    case '\r':
    case '\n':
      return keyMsg('enter');
    case '\x1b':
      return keyMsg('escape');
    case '\x03':
      return keyMsg('c', true);
    case '\x04':
      return keyMsg('d', true);
    case '\x7f':
    case '\b':
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
 * in familiar raw strings (for example `\"my-app\\n\"` or `\"\\x1b[B\"`) while
 * still driving consumers through the higher-level semantic key stream.
 */
export function decodeRawKeySequence(raw: string): KeyInputMsg[] {
  const messages: KeyInputMsg[] = [];
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i]!;
    if (ch === '\x1b') {
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
