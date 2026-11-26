// Licensed under the Apache License, Version 2.0, like the rest of this repository.
import { boundsOf, type Polygons } from './font-outline.js';
import type { Typeface } from './typeface.js';

export const BASE_SIZE = 48;
const DEFAULT_LINES = ['SplitText', '3D Cylinder', 'TUI Ticker', 'Bijou Engine'];

type Ready = Extract<Typeface, { status: 'ready' }>;

/** The four words rolled on the cylinder: the message's words in turn, or the built-in phrases when it has none. */
export function tickerLines(message: string): readonly string[] {
  const words = message.split(/\s+/u).filter(Boolean);
  return words.length === 0 ? DEFAULT_LINES : [0, 1, 2, 3].map((i) => words[i % words.length] ?? '');
}

/** One character on its way round: where it sits along the line, and its outline after the roll and the perspective. */
export interface Rolling {
  readonly paths: Polygons;
  readonly hue: number;
  readonly shade: number;
}

/** Where a line's characters sit, centred on the line: the pen position of each, and the width of the whole. */
export function layoutLine(face: Ready, text: string): { readonly centres: readonly number[]; readonly width: number } {
  let pen = 0;
  const starts: number[] = [];
  const advances: number[] = [];
  for (let i = 0; i < text.length; i += 1) {
    const advance = face.glyph(text.charAt(i), BASE_SIZE).advance;
    starts.push(pen);
    advances.push(advance);
    pen += advance;
  }
  return { centres: starts.map((at, i) => at + (advances[i] ?? 0) / 2 - pen / 2), width: pen };
}

/**
 * The character `char` of line `line`, rolled to its place on the front face of the cylinder at `time`, or null when
 * it is round the back (or has no outline). `centre` is its x along the line, `grid` the raster size.
 */
export function roll(
  face: Ready, char: string, centre: number, line: number, index: number, time: number, grid: readonly [number, number],
): Rolling | null {
  const period = 1.8;
  let local = (time - (line * 0.45 + index * 0.06)) % period;
  if (local < 0) local += period;
  if (local >= 0.9) return null;
  const theta = ((90 - 180 * (local / 0.9)) * Math.PI) / 180;
  const [cosT, sinT] = [Math.cos(theta), Math.sin(theta)];
  const { paths } = face.glyph(char, BASE_SIZE);
  const box = boundsOf(paths);
  if (box === null) return null;
  const [cx, cy] = [(box.minX + box.maxX) / 2, (box.minY + box.maxY) / 2];
  const [gridW, gridH] = grid;
  const radius = gridH * 0.38;
  const focal = radius * 2.2;
  const middleY = gridH / 2 + Math.sin(time * 2.4) * (gridH * 0.06);
  const projected = paths.map((path) => path.map((v) => {
    const ly = -v.y - cy;
    const y3 = ly * cosT - radius * sinT;
    const z3 = ly * sinT + radius * cosT - radius;
    const scale = focal / (focal - z3);
    return { x: (centre + (v.x - cx)) * scale + gridW / 2, y: -y3 * scale + middleY };
  }));
  return { paths: projected, hue: (line * 45 + index * 15 - time * 65) % 360, shade: 0.35 + 0.65 * cosT };
}
