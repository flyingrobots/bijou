import type { Theme, BaseStatusKey, TokenValue, TextModifier } from './tokens.js';

/**
 * Shorthand helper to create a TokenValue with less boilerplate.
 * @param hex - Hex color string (e.g. `'#00ffff'`).
 * @param modifiers - Optional text modifiers to attach.
 * @returns TokenValue with the given hex and optional modifiers.
 */
export function tv(hex: string, modifiers?: TextModifier[]): TokenValue {
  return modifiers !== undefined ? { hex, modifiers } : { hex };
}

/**
 * CYAN_MAGENTA — the default theme.
 *
 * Named ANSI → hex mapping used here:
 *   green   = #00ff00    cyan    = #00ffff    magenta = #ff00ff
 *   red     = #ff0000    yellow  = #ffff00    blue    = #0000ff
 *   gray    = #808080    white   = #ffffff
 */
export const CYAN_MAGENTA: Theme<BaseStatusKey> = {
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
    scrollThumb:   tv('#00ffff'),
    scrollTrack:   tv('#808080'),
    sectionHeader: tv('#0000ff', ['bold']),
    logo:          tv('#00ffff'),
    tableHeader:   tv('#ffffff'),
    trackEmpty:    tv('#505050'),
  },
};

/**
 * TEAL_ORANGE_PINK — a gradient-based theme.
 *
 * Uses the gradient colors (#3bcfd4 → #fc9305 → #f20094) as the
 * foundation, with harmonized status/semantic tokens.
 */
export const TEAL_ORANGE_PINK: Theme<BaseStatusKey> = {
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
    scrollThumb:   tv('#3bcfd4'),
    scrollTrack:   tv('#6b7280'),
    sectionHeader: tv('#fc9305', ['bold']),
    logo:          tv('#3bcfd4'),
    tableHeader:   tv('#d1d5db'),
    trackEmpty:    tv('#404040'),
  },
};

/** Registry of all built-in presets, keyed by theme name. */
export const PRESETS: Record<string, Theme> = {
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
      scrollThumb:   tv('#81A1C1'),
      scrollTrack:   tv('#3B4252'),
      sectionHeader: tv('#88C0D0', ['bold']),
      logo:          tv('#88C0D0'),
      tableHeader:   tv('#D8DEE9'),
      trackEmpty:    tv('#2E3440'),
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
      scrollThumb:   tv('#89b4fa'),
      scrollTrack:   tv('#313244'),
      sectionHeader: tv('#fab387', ['bold']),
      logo:          tv('#cba6f7'),
      tableHeader:   tv('#cdd6f4'),
      trackEmpty:    tv('#181825'),
    },
  },
};
