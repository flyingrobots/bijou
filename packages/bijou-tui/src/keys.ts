import type { KeyMsg, MouseMsg, MouseButton, MouseAction } from './types.js';

function keyMsg(key: string, ctrl = false, alt = false, shift = false): KeyMsg {
  return { type: 'key', key, ctrl, alt, shift };
}

/**
 * Parse a raw ANSI byte string from rawInput() into a structured KeyMsg.
 * Unrecognized sequences produce { key: 'unknown' }.
 */
export function parseKey(raw: string): KeyMsg {
  // Arrow keys and other CSI sequences
  if (raw === '\x1b[A') return keyMsg('up');
  if (raw === '\x1b[B') return keyMsg('down');
  if (raw === '\x1b[C') return keyMsg('right');
  if (raw === '\x1b[D') return keyMsg('left');
  if (raw === '\x1b[H') return keyMsg('home');
  if (raw === '\x1b[F') return keyMsg('end');
  if (raw === '\x1b[3~') return keyMsg('delete');
  if (raw === '\x1b[5~') return keyMsg('pageup');
  if (raw === '\x1b[6~') return keyMsg('pagedown');

  // Enter, tab, backspace, space, escape
  if (raw === '\r' || raw === '\n') return keyMsg('enter');
  if (raw === '\t') return keyMsg('tab');
  if (raw === '\x1b[Z') return keyMsg('tab', false, false, true); // shift-tab
  if (raw === '\x7f') return keyMsg('backspace');
  if (raw === ' ') return keyMsg('space');

  // Escape (alone)
  if (raw === '\x1b') return keyMsg('escape');

  // Ctrl+C
  if (raw === '\x03') return keyMsg('c', true);

  // Ctrl+A through Ctrl+Z (0x01-0x1a), excluding already-handled cases
  if (raw.length === 1) {
    const code = raw.charCodeAt(0);
    if (code >= 0x01 && code <= 0x1a) {
      const letter = String.fromCharCode(code + 0x60); // 0x01 → 'a', 0x02 → 'b', etc.
      return keyMsg(letter, true);
    }
  }

  // Printable single characters
  if (raw.length === 1) {
    const code = raw.charCodeAt(0);
    if (code >= 0x20 && code <= 0x7e) {
      return keyMsg(raw);
    }
  }

  return keyMsg('unknown');
}

// SGR mouse sequence: \x1b[<button;col;row(M|m)
const SGR_MOUSE_RE = /^\x1b\[<(\d+);(\d+);(\d+)([Mm])$/;

/**
 * Parse an SGR extended mouse sequence into a MouseMsg.
 * Returns null if the string is not a valid SGR mouse sequence.
 *
 * SGR format: ESC [ < button ; col ; row M/m
 * - M = press, m = release
 * - button byte bits: 0-1 = button, 2 = shift, 3 = alt, 4 = ctrl, 5 = motion, 6-7 = scroll
 * - col/row are 1-based in the protocol, converted to 0-based here
 */
export function parseMouse(raw: string): MouseMsg | null {
  const match = SGR_MOUSE_RE.exec(raw);
  if (!match) return null;

  const buttonByte = parseInt(match[1]!, 10);
  const rawCol = parseInt(match[2]!, 10);
  const rawRow = parseInt(match[3]!, 10);
  if (rawCol < 1 || rawRow < 1) return null;
  const col = rawCol - 1; // 1-based → 0-based
  const row = rawRow - 1;
  const suffix = match[4]!;

  const shift = (buttonByte & 4) !== 0;
  const alt = (buttonByte & 8) !== 0;
  const ctrl = (buttonByte & 16) !== 0;
  const isMotion = (buttonByte & 32) !== 0;
  const isScroll = (buttonByte & 64) !== 0;

  const lowBits = buttonByte & 3;
  const buttonFromBits = (bits: number): MouseButton =>
    bits === 0 ? 'left' : bits === 1 ? 'middle' : bits === 2 ? 'right' : 'none';

  let button: MouseButton;
  let action: MouseAction;

  if (isScroll) {
    button = 'none';
    action = lowBits === 0 ? 'scroll-up' : 'scroll-down';
  } else if (isMotion) {
    button = buttonFromBits(lowBits);
    action = 'move';
  } else {
    button = buttonFromBits(lowBits);
    action = suffix === 'M' ? 'press' : 'release';
  }

  return { type: 'mouse', button, action, col, row, shift, alt, ctrl };
}
