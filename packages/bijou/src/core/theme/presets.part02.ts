import type { Theme } from './tokens.js';
import { tv } from './presets.part01.js';

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
