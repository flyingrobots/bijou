/**
 * Keyboard and mouse input parsing for raw ANSI/SGR terminal sequences.
 *
 * Convert raw byte strings from stdin into structured {@link KeyMsg} and
 * {@link MouseMsg} objects for use in the TEA update loop.
 *
 * @module
 */

import type { KeyMsg, MouseMsg, MouseButton, MouseAction } from './types.js';

/**
 * Create a {@link KeyMsg} with the given key name and modifier flags.
 *
 * @param key - Key name (e.g. `"a"`, `"enter"`, `"up"`).
 * @param ctrl - Whether the Ctrl modifier is active.
 * @param alt - Whether the Alt modifier is active.
 * @param shift - Whether the Shift modifier is active.
 * @returns A new `KeyMsg`.
 */
function keyMsg(key: string, ctrl = false, alt = false, shift = false): KeyMsg {
  return { type: 'key', key, ctrl, alt, shift };
}

/**
 * Parse a raw ANSI byte string from `rawInput()` into a structured {@link KeyMsg}.
 *
 * Handle arrow keys, function keys, enter, tab, backspace, space, escape,
 * Ctrl+A through Ctrl+Z, and printable ASCII characters. Unrecognized
 * sequences produce `{ key: 'unknown' }`.
 *
 * @param raw - Raw byte string from terminal stdin.
 * @returns Parsed key message.
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

  // F-keys: CSI ~ encoding (F1–F12)
  const csiTilde = CSI_TILDE_RE.exec(raw);
  if (csiTilde) {
    const code = csiTilde[1]!;
    const modifier = csiTilde[2] ? parseInt(csiTilde[2], 10) : 0;
    const fkey = CSI_FKEY_MAP[code];
    if (fkey) {
      const [shift, alt, ctrl] = decodeModifier(modifier);
      return keyMsg(fkey, ctrl, alt, shift);
    }
  }

  // F-keys: SS3 encoding (F1–F4)
  const ss3 = SS3_FKEY_RE.exec(raw);
  if (ss3) {
    const fkey = SS3_FKEY_MAP[ss3[1]!];
    if (fkey) return keyMsg(fkey);
  }

  // F-keys: CSI 1;modifier P/Q/R/S encoding (modified F1–F4)
  const csiMod = CSI_MOD_FKEY_RE.exec(raw);
  if (csiMod) {
    const modifier = parseInt(csiMod[1]!, 10);
    const fkey = SS3_FKEY_MAP[csiMod[2]!];
    if (fkey) {
      const [shift, alt, ctrl] = decodeModifier(modifier);
      return keyMsg(fkey, ctrl, alt, shift);
    }
  }

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
      // Normalize uppercase letters so bindings like "shift+g" match typed "G".
      if (code >= 0x41 && code <= 0x5a) {
        return keyMsg(raw.toLowerCase(), false, false, true);
      }
      return keyMsg(raw);
    }
  }

  return keyMsg('unknown');
}

// ── F-key lookup tables ─────────────────────────────────────────────

/** CSI `code~` and `code;modifier~` pattern. Groups: code, optional modifier. */
const CSI_TILDE_RE = /^\x1b\[(\d+)(?:;(\d+))?~$/;

/** CSI `1;modifier[PQRS]` pattern for modified F1–F4. Groups: modifier, letter. */
const CSI_MOD_FKEY_RE = /^\x1b\[1;(\d+)([PQRS])$/;

/** SS3 `\x1bO[PQRS]` pattern for unmodified F1–F4. Group: letter. */
const SS3_FKEY_RE = /^\x1bO([PQRS])$/;

/** Map CSI tilde code → F-key name. */
const CSI_FKEY_MAP: Record<string, string> = {
  '11': 'f1', '12': 'f2', '13': 'f3', '14': 'f4',
  '15': 'f5', '17': 'f6', '18': 'f7', '19': 'f8',
  '20': 'f9', '21': 'f10', '23': 'f11', '24': 'f12',
};

/** Map SS3 / CSI letter → F-key name. */
const SS3_FKEY_MAP: Record<string, string> = {
  'P': 'f1', 'Q': 'f2', 'R': 'f3', 'S': 'f4',
};

/**
 * Decode xterm modifier parameter to `[shift, alt, ctrl]`.
 *
 * Modifier encoding: value = 1 + (shift ? 1 : 0) + (alt ? 2 : 0) + (ctrl ? 4 : 0).
 * A value of 0 means no modifier parameter was present.
 */
function decodeModifier(modifier: number): [boolean, boolean, boolean] {
  if (modifier <= 1) return [false, false, false];
  const bits = modifier - 1;
  return [(bits & 1) !== 0, (bits & 2) !== 0, (bits & 4) !== 0];
}

/** Regular expression matching SGR extended mouse sequences: `ESC [ < button ; col ; row M/m`. */
const SGR_MOUSE_RE = /^\x1b\[<(\d+);(\d+);(\d+)([Mm])$/;

/**
 * Parse an SGR extended mouse sequence into a {@link MouseMsg}.
 *
 * SGR format: `ESC [ < button ; col ; row M/m`
 * - `M` = press, `m` = release
 * - Button byte bits: 0-1 = button, 2 = shift, 3 = alt, 4 = ctrl, 5 = motion, 6-7 = scroll
 * - Column and row are 1-based in the protocol, converted to 0-based here
 *
 * @param raw - Raw byte string that may contain an SGR mouse sequence.
 * @returns Parsed mouse message, or `null` if the string is not a valid SGR mouse sequence.
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
