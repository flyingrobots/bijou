import {
  CYAN_MAGENTA,
  defineThemeSafePairs,
  tv,
  type RGB,
  type Theme,
} from '../../packages/bijou/src/index.js';
import type { FrameShellTheme } from '../../packages/bijou-tui/src/index.js';

function rgbFromHex(hex: string): RGB {
  return [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16),
  ];
}

function gradientStopsFromHexes(hexes: readonly string[]) {
  const max = Math.max(1, hexes.length - 1);
  return hexes.map((hex, index) => ({
    pos: index / max,
    color: rgbFromHex(hex),
  }));
}

const DOGFOOD_DARK_THEME: Theme = {
  ...CYAN_MAGENTA,
  name: 'dogfood-dark',
  status: {
    ...CYAN_MAGENTA.status,
    success: tv('#8bd67d'),
    error: tv('#ff8a80'),
    warning: tv('#ffd166'),
    info: tv('#5eead4'),
    pending: tv('#b7c0ca', ['dim']),
    active: tv('#f7c948'),
    muted: tv('#8c97a3', ['dim', 'strikethrough']),
  },
  semantic: {
    ...CYAN_MAGENTA.semantic,
    success: tv('#8bd67d'),
    error: tv('#ff8a80'),
    warning: tv('#ffd166'),
    info: tv('#5eead4'),
    accent: tv('#f7c948'),
    muted: tv('#b7c0ca', ['dim']),
    primary: tv('#f1f5f9', ['bold']),
  },
  gradient: {
    ...CYAN_MAGENTA.gradient,
    brand: gradientStopsFromHexes(['#5eead4', '#f7c948', '#ff8a80']),
    progress: gradientStopsFromHexes([
      '#5eead4',
      '#8bd67d',
      '#f7c948',
      '#ff8a80',
    ]),
  },
  border: {
    ...CYAN_MAGENTA.border,
    primary: tv('#5eead4'),
    secondary: tv('#f7c948'),
    success: tv('#8bd67d'),
    warning: tv('#ffd166'),
    error: tv('#ff8a80'),
    muted: tv('#40505b'),
  },
  ui: {
    ...CYAN_MAGENTA.ui,
    cursor: tv('#f7c948'),
    focusGutter: { hex: '#f7c948', bg: '#111416', modifiers: ['bold'] },
    scrollThumb: tv('#5eead4'),
    scrollTrack: tv('#40505b'),
    sectionHeader: tv('#f7c948', ['bold']),
    logo: tv('#f7c948'),
    tableHeader: tv('#f1f5f9', ['bold']),
    trackEmpty: tv('#202831'),
  },
  surface: {
    primary: { hex: '#f1f5f9', bg: '#111416' },
    secondary: { hex: '#cbd5e1', bg: '#171d21' },
    elevated: { hex: '#f1f5f9', bg: '#202831' },
    overlay: { hex: '#f1f5f9', bg: '#070a0d' },
    muted: { hex: '#b7c0ca', bg: '#0d1117' },
  },
};

const DOGFOOD_LIGHT_THEME: Theme = {
  ...CYAN_MAGENTA,
  name: 'dogfood-light',
  status: {
    ...CYAN_MAGENTA.status,
    success: tv('#106f36'),
    error: tv('#a01616'),
    warning: tv('#7a3f00'),
    info: tv('#045f88'),
    pending: tv('#5f6f83', ['dim']),
    active: tv('#9a3d00'),
    muted: tv('#5f6f83', ['dim', 'strikethrough']),
  },
  semantic: {
    ...CYAN_MAGENTA.semantic,
    success: tv('#106f36'),
    error: tv('#a01616'),
    warning: tv('#7a3f00'),
    info: tv('#045f88'),
    accent: tv('#9a3d00'),
    muted: tv('#5f6f83', ['dim']),
    primary: tv('#1f2933', ['bold']),
  },
  gradient: {
    ...CYAN_MAGENTA.gradient,
    brand: gradientStopsFromHexes(['#045f88', '#9a3d00', '#a01616']),
    progress: gradientStopsFromHexes([
      '#045f88',
      '#106f36',
      '#9a3d00',
      '#a01616',
    ]),
  },
  border: {
    ...CYAN_MAGENTA.border,
    primary: tv('#045f88'),
    secondary: tv('#9a3d00'),
    success: tv('#106f36'),
    warning: tv('#7a3f00'),
    error: tv('#a01616'),
    muted: tv('#8b99a8'),
  },
  ui: {
    ...CYAN_MAGENTA.ui,
    cursor: tv('#9a3d00'),
    focusGutter: { hex: '#9a3d00', bg: '#f8fafc', modifiers: ['bold'] },
    scrollThumb: tv('#045f88'),
    scrollTrack: tv('#d8e0e8'),
    sectionHeader: tv('#9a3d00', ['bold']),
    logo: tv('#9a3d00'),
    tableHeader: tv('#1f2933', ['bold']),
    trackEmpty: tv('#e1e7ee'),
  },
  surface: {
    primary: { hex: '#1f2933', bg: '#f8fafc' },
    secondary: { hex: '#1f2933', bg: '#f1f5f9' },
    elevated: { hex: '#1f2933', bg: '#ffffff' },
    overlay: { hex: '#1f2933', bg: '#f4f6f9' },
    muted: { hex: '#5f6f83', bg: '#edf2f7' },
  },
};

const DOGFOOD_READABLE_FOREGROUNDS = [
  'semantic.primary',
  'semantic.muted',
  'semantic.accent',
  'semantic.info',
  'semantic.success',
  'semantic.warning',
  'semantic.error',
] as const;

const DOGFOOD_STATUS_FOREGROUNDS = [
  'status.active',
  'status.pending',
] as const;

const DOGFOOD_SURFACE_BACKGROUNDS = [
  'surface.primary.bg',
  'surface.secondary.bg',
  'surface.elevated.bg',
  'surface.overlay.bg',
  'surface.muted.bg',
] as const;

const dogfoodPairs = defineThemeSafePairs();

for (const foreground of DOGFOOD_READABLE_FOREGROUNDS) {
  for (const background of DOGFOOD_SURFACE_BACKGROUNDS) {
    dogfoodPairs.readable(foreground, background);
  }
}

for (const foreground of DOGFOOD_STATUS_FOREGROUNDS) {
  for (const background of DOGFOOD_SURFACE_BACKGROUNDS) {
    dogfoodPairs.status(foreground, background);
  }
}

for (const background of DOGFOOD_SURFACE_BACKGROUNDS) {
  dogfoodPairs.chrome('ui.cursor', background);
}

export const DOGFOOD_THEME_SAFE_PAIRS = dogfoodPairs.build();

export const DOGFOOD_SHELL_THEMES: readonly FrameShellTheme[] = Object.freeze([
  {
    id: 'dogfood-dark',
    label: 'DOGFOOD Dark',
    description: 'High-contrast neutral docs shell for dark terminals.',
    theme: DOGFOOD_DARK_THEME,
  },
  {
    id: 'dogfood-light',
    label: 'DOGFOOD Light',
    description: 'High-contrast neutral docs shell for light terminals.',
    theme: DOGFOOD_LIGHT_THEME,
  },
]);
