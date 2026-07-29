import type { Theme } from './tokens.js';
import { BIJOU_DARK } from './bijou-dark-preset.js';
import { BIJOU_LIGHT } from './bijou-light-preset.js';
import { CYAN_MAGENTA, tv } from './presets.part01.js';
import { TEAL_ORANGE_PINK } from './presets.part02.js';

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
