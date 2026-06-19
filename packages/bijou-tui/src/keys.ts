import type { KeyMsg, MouseMsg, MouseButton, MouseAction } from './types.js';

function keyMsg(key: string, ctrl = false, alt = false, shift = false): KeyMsg {
  return { type: 'key', key, ctrl, alt, shift };
}

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
    const code = csiTilde[1] ?? '';
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
    const fkey = SS3_FKEY_MAP[ss3[1] ?? ''];
    if (fkey) return keyMsg(fkey);
  }

  // F-keys: CSI 1;modifier P/Q/R/S encoding (modified F1–F4)
  const csiMod = CSI_MOD_FKEY_RE.exec(raw);
  if (csiMod) {
    const modifier = parseInt(csiMod[1] ?? '', 10);
    const fkey = SS3_FKEY_MAP[csiMod[2] ?? ''];
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

const ESCAPE = String.fromCharCode(0x1b);
const CSI_TILDE_RE = new RegExp(`^${ESCAPE}\\[(\\d+)(?:;(\\d+))?~$`, 'u');
const CSI_MOD_FKEY_RE = new RegExp(`^${ESCAPE}\\[1;(\\d+)([PQRS])$`, 'u');
const SS3_FKEY_RE = new RegExp(`^${ESCAPE}O([PQRS])$`, 'u');

const CSI_FKEY_MAP: Record<string, string> = {
  '11': 'f1', '12': 'f2', '13': 'f3', '14': 'f4',
  '15': 'f5', '17': 'f6', '18': 'f7', '19': 'f8',
  '20': 'f9', '21': 'f10', '23': 'f11', '24': 'f12',
};

const SS3_FKEY_MAP: Record<string, string> = {
  'P': 'f1', 'Q': 'f2', 'R': 'f3', 'S': 'f4',
};

function decodeModifier(modifier: number): [boolean, boolean, boolean] {
  if (Number.isNaN(modifier) || modifier <= 1) return [false, false, false];
  const bits = modifier - 1;
  return [(bits & 1) !== 0, (bits & 2) !== 0, (bits & 4) !== 0];
}

const SGR_MOUSE_RE = new RegExp(`^${ESCAPE}\\[<(\\d+);(\\d+);(\\d+)([Mm])$`, 'u');

export function parseMouse(raw: string): MouseMsg | null {
  const match = SGR_MOUSE_RE.exec(raw);
  if (!match) return null;

  const [, buttonRaw, colRaw, rowRaw, suffix] = match;
  if (buttonRaw === undefined || colRaw === undefined || rowRaw === undefined || suffix === undefined) return null;
  const buttonByte = parseInt(buttonRaw, 10);
  const rawCol = parseInt(colRaw, 10);
  const rawRow = parseInt(rowRaw, 10);
  if (rawCol < 1 || rawRow < 1) return null;
  const col = rawCol - 1; // 1-based → 0-based
  const row = rawRow - 1;
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
