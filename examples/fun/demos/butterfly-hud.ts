// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// The words around the three universes: each pane's name and nudge, its divergence meter, and the timeline.
import type { Surface } from '@flyingrobots/bijou';
import { activeFork, earliest, type World } from './butterfly-history.js';
import { SAMPLE_RATE } from './butterfly-physics.js';
import type { Rgb } from './hsl.js';

const DIM: Rgb = { r: 110, g: 118, b: 140 };
const TEXT: Rgb = { r: 205, g: 212, b: 228 };
const BRIGHT: Rgb = { r: 255, g: 236, b: 150 };
/** The meter spans ten to the minus thirteen radians to one radian. */
const METER_FLOOR = -13;

/** Write `text` from (x, y), cut at `limit` cells. */
export function write(surface: Surface, x: number, y: number, text: string, fg: Rgb, bg: Rgb, limit = surface.width - x): void {
  const count = Math.min(text.length, Math.max(0, limit));
  for (let i = 0; i < count; i += 1) surface.setRGB(x + i, y, text.charAt(i), fg.r, fg.g, fg.b, bg.r, bg.g, bg.b);
}

const seconds = (tick: number): string => `${(tick / SAMPLE_RATE).toFixed(1)} s`;

/** What makes universe `index` different from A, in words. */
export function nudgeLabel(world: World, index: number): string {
  if (index === 0) return 'A  the reference';
  if (index === 1) return 'B  θ1 + 1e-12';
  const fork = activeFork(world);
  return fork === null ? 'C  θ1 + 1e-9' : `C  fork of A at ${seconds(fork)}, θ1 + 1e-12`;
}

function heat(fraction: number): Rgb {
  const f = Math.max(0, Math.min(1, fraction));
  return { r: Math.round(80 + 175 * f), g: Math.round(220 - 150 * f * f), b: Math.round(140 - 110 * f) };
}

/** The pane's title row and its meter row: log10 of the RMS angle distance to A, or a note for A itself. */
export function paintHeader(
  surface: Surface, x: number, y: number, width: number, label: string, distance: number | null, lit: boolean, paper: Rgb,
): void {
  for (let i = 0; i < width; i += 1) for (const row of [y, y + 1]) surface.setRGB(x + i, row, ' ', 0, 0, 0, paper.r, paper.g, paper.b);
  write(surface, x + 1, y, label, lit ? BRIGHT : TEXT, paper, width - 2);
  if (distance === null) { write(surface, x + 1, y + 1, 'the others are measured against me', DIM, paper, width - 2); return; }
  const log = distance > 0 ? Math.log10(distance) : METER_FLOOR;
  const value = `Δ 10^${log.toFixed(1).padStart(5)}`;
  write(surface, x + 1, y + 1, value, TEXT, paper, width - 2);
  const barX = x + value.length + 2;
  const barWidth = width - value.length - 3;
  const fraction = (log - METER_FLOOR) / -METER_FLOOR;
  for (let i = 0; i < barWidth; i += 1) {
    const on = (i + 0.5) / barWidth <= fraction;
    const ink = on ? heat(i / Math.max(1, barWidth - 1)) : { r: 40, g: 44, b: 58 };
    surface.setRGB(barX + i, y + 1, on ? '█' : '░', ink.r, ink.g, ink.b, paper.r, paper.g, paper.b);
  }
}

/** The bottom row: the clock, the recorded span as a bar with the cursor and fork marks, and live or replay. */
export function paintTimeline(surface: Surface, y: number, world: World, paper: Rgb): void {
  const width = surface.width;
  for (let i = 0; i < width; i += 1) surface.setRGB(i, y, ' ', 0, 0, 0, paper.r, paper.g, paper.b);
  const replay = world.tick < world.head;
  const left = ` t ${seconds(world.tick).padStart(7)} `;
  const right = ` ${replay ? 'REPLAY' : 'LIVE  '} ${seconds(earliest(world))} – ${seconds(world.head)} `;
  write(surface, 0, y, left, BRIGHT, paper);
  write(surface, Math.max(left.length, width - right.length), y, right, replay ? BRIGHT : DIM, paper);
  const barX = left.length;
  const barWidth = width - left.length - right.length;
  if (barWidth < 4) return;
  const from = earliest(world);
  const span = Math.max(1, world.head - from);
  const at = (tick: number): number => Math.round(((tick - from) / span) * (barWidth - 1));
  const cursor = at(world.tick);
  for (let i = 0; i < barWidth; i += 1) {
    const ink = i < cursor ? { r: 90, g: 150, b: 230 } : { r: 45, g: 52, b: 72 };
    surface.setRGB(barX + i, y, '━', ink.r, ink.g, ink.b, paper.r, paper.g, paper.b);
  }
  for (const fork of world.forks) {
    if (fork >= from) surface.setRGB(barX + at(fork), y, '◆', 240, 150, 90, paper.r, paper.g, paper.b);
  }
  surface.setRGB(barX + cursor, y, '●', BRIGHT.r, BRIGHT.g, BRIGHT.b, paper.r, paper.g, paper.b);
}
