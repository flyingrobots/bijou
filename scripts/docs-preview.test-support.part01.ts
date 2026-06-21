import { readFileSync } from 'node:fs';

import { resolve } from 'node:path';

import { expect } from 'vitest';

import { colorHex, doctorTheme, lerp3, themeContrastRatio } from '@flyingrobots/bijou';

import type { ColorRef, Theme } from '@flyingrobots/bijou';

import { DOGFOOD_THEME_SAFE_PAIRS } from '../examples/docs/app.js';
export const PKG: unknown = JSON.parse(
  readFileSync(resolve(import.meta.dirname, '..', 'packages', 'bijou', 'package.json'), 'utf8'),
);
export const BIJOU_VERSION = (
  typeof PKG === 'object'
  && PKG !== null
  && 'version' in PKG
  && typeof PKG.version === 'string'
)
  ? PKG.version
  : '0.0.0';
export const KEY_ENTER = '\r';
export const KEY_UP = '\x1b[A';
export const KEY_DOWN = '\x1b[B';
export const KEY_LEFT = '\x1b[D';
export const KEY_RIGHT = '\x1b[C';
export const KEY_ESCAPE = '\x1b';
export const KEY_F2 = '\x1bOQ';
export const KEY_TAB = '\t';
export const KEY_CTRL_P = '\x10';
export const KEY_F10 = '\x1b[21~';
export const KEY_NEXT_TAB = ']';
export const KEY_BACKTICK = '`';
export const V7_RASTER_TITLE_GLYPHS = new Set(['░', '▒', '▓', '█']);
export const V7_TITLE_CELL_ASPECT_RATIO = 0.5;
export const V7_BIJOU_SVG_TEXT = readFileSync(resolve(import.meta.dirname, '..', 'assets', 'Bijou.svg'), 'utf8');
export const FLYING_ROBOTS_LOGO_TEXT = readFileSync(resolve(import.meta.dirname, '..', 'assets', 'flyingrobotslogo.txt'), 'utf8').trimEnd();
export const FLYING_ROBOTS_TRANSPARENT_CELL = '\u2800';
export const V7_DEFAULT_BACKGROUND = '#18172b';
export const V7_DEFAULT_WAVE_GRADIENT = ['#2f3f66', '#5f87c8', '#f2c96b'] as const;
export const V7_LANDING_COLOR_RAMP_SIZE = 256;
export const V7_LANDING_WAKE_CHARS = ['█', '▓', '▒', '░', ' '] as const;
export const V7_LANDING_WAKE_WAVES = [
  { seeds: [0.15, 0.13, 0.37], amps: [10, 8, 5], scale: 0.9 },
  { seeds: [0.12, 0.14, 0.27], amps: [3, 6, 5], scale: 0.8 },
  { seeds: [0.089, 0.023, 0.217], amps: [2, 4, 2], scale: 0.3 },
  { seeds: [0.167, 0.054, 0.147], amps: [4, 6, 7], scale: 0.4 },
] as const;
export const TOKEN_DOCTRINE_PATH = resolve(import.meta.dirname, '..', 'docs', 'design-system', 'theme-tokens.md');
export function assertContrast(
  theme: Theme,
  foreground: string,
  background: string,
  label: string,
  minRatio = 4.5,
): void {
  const ratio = themeContrastRatio(foreground, background);
  if (ratio == null) throw new Error(`Missing contrast: ${theme.name} ${label}`);
  expect(ratio, `${theme.name} ${label}`).toBeGreaterThanOrEqual(minRatio);
}
export function assertReadableDogfoodTheme(theme: Theme): void {
  const surfaceBackgrounds = Object.entries(theme.surface).map(([name, token]) => {
    if (token.bg == null) throw new Error(`Missing ${theme.name} surface.${name}.bg`);
    assertContrast(theme, token.hex, token.bg, `surface.${name} text on fill`);
    return token.bg;
  });

  expect(new Set(surfaceBackgrounds).size, `${theme.name} surface backgrounds`).toBeGreaterThanOrEqual(4);

  const report = doctorTheme(theme, { contrastPairs: DOGFOOD_THEME_SAFE_PAIRS });
  expect(report.issues, `${theme.name} safe pairs`).toEqual([]);
}
export const V7_BIJOU_LOGO_LETTER_COUNT = 5;
export const V7_BIJOU_LOGO_WAVE_AMPLITUDE_ROWS = 1.35;
export function keyMsg(key: string, options: { ctrl?: boolean; alt?: boolean; shift?: boolean } = {}) {
  return {
    type: 'key' as const,
    key,
    ctrl: options.ctrl ?? false,
    alt: options.alt ?? false,
    shift: options.shift ?? false,
  };
}
export function serializeFrame(frame: { width: number; height: number; get(x: number, y: number): { char?: string; fg?: ColorRef; bg?: ColorRef } }) {
  const cells: string[] = [];
  for (let y = 0; y < frame.height; y++) {
    for (let x = 0; x < frame.width; x++) {
      const cell = frame.get(x, y);
      cells.push(`${cell.char ?? ' '}|${colorHex(cell.fg) ?? ''}|${colorHex(cell.bg) ?? ''}`);
    }
  }
  return cells.join('\n');
}
export function frameText(frame: { width: number; height: number; get(x: number, y: number): { char?: string } }) {
  let text = '';
  for (let y = 0; y < frame.height; y++) {
    for (let x = 0; x < frame.width; x++) {
      text += frame.get(x, y).char ?? ' ';
    }
    text += '\n';
  }
  return text;
}
export function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
export function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace(/^#/, '');
  return [
    parseInt(normalized.slice(0, 2), 16),
    parseInt(normalized.slice(2, 4), 16),
    parseInt(normalized.slice(4, 6), 16),
  ];
}
export function rgbHex(r: number, g: number, b: number): string {
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
export function oppositeHexColor(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbHex(255 - r, 255 - g, 255 - b);
}
export function sampleDefaultWaveRamp(t: number): string {
  const index = Math.max(0, Math.min(
    V7_LANDING_COLOR_RAMP_SIZE - 1,
    Math.round(clamp01(t) * (V7_LANDING_COLOR_RAMP_SIZE - 1)),
  ));
  const stops = V7_DEFAULT_WAVE_GRADIENT.map((color, stopIndex) => ({
    pos: stopIndex / (V7_DEFAULT_WAVE_GRADIENT.length - 1),
    color: hexToRgb(color),
  }));
  return rgbHex(...lerp3(stops, index / (V7_LANDING_COLOR_RAMP_SIZE - 1)));
}
