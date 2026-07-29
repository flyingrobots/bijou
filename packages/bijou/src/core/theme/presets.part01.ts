import type { Theme, TokenValue, TextModifier } from './tokens.js';
import { tryHexToRgb } from './color.js';

/**
 * Shorthand helper to create a TokenValue with less boilerplate.
 * Automatically pre-parses hex into numeric fgRGB for hot rendering paths.
 * @param hex - Hex color string (e.g. `'#00ffff'`).
 * @param modifiers - Optional text modifiers to attach.
 * @returns TokenValue with the given hex, fgRGB, and optional modifiers.
 */
export function tv(hex: string, modifiers?: TextModifier[]): TokenValue {
  const fgRGB = tryHexToRgb(hex);
  if (modifiers !== undefined) {
    return fgRGB ? { hex, modifiers, fgRGB } : { hex, modifiers };
  }
  return fgRGB ? { hex, fgRGB } : { hex };
}

/**
 * Populate fgRGB and bgRGB on an existing TokenValue from its current hex/bg.
 * Used by theme resolution to ensure cached RGB bytes stay in sync even when
 * callers clone a theme token and override only the string color fields.
 *
 * **Mutates the token in place.** Callers should not pass frozen/shared tokens.
 */
export function populateTokenRGB(token: TokenValue): TokenValue {
  const fgRGB = tryHexToRgb(token.hex);
  if (fgRGB) token.fgRGB = fgRGB;
  else delete token.fgRGB;

  if (token.bg) {
    const bgRGB = tryHexToRgb(token.bg);
    if (bgRGB) token.bgRGB = bgRGB;
    else delete token.bgRGB;
  } else {
    delete token.bgRGB;
  }
  return token;
}

/**
 * CYAN_MAGENTA — the legacy vivid terminal-native preset.
 *
 * Named ANSI → hex mapping used here:
 *   green   = #00ff00    cyan    = #00ffff    magenta = #ff00ff
 *   red     = #ff0000    yellow  = #ffff00    blue    = #0000ff
 *   gray    = #808080    white   = #ffffff
 */
export const CYAN_MAGENTA: Theme = {
  name: 'cyan-magenta',

  status: {
    success: tv('#00ff00'),
    error:   tv('#ff0000'),
    warning: tv('#ffff00'),
    info:    tv('#00ffff'),
    pending: tv('#808080', ['dim']),
    active:  tv('#00ffff'),
    muted:   tv('#808080', ['dim', 'strikethrough']),
  },

  semantic: {
    success: tv('#00ff00'),
    error:   tv('#ff0000'),
    warning: tv('#ffff00'),
    info:    tv('#00ffff'),
    accent:  tv('#ff00ff'),
    muted:   tv('#808080', ['dim']),
    primary: tv('#ffffff', ['bold']),
  },

  gradient: {
    brand: [
      { pos: 0, color: [0, 255, 255] },
      { pos: 1, color: [255, 0, 255] },
    ],
    progress: [
      { pos: 0, color: [0, 255, 255] },
      { pos: 1, color: [255, 0, 255] },
    ],
  },

  border: {
    primary:   tv('#00ffff'),
    secondary: tv('#ff00ff'),
    success:   tv('#00ff00'),
    warning:   tv('#ffff00'),
    error:     tv('#ff0000'),
    muted:     tv('#808080'),
  },

  ui: {
    cursor:        tv('#00ffff'),
    focusGutter:   tv('#ff00ff'),
    scrollThumb:   tv('#00ffff'),
    scrollTrack:   tv('#808080'),
    sectionHeader: tv('#0000ff', ['bold']),
    logo:          tv('#00ffff'),
    tableHeader:   tv('#ffffff'),
    trackEmpty:    tv('#505050'),
  },

  surface: {
    primary:   { hex: '#ffffff', bg: '#1a1a2e' },
    secondary: { hex: '#e0e0e0', bg: '#16213e' },
    elevated:  { hex: '#ffffff', bg: '#0f3460' },
    overlay:   { hex: '#ffffff', bg: '#1a1a2e' },
    muted:     { hex: '#808080', bg: '#0a0a14' },
  },
};
