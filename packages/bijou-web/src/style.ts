import type { RuntimePort, StylePort, TextModifier, TokenValue } from '@flyingrobots/bijou';
import { background, foreground, parseHex, sgr, wrap, type SgrPair } from './ansi.js';

/** Options for {@link createWebStyle}. */
export interface WebStyleOptions {
  /** Force color off (`true`) or on (`false`). When set, the runtime is not consulted. */
  readonly noColor?: boolean;
  /** Runtime whose `NO_COLOR` variable is read on every call. */
  readonly runtime?: Pick<RuntimePort, 'env'>;
}

const BOLD = sgr('1', '22');

const MODIFIERS: Readonly<Record<TextModifier, SgrPair>> = {
  'bold': BOLD,
  'dim': sgr('2', '22'),
  'strikethrough': sgr('9', '29'),
  'inverse': sgr('7', '27'),
  'underline': sgr('4', '24'),
  'curly-underline': sgr('4:3', '24'),
  'dotted-underline': sgr('4:4', '24'),
  'dashed-underline': sgr('4:5', '24'),
};

function hexPair(color: string | undefined, make: (r: number, g: number, b: number) => SgrPair): SgrPair | undefined {
  if (color === undefined || color === '') return undefined;
  const channels = parseHex(color);
  return channels === undefined ? undefined : make(...channels);
}

/** Apply a token: modifiers innermost, then the foreground, then the background. */
function styleToken(token: TokenValue, text: string): string {
  let result = text;
  for (const modifier of [...(token.modifiers ?? [])].reverse()) result = wrap(MODIFIERS[modifier], result);
  const fg = hexPair(token.hex, foreground);
  if (fg !== undefined) result = wrap(fg, result);
  const bg = hexPair(token.bg, background);
  return bg === undefined ? result : wrap(bg, result);
}

/**
 * Create a {@link StylePort} that writes 24-bit ANSI SGR sequences.
 *
 * It has no dependencies and reads no host API. An invalid hex color leaves
 * the text unstyled. With `NO_COLOR` set, every method returns its text
 * unchanged.
 *
 * @param options - Explicit color switch, or a runtime to read `NO_COLOR` from.
 * @returns The style port.
 */
export function createWebStyle(options: WebStyleOptions = {}): StylePort {
  const plain = (): boolean => options.noColor ?? options.runtime?.env('NO_COLOR') !== undefined;
  const color = (pair: SgrPair | undefined, text: string): string =>
    pair === undefined || plain() ? text : wrap(pair, text);

  return {
    styled: (token, text) => (plain() ? text : styleToken(token, text)),
    rgb: (r, g, b, text) => color(foreground(r, g, b), text),
    hex: (value, text) => color(hexPair(value, foreground), text),
    bgRgb: (r, g, b, text) => color(background(r, g, b), text),
    bgHex: (value, text) => color(hexPair(value, background), text),
    bold: (text) => color(BOLD, text),
  };
}
