import type { Theme, TokenValue, TextModifier } from './tokens.js';
import { tryHexToRgb } from './color.js';

const FULL_HEX_RE = /^#[0-9a-fA-F]{6}$/;

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

function rgb(hex: string): [number, number, number] {
  if (!FULL_HEX_RE.test(hex)) {
    throw new Error(`rgb() expects a 7-character #rrggbb hex color, got "${hex}".`);
  }
  return [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16),
  ];
}

function gradient(hexes: readonly string[]): { readonly pos: number; readonly color: [number, number, number] }[] {
  const max = Math.max(1, hexes.length - 1);
  return hexes.map((hex, index) => ({
    pos: index / max,
    color: rgb(hex),
  }));
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

/**
 * BIJOU_DARK — the calm first-party dark theme.
 *
 * This preset is intentionally less saturated than the legacy cyan/magenta
 * palette. It keeps neutral surfaces dominant, separates focus/brand/status
 * roles, and preserves readable foregrounds across dense product surfaces.
 */
export const BIJOU_DARK: Theme = {
  name: 'bijou-dark',

  status: {
    success: tv('#8bd67d'),
    error:   tv('#ff8a80'),
    warning: tv('#f2c45d'),
    info:    tv('#8fbaff'),
    pending: tv('#a8b1c7', ['dim']),
    active:  tv('#f2c45d'),
    muted:   tv('#a8b1c7', ['dim', 'strikethrough']),
  },

  semantic: {
    success: tv('#8bd67d'),
    error:   tv('#ff8a80'),
    warning: tv('#f2c45d'),
    info:    tv('#8fbaff'),
    accent:  tv('#f2c45d'),
    muted:   tv('#a8b1c7', ['dim']),
    primary: tv('#f4e8bf', ['bold']),
  },

  gradient: {
    brand: gradient(['#7aa7e8', '#f2c45d', '#ff8a80']),
    progress: gradient(['#7aa7e8', '#8bd67d', '#f2c45d', '#ff8a80']),
  },

  border: {
    primary:   tv('#7aa7e8'),
    secondary: tv('#f2c45d'),
    success:   tv('#8bd67d'),
    warning:   tv('#f2c45d'),
    error:     tv('#ff8a80'),
    muted:     tv('#77809d'),
  },

  ui: {
    cursor:        tv('#f2c45d'),
    focusGutter:   { hex: '#f2c45d', bg: '#171827', modifiers: ['bold'] },
    scrollThumb:   tv('#7aa7e8'),
    scrollTrack:   tv('#77809d'),
    sectionHeader: tv('#f2c45d', ['bold']),
    logo:          tv('#f2c45d'),
    tableHeader:   tv('#f4e8bf', ['bold']),
    trackEmpty:    tv('#2a3150'),
  },

  surface: {
    primary:   { hex: '#f4e8bf', bg: '#171827' },
    secondary: { hex: '#d8def0', bg: '#20243a' },
    elevated:  { hex: '#f8f0d0', bg: '#29304d' },
    overlay:   { hex: '#f8f0d0', bg: '#10121f' },
    muted:     { hex: '#a8b1c7', bg: '#131625' },
  },
};

/**
 * BIJOU_LIGHT — the calm first-party light theme.
 *
 * The light preset mirrors the dark theme's roles while using ink-forward
 * foregrounds instead of pastel text, so dense terminal surfaces remain
 * scannable on bright backgrounds.
 */
export const BIJOU_LIGHT: Theme = {
  name: 'bijou-light',

  status: {
    success: tv('#246a3d'),
    error:   tv('#a33a3a'),
    warning: tv('#7a5200'),
    info:    tv('#285c9e'),
    pending: tv('#5e6778', ['dim']),
    active:  tv('#7a5200'),
    muted:   tv('#5e6778', ['dim', 'strikethrough']),
  },

  semantic: {
    success: tv('#246a3d'),
    error:   tv('#a33a3a'),
    warning: tv('#7a5200'),
    info:    tv('#285c9e'),
    accent:  tv('#7a5200'),
    muted:   tv('#5e6778', ['dim']),
    primary: tv('#1e2433', ['bold']),
  },

  gradient: {
    brand: gradient(['#285c9e', '#7a5200', '#a33a3a']),
    progress: gradient(['#285c9e', '#246a3d', '#7a5200', '#a33a3a']),
  },

  border: {
    primary:   tv('#285c9e'),
    secondary: tv('#7a5200'),
    success:   tv('#246a3d'),
    warning:   tv('#7a5200'),
    error:     tv('#a33a3a'),
    muted:     tv('#6f7888'),
  },

  ui: {
    cursor:        tv('#7a5200'),
    focusGutter:   { hex: '#7a5200', bg: '#fbf7ea', modifiers: ['bold'] },
    scrollThumb:   tv('#285c9e'),
    scrollTrack:   tv('#718399'),
    sectionHeader: tv('#7a5200', ['bold']),
    logo:          tv('#7a5200'),
    tableHeader:   tv('#1e2433', ['bold']),
    trackEmpty:    tv('#ded6c3'),
  },

  surface: {
    primary:   { hex: '#1e2433', bg: '#fbf7ea' },
    secondary: { hex: '#252b38', bg: '#efe7d2' },
    elevated:  { hex: '#1e2433', bg: '#fffdf6' },
    overlay:   { hex: '#1e2433', bg: '#f5eddb' },
    muted:     { hex: '#5e6778', bg: '#ece4d1' },
  },
};

/**
 * TEAL_ORANGE_PINK — a gradient-based theme.
 *
 * Uses the gradient colors (#3bcfd4 → #fc9305 → #f20094) as the
 * foundation, with harmonized status/semantic tokens.
 */
export const TEAL_ORANGE_PINK: Theme = {
  name: 'teal-orange-pink',

  status: {
    success: tv('#34d399'),
    error:   tv('#ef4444'),
    warning: tv('#fc9305'),
    info:    tv('#3bcfd4'),
    pending: tv('#6b7280', ['dim']),
    active:  tv('#3bcfd4'),
    muted:   tv('#6b7280', ['dim', 'strikethrough']),
  },

  semantic: {
    success: tv('#34d399'),
    error:   tv('#ef4444'),
    warning: tv('#fc9305'),
    info:    tv('#3bcfd4'),
    accent:  tv('#f20094'),
    muted:   tv('#6b7280', ['dim']),
    primary: tv('#d1d5db', ['bold']),
  },

  gradient: {
    brand: [
      { pos: 0, color: [0x3b, 0xcf, 0xd4] },
      { pos: 0.5, color: [0xfc, 0x93, 0x05] },
      { pos: 1, color: [0xf2, 0x00, 0x94] },
    ],
    progress: [
      { pos: 0, color: [0x3b, 0xcf, 0xd4] },
      { pos: 0.5, color: [0xfc, 0x93, 0x05] },
      { pos: 1, color: [0xf2, 0x00, 0x94] },
    ],
  },

  border: {
    primary:   tv('#3bcfd4'),
    secondary: tv('#f20094'),
    success:   tv('#34d399'),
    warning:   tv('#fc9305'),
    error:     tv('#ef4444'),
    muted:     tv('#6b7280'),
  },

  ui: {
    cursor:        tv('#3bcfd4'),
    focusGutter:   tv('#f20094'),
    scrollThumb:   tv('#3bcfd4'),
    scrollTrack:   tv('#6b7280'),
    sectionHeader: tv('#fc9305', ['bold']),
    logo:          tv('#3bcfd4'),
    tableHeader:   tv('#d1d5db'),
    trackEmpty:    tv('#404040'),
  },

  surface: {
    primary:   { hex: '#d1d5db', bg: '#1f2937' },
    secondary: { hex: '#d1d5db', bg: '#111827' },
    elevated:  { hex: '#d1d5db', bg: '#374151' },
    overlay:   { hex: '#d1d5db', bg: '#1f2937' },
    muted:     { hex: '#6b7280', bg: '#0f1117' },
  },
};

/** Registry of all built-in presets, keyed by theme name. */
export const PRESETS: Record<string, Theme> = {
  'bijou-dark': BIJOU_DARK,
  'bijou-light': BIJOU_LIGHT,
  'cyan-magenta': CYAN_MAGENTA,
  'teal-orange-pink': TEAL_ORANGE_PINK,
  'nord': {
    name: 'nord',
    status: {
      success: tv('#A3BE8C'),
      error:   tv('#BF616A'),
      warning: tv('#EBCB8B'),
      info:    tv('#88C0D0'),
      pending: tv('#4C566A', ['dim']),
      active:  tv('#88C0D0'),
      muted:   tv('#4C566A', ['dim', 'strikethrough']),
    },
    semantic: {
      success: tv('#A3BE8C'),
      error:   tv('#BF616A'),
      warning: tv('#EBCB8B'),
      info:    tv('#88C0D0'),
      accent:  tv('#B48EAD'),
      muted:   tv('#4C566A', ['dim']),
      primary: tv('#ECEFF4', ['bold']),
    },
    gradient: {
      brand: [
        { pos: 0, color: [0x8f, 0xbc, 0xbb] },
        { pos: 1, color: [0x5e, 0x81, 0xac] },
      ],
      progress: [
        { pos: 0, color: [0x8f, 0xbc, 0xbb] },
        { pos: 1, color: [0x5e, 0x81, 0xac] },
      ],
    },
    border: {
      primary:   tv('#81A1C1'),
      secondary: tv('#5E81AC'),
      success:   tv('#A3BE8C'),
      warning:   tv('#EBCB8B'),
      error:     tv('#BF616A'),
      muted:     tv('#4C566A'),
    },
    ui: {
      cursor:        tv('#88C0D0'),
      focusGutter:   tv('#B48EAD'),
      scrollThumb:   tv('#81A1C1'),
      scrollTrack:   tv('#3B4252'),
      sectionHeader: tv('#88C0D0', ['bold']),
      logo:          tv('#88C0D0'),
      tableHeader:   tv('#D8DEE9'),
      trackEmpty:    tv('#2E3440'),
    },
    surface: {
      primary:   { hex: '#D8DEE9', bg: '#2E3440' },
      secondary: { hex: '#D8DEE9', bg: '#3B4252' },
      elevated:  { hex: '#ECEFF4', bg: '#434C5E' },
      overlay:   { hex: '#D8DEE9', bg: '#2E3440' },
      muted:     { hex: '#4C566A', bg: '#242933' },
    },
  },
  'catppuccin': {
    name: 'catppuccin',
    status: {
      success: tv('#a6e3a1'),
      error:   tv('#f38ba8'),
      warning: tv('#f9e2af'),
      info:    tv('#89dceb'),
      pending: tv('#6c7086', ['dim']),
      active:  tv('#89b4fa'),
      muted:   tv('#6c7086', ['dim', 'strikethrough']),
    },
    semantic: {
      success: tv('#a6e3a1'),
      error:   tv('#f38ba8'),
      warning: tv('#f9e2af'),
      info:    tv('#89dceb'),
      accent:  tv('#cba6f7'),
      muted:   tv('#6c7086', ['dim']),
      primary: tv('#cdd6f4', ['bold']),
    },
    gradient: {
      brand: [
        { pos: 0, color: [0x89, 0xb4, 0xfa] },
        { pos: 0.5, color: [0xcb, 0xa6, 0xf7] },
        { pos: 1, color: [0xf5, 0xc2, 0xe7] },
      ],
      progress: [
        { pos: 0, color: [0x94, 0xe2, 0xd5] },
        { pos: 1, color: [0xa6, 0xe3, 0x1] },
      ],
    },
    border: {
      primary:   tv('#89b4fa'),
      secondary: tv('#cba6f7'),
      success:   tv('#a6e3a1'),
      warning:   tv('#f9e2af'),
      error:     tv('#f38ba8'),
      muted:     tv('#6c7086'),
    },
    ui: {
      cursor:        tv('#f5e0dc'),
      focusGutter:   tv('#cba6f7'),
      scrollThumb:   tv('#89b4fa'),
      scrollTrack:   tv('#313244'),
      sectionHeader: tv('#fab387', ['bold']),
      logo:          tv('#cba6f7'),
      tableHeader:   tv('#cdd6f4'),
      trackEmpty:    tv('#181825'),
    },
    surface: {
      primary:   { hex: '#cdd6f4', bg: '#1e1e2e' },
      secondary: { hex: '#cdd6f4', bg: '#181825' },
      elevated:  { hex: '#cdd6f4', bg: '#313244' },
      overlay:   { hex: '#cdd6f4', bg: '#1e1e2e' },
      muted:     { hex: '#6c7086', bg: '#11111b' },
    },
  },
};
