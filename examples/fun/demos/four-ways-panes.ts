// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// The panes around the sky. Each gets a context with its output mode set and hands it to
// real Bijou Components, which lower themselves: the same call, four renderings.
import { box, parseAnsiToSurface, progressBar, table, type BijouContext, type OutputMode, type Surface, type TableColumn } from '@flyingrobots/bijou';
import { distance, gap, KMS, planetAt, PLANETS, speedKms, type Comet } from './four-ways-sim.js';

export type Rgb = readonly [number, number, number];
export interface Inked { readonly text: string; readonly ink: Rgb }

export const withMode = (ctx: BijouContext, mode: OutputMode): BijouContext => ({ ...ctx, mode });

const ESCAPE = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'gu');
const SEGMENTER = new Intl.Segmenter();
const graphemes = (text: string): string[] => Array.from(SEGMENTER.segment(text), (part) => part.segment);
export const visible = (text: string): number => graphemes(text.replace(ESCAPE, '')).length;

const BADGE: Readonly<Record<OutputMode, Rgb>> = {
  interactive: [235, 120, 60],
  static: [80, 160, 230],
  pipe: [90, 190, 120],
  accessible: [200, 120, 220],
};

/** Write plain text at (x, y), clipped to `width` columns. */
export function write(surface: Surface, x: number, y: number, width: number, text: string, fg: Rgb, bg: Rgb = [0, 0, 0]): void {
  graphemes(text).slice(0, Math.max(0, width)).forEach((char, i) => {
    surface.setRGB(x + i, y, char, Math.round(fg[0]), Math.round(fg[1]), Math.round(fg[2]), bg[0], bg[1], bg[2]);
  });
}

/** A Component's string output, ANSI and all, placed on the surface. */
export function place(surface: Surface, text: string, x: number, y: number, width: number, height: number): void {
  if (width > 0 && height > 0) surface.blit(parseAnsiToSurface(text, width, height), x, y);
}

/**
 * A pane's title row: the mode name as a badge, a blurb, and at the right the comet's orbital phase from
 * `progressBar` lowered in that same mode, a gradient bar, a bar, `Progress: 42%`, or `42 percent complete.`
 */
export function header(surface: Surface, x: number, y: number, width: number, mode: OutputMode, blurb: string, phase: number, ctx: BijouContext): void {
  write(surface, x, y, width, ' '.repeat(width), [0, 0, 0], [18, 20, 30]);
  const badge = ` ${mode} `;
  write(surface, x, y, width, badge, [10, 10, 16], BADGE[mode]);
  const room = width - badge.length - 2;
  const barWidth = Math.max(4, Math.min(16, room - blurb.length - 6));
  const bar = progressBar(phase * 100, { ctx: withMode(ctx, mode), width: barWidth });
  const used = visible(bar);
  const fits = used <= room;
  const blurbRoom = room - (fits ? used + 1 : 0);
  write(surface, x + badge.length + 1, y, blurbRoom, blurb, [130, 135, 160], [18, 20, 30]);
  if (fits) place(surface, bar, x + width - used, y, used, 1);
}

/** The `static` lowering: a box holding a table of bodies and a progress bar for the comet's orbit. */
export function staticReport(comet: Comet, t: number, phase: number, width: number, ctx: BijouContext): string {
  const quiet = withMode(ctx, 'static');
  const rows = [
    ['comet', distance(comet).toFixed(2), speedKms(comet).toFixed(1), '-'],
    ...PLANETS.map((planet) => {
      const [px, py] = planetAt(planet, t);
      const speed = ((2 * Math.PI) / Math.sqrt(planet.radius)) * KMS;
      return [planet.name, Math.hypot(px, py).toFixed(2), speed.toFixed(1), gap(comet, planet, t).toFixed(2)];
    }),
  ];
  const columns: TableColumn[] = [
    { header: 'body' },
    { header: 'r AU', align: 'right' },
    { header: 'km/s', align: 'right' },
    { header: 'gap AU', align: 'right' },
  ];
  const inner = Math.max(20, width - 4);
  const grid = table({ columns, rows, layout: 'intrinsic', maxWidth: inner, ctx: quiet });
  const orbit = `orbit ${progressBar(phase * 100, { ctx: quiet, width: Math.max(4, Math.min(24, inner - 11)) })}`;
  return box(`${grid}\n${orbit}`, { title: `t = ${t.toFixed(1)} yr`, ctx: quiet });
}

/** Inked lines, newest at the bottom, clipped to the pane. */
export function stream(surface: Surface, x: number, y: number, width: number, height: number, lines: readonly Inked[]): void {
  const shown = lines.slice(Math.max(0, lines.length - height));
  shown.forEach((line, i) => {
    write(surface, x, y + height - shown.length + i, width, line.text, line.ink);
  });
}
