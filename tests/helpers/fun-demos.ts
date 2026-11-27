import { createHash } from 'node:crypto';
import { createTestContext, type TestContext } from '@flyingrobots/bijou/adapters/test';
import type { Cell, Surface } from '@flyingrobots/bijou';
import type { DemoEntry, DemoMsg, Session } from '../../examples/fun/contract.js';
import { catalog, loadDemos } from '../../examples/fun/registry.js';
import { fluidScript } from './fun-fluid.js';
import { threeDMiddle } from './fun-3d.js';

/** The demos that draw a font. They need the font's bytes and have helpers and tests of their own (`fun-font.ts`). */
export const FONT_IDS = ['font-renderer', 'text-cylinder'] as const;
const drawsFont = (id: string): boolean => FONT_IDS.some((font) => font === id);

/** The demos that need no font, loaded from the catalog once for every test file that lists them. */
export const demos: readonly DemoEntry[] = await loadDemos(
  { font: () => Promise.reject(new Error('these tests supply no font')) },
  catalog.filter((entry) => !drawsFont(entry.id)),
);

export const SEED = 1888;
export const DT = 1 / 30;

export function funContext(columns: number, rows: number): TestContext {
  return createTestContext({ mode: 'interactive', runtime: { columns, rows } });
}

/** Every cell, read through `get`: the `cells` array does not follow `setRGB` writes into the packed buffer. */
export function cellsOf(surface: Surface): Cell[] {
  return Array.from({ length: surface.width * surface.height }, (_, i) => surface.get(i % surface.width, Math.floor(i / surface.width)));
}

export function textOf(surface: Surface): string {
  return cellsOf(surface).map((cell) => cell.char).join('');
}

export function digest(surface: Surface): string {
  return createHash('sha256').update(JSON.stringify(cellsOf(surface))).digest('hex');
}

export function feed(session: Session, messages: readonly DemoMsg[]): Session {
  return messages.reduce((current, msg) => current.update(msg), session);
}

export function pulses(count: number): DemoMsg[] {
  return Array.from({ length: count }, () => ({ type: 'pulse', dt: DT }));
}

export function mountEntry(entry: DemoEntry): Session {
  return entry.mount(SEED);
}

/** A small seeded generator for the fuzz test: never the clock, never Math.random. */
export function lcg(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

export function byId(id: string): DemoEntry {
  const found = demos.find((entry) => entry.id === id);
  if (found === undefined) throw new Error(`no demo named ${id}`);
  return found;
}

/** The messages the recorded frames are made from: 30 pulses, the demo's own input, 30 more pulses. */
export function frameScript(id: string, width: number, height: number): DemoMsg[] {
  const own = fluidScript(id, { width, height });
  if (own !== undefined) return own;
  if (id === 'starfield') {
    return [{ type: 'resize', width, height }, ...pulses(30), { type: 'pointer', col: Math.floor(width / 3), row: Math.floor(height / 2) }, ...pulses(30)];
  }
  const generative: Readonly<Record<string, string>> = {
    'directional-tiles': '+', 'doyle-spiral': ']', 'deformed-rectangles': 's', 'seamless-squares': 'r', 'truchet-tiles': 'r',
    'some-triangles': 'r', 'quadtree-shapes': 'r', 'dancing-noise': 'c', 'seeded-needles': 'r', 'xor-mod-n': '+', 'box-grid': '+',
    'lenses': 'v', 'adaptive-contours': ']', 'endless-loop': 'r',
    'bitmap-generator': 'r', 'voronoi-incircles': 't', 'line-integral-convolution': 'f', 'generative-painting': 'r',
    'noise-trails': 'r', 'dashed-rings': 'r', 'oil-brushstrokes': 'c', 'periodic-tilings': ']',
    'gargantua': '+', 'shatter': 's', 'butterfly': '.', 'lenia': 'c', 'four-ways': '+', 'noise-plane-partition': 'r', 'partition-peel': 'a',
  };
  const generativeKey = generative[id];
  if (generativeKey !== undefined) return [...pulses(30), { type: 'key', key: generativeKey }, ...pulses(30)];
  const middle: DemoMsg[] = id === 'wormhole'
    ? [{ type: 'key', key: 'm' }]
    : id === 'metaballs' ? [{ type: 'pointer', col: Math.floor(width / 3), row: Math.floor(height / 2) }] : threeDMiddle(id, width, height);
  return [...pulses(30), ...middle, ...pulses(30)];
}
