/** One SGR style: the sequence that turns it on and the one that turns it off. */
export interface SgrPair {
  readonly open: string;
  readonly close: string;
}

const ESC = '\x1b[';
const FOREGROUND_OFF = `${ESC}39m`;
const BACKGROUND_OFF = `${ESC}49m`;
const LINE_BREAK = /\r?\n/gu;
const HEX_COLOR = /^#?(?:([0-9a-f]{3})|([0-9a-f]{6}))$/iu;

/** Round a channel to a whole number from 0 through 255. Not-a-number is 0. */
function channel(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(255, Math.max(0, Math.round(value)));
}

/** A 24-bit foreground color. */
export function foreground(r: number, g: number, b: number): SgrPair {
  return { open: `${ESC}38;2;${String(channel(r))};${String(channel(g))};${String(channel(b))}m`, close: FOREGROUND_OFF };
}

/** A 24-bit background color. */
export function background(r: number, g: number, b: number): SgrPair {
  return { open: `${ESC}48;2;${String(channel(r))};${String(channel(g))};${String(channel(b))}m`, close: BACKGROUND_OFF };
}

/** A style from plain SGR parameters, such as `1` and `22` for bold. */
export function sgr(open: string, close: string): SgrPair {
  return { open: `${ESC}${open}m`, close: `${ESC}${close}m` };
}

/**
 * Parse `#rgb`, `#rrggbb`, `rgb`, or `rrggbb`.
 *
 * @returns The three channels, or `undefined` when the text is not a hex color.
 */
export function parseHex(color: string): readonly [number, number, number] | undefined {
  const match = HEX_COLOR.exec(color);
  if (match === null) return undefined;
  const digits = match[2] ?? (match[1] ?? '').replace(/./gu, '$&$&');
  const value = Number.parseInt(digits, 16);
  return [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff];
}

/**
 * Wrap text in one style.
 *
 * A nested style that closes inside the text would also end this one, so this
 * style is opened again after each nested close. The style is closed before
 * every line break and opened again after it, so a background never runs to
 * the edge of the surface.
 */
export function wrap(pair: SgrPair, text: string): string {
  if (text === '') return text;
  const reopened = text.replaceAll(pair.close, pair.close + pair.open);
  const perLine = reopened.replace(LINE_BREAK, (lineBreak) => pair.close + lineBreak + pair.open);
  return pair.open + perLine + pair.close;
}
