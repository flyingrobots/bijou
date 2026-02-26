import type { KeyMsg } from './types.js';

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
  if (raw === '\x1b') return keyMsg('esc');

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
