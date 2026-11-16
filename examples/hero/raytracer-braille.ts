import { createSurface, type RGB, type Surface } from '../../packages/bijou/src/index.js';
import { tracePixels } from './raytracer.js';
import type { HeroPalette } from './theme.js';

function hex([r, g, b]: RGB): string {
  return `#${[r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')}`;
}

function mean(colors: readonly RGB[], fallback: RGB): RGB {
  if (colors.length === 0) return fallback;
  const sum = colors.reduce<[number, number, number]>((acc, c) => [acc[0] + c[0], acc[1] + c[1], acc[2] + c[2]], [0, 0, 0]);
  return [sum[0] / colors.length, sum[1] / colors.length, sum[2] / colors.length];
}

/** Braille dot bit for sub-pixel (col, row) in the 2×4 grid (Unicode Braille Patterns). */
const BRAILLE_BIT: readonly (readonly number[])[] = [[0, 3], [1, 4], [2, 5], [6, 7]];
/** 2×4 ordered-dither thresholds, so mid-tones become dot density instead of banding. */
const DITHER: readonly (readonly number[])[] = [[0, 4], [6, 2], [1, 5], [7, 3]];

const BLACK: RGB = [0, 0, 0];

const luminance = ([r, g, b]: RGB): number => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

/**
 * Ray-trace into Braille: eight sub-pixels per cell (four times the half-block resolution).
 * Each cell gets a dithered dot mask, the mean colour of its lit dots as foreground and
 * the mean of its unlit dots as background, so a cell still carries two colours.
 */
export function raytraceBrailleSurface(width: number, height: number, time: number, palette: HeroPalette): Surface {
  const surface = createSurface(width, height);
  if (width <= 0 || height <= 0) return surface;
  const pw = width * 2;
  const pixels = tracePixels(pw, height * 4, time, palette);
  for (let cy = 0; cy < height; cy++) {
    for (let cx = 0; cx < width; cx++) {
      const samples = [0, 1, 2, 3].flatMap((row) => [0, 1].map((col) => ({ row, col, rgb: pixels[(cy * 4 + row) * pw + cx * 2 + col] ?? BLACK })));
      const local = samples.map((s) => luminance(s.rgb));
      const lo = Math.min(...local);
      const span = Math.max(1e-3, Math.max(...local) - lo);
      const lit = samples.filter((s, i) => ((local[i] ?? 0) - lo) / span > ((DITHER[s.row]?.[s.col] ?? 0) + 0.5) / 8);
      const unlit = samples.filter((s) => !lit.includes(s));
      const bits = lit.reduce((acc, s) => acc | (1 << (BRAILLE_BIT[s.row]?.[s.col] ?? 0)), 0);
      const bg = mean(unlit.map((s) => s.rgb), mean(lit.map((s) => s.rgb), [0, 0, 0]));
      const fg = mean(lit.map((s) => s.rgb), bg);
      surface.set(cx, cy, { char: String.fromCodePoint(0x2800 + bits), fg: hex(fg), bg: hex(bg), empty: false });
    }
  }
  return surface;
}
