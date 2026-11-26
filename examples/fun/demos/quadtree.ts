// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// After "037 Shapes on a QuadTree" by Saneef Ansari (Observable): biased random points
// split a square into quadtree quadrants, each filled with a circle, a square, a slash
// or nothing, in a chromotome palette. The original is static; this one recomposes.
import { createSurface } from '@flyingrobots/bijou';
import { defineDemo, type Demo } from '../contract.js';
import { stampPanel } from '../panel.js';
import { nextRandom } from '../random.js';
import { QUAD_PALETTES } from './palettes.js';
import { hex, paintPixels, type Rgb } from './pixels.js';
import { layout, type Layout } from './quadtree-layout.js';
import { GROUND, rasterize, STROKE, type Layers } from './quadtree-raster.js';

export interface QuadtreeState {
  /** The stream new compositions draw from. */
  readonly seed: number;
  /** The seed of this composition's points and shapes, kept so a slider change lays out the same draw again. */
  readonly layoutSeed: number;
  readonly palette: number;
  readonly points: number;
  readonly maxLevels: number;
  readonly layout: Layout;
  readonly layers: Layers;
  readonly auto: boolean;
  readonly sinceRoll: number;
  readonly hideUI: boolean;
}

const AUTO_SECONDS = 5;
const MIN_POINTS = 10;
const MAX_POINTS = 150;
const POINT_STEP = 10;
const MIN_LEVELS = 2;
const MAX_LEVELS = 7;
/** The original's "Max Object in QuadTree Quadrant" slider default. */
const MAX_OBJECTS = 10;
const SUPERSAMPLE = 2;
const FALLBACK = { name: 'mono', colors: ['#1a1a1a'], background: '#f2f2f2', stroke: '#0d0d0d' };

const paletteOf = (index: number) => QUAD_PALETTES[index] ?? QUAD_PALETTES[0] ?? FALLBACK;
/** The original's shape colours: the palette without its background. */
const shapeColours = (index: number): readonly string[] => {
  const palette = paletteOf(index);
  const colours = palette.colors.filter((c) => c !== palette.background);
  return colours.length > 0 ? colours : [palette.stroke];
};

/** Lay out the same seed again, as a slider change does in the original. */
function relayout(state: Omit<QuadtreeState, 'layout'>): QuadtreeState {
  const options = { points: state.points, maxObjects: MAX_OBJECTS, maxLevels: state.maxLevels, fills: shapeColours(state.palette).length };
  const [next] = layout(state.layoutSeed, options);
  return { ...state, layout: next };
}

/** The original's Randomize: a new palette, new points and new shape weights. */
export function roll(seed: number, keep?: Pick<QuadtreeState, 'points' | 'maxLevels' | 'layers' | 'auto' | 'hideUI'>): QuadtreeState {
  const [a, s1] = nextRandom(seed);
  const [b, s2] = nextRandom(s1);
  return relayout({
    points: keep?.points ?? 100,
    maxLevels: keep?.maxLevels ?? 4,
    layers: keep?.layers ?? { points: false, quads: false, shapes: true },
    auto: keep?.auto ?? true,
    hideUI: keep?.hideUI ?? false,
    seed: s2, layoutSeed: Math.floor(b * 0x100000000), sinceRoll: 0,
    palette: Math.floor(a * QUAD_PALETTES.length),
  });
}

const again = (state: QuadtreeState, change: Partial<Omit<QuadtreeState, 'layout'>>): QuadtreeState =>
  relayout({ ...state, ...change });

const toggle = (state: QuadtreeState, layer: keyof Layers): QuadtreeState =>
  ({ ...state, layers: { ...state.layers, [layer]: !state.layers[layer] } });

export const quadtree: Demo<QuadtreeState> = {
  id: 'quadtree-shapes',
  name: 'Shapes on a QuadTree',
  description: 'Quadtree quadrants of circles, squares and slashes in a chromotome palette, after Saneef Ansari',
  keys: 'r recompose, + and - points, l levels, s shapes, g quads, p points, a auto, h hides the panel, space pause',
  init: (seed) => roll(seed),
  update(msg, state) {
    if (msg.type === 'pulse') {
      if (!state.auto) return state;
      const sinceRoll = state.sinceRoll + msg.dt;
      return sinceRoll >= AUTO_SECONDS ? roll(state.seed, state) : { ...state, sinceRoll };
    }
    if (msg.type !== 'key') return state;
    switch (msg.key) {
      case 'r': return roll(state.seed, state);
      case '+': case '=': return again(state, { points: Math.min(MAX_POINTS, state.points + POINT_STEP) });
      case '-': return again(state, { points: Math.max(MIN_POINTS, state.points - POINT_STEP) });
      case 'l': return again(state, { maxLevels: state.maxLevels >= MAX_LEVELS ? MIN_LEVELS : state.maxLevels + 1 });
      case 's': return toggle(state, 'shapes');
      case 'g': return toggle(state, 'quads');
      case 'p': return toggle(state, 'points');
      case 'a': return { ...state, auto: !state.auto, sinceRoll: 0 };
      case 'h': return { ...state, hideUI: !state.hideUI };
      default: return state;
    }
  },
  view(state, { width, height, elapsed, ctx }) {
    const surface = createSurface(width, height);
    const palette = paletteOf(state.palette);
    const ground: Rgb = hex(palette.background);
    const stroke: Rgb = hex(palette.stroke);
    const fills = shapeColours(state.palette).map(hex);
    const w = width * SUPERSAMPLE;
    const h = height * 2 * SUPERSAMPLE;
    const raster = rasterize(state.layout, state.layers, w, h, SUPERSAMPLE, elapsed);
    paintPixels(surface, (x, y) => {
      const at = raster[Math.floor(y * SUPERSAMPLE) * w + Math.floor(x * SUPERSAMPLE)] ?? GROUND;
      return at === GROUND ? ground : at === STROKE ? stroke : (fills[at] ?? ground);
    }, SUPERSAMPLE);
    if (!state.hideUI) {
      const on = (flag: boolean): string => (flag ? 'on' : 'off');
      stampPanel(surface, [
        '  ***  SHAPES ON A QUADTREE  ***  ',
        '─',
        `  ${String(state.layout.leaves.length)} quads, ${String(state.points)} points, ${String(state.maxLevels)} levels`,
        `  palette ${palette.name}, auto ${on(state.auto)}`,
        `  shapes ${on(state.layers.shapes)}, quads ${on(state.layers.quads)}, points ${on(state.layers.points)}`,
        '  - R : Recompose   - + / - : Points',
        '  - L : Levels      - A     : Auto',
        '  - S G P : Shapes, quads, points',
        '  - H : Hide panel',
      ], ctx, (free) => ({ x: Math.max(0, Math.min(2, free.x - 2)), y: Math.max(0, free.y - 1) }));
    }
    return surface;
  },
};

export const quadtreeDemo = defineDemo(quadtree);
