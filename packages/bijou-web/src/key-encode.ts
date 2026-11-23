import type { KeyInputMsg } from '@flyingrobots/bijou';

const CSI: Readonly<Record<string, string>> = {
  up: '\x1b[A', down: '\x1b[B', right: '\x1b[C', left: '\x1b[D',
  home: '\x1b[H', end: '\x1b[F', insert: '\x1b[2~', delete: '\x1b[3~',
  pageup: '\x1b[5~', pagedown: '\x1b[6~',
};

const FUNCTION_CODES: Readonly<Record<string, string>> = {
  f1: '11', f2: '12', f3: '13', f4: '14', f5: '15', f6: '17',
  f7: '18', f8: '19', f9: '20', f10: '21', f11: '23', f12: '24',
};

const PLAIN: Readonly<Record<string, string>> = {
  enter: '\r', tab: '\t', backspace: '\x7f', escape: '\x1b', space: ' ',
};

function encodeFunction(code: string, msg: KeyInputMsg): string {
  const modifier = 1 + (msg.shift ? 1 : 0) + (msg.alt ? 2 : 0) + (msg.ctrl ? 4 : 0);
  return modifier === 1 ? `\x1b[${code}~` : `\x1b[${code};${String(modifier)}~`;
}

/**
 * Encode a structured key as the byte string a terminal would send, for
 * consumers that read `rawInput()`. Text is passed as typed. Modifiers are
 * kept for function keys, Shift+Tab, Ctrl+letter, and Alt+character; other
 * modified navigation keys lose their modifiers. `keyInput()` is lossless.
 */
export function encodeKey(msg: KeyInputMsg): string {
  if (msg.text !== undefined) return msg.text;
  const code = FUNCTION_CODES[msg.key];
  if (code !== undefined) return encodeFunction(code, msg);
  if (msg.key === 'tab' && msg.shift) return '\x1b[Z';
  const sequence = CSI[msg.key] ?? PLAIN[msg.key];
  if (sequence !== undefined) return sequence;
  if (!/^[a-z]$/u.test(msg.key) || !msg.ctrl) return msg.alt ? `\x1b${msg.key}` : msg.key;
  return String.fromCharCode(msg.key.charCodeAt(0) - 0x60);
}
