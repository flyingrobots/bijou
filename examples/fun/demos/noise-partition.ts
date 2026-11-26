// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// After "Noise plane partition" by Claudio Esperança (Observable): the plane cut
// again and again along the flow lines of a noise field, each level of cuts
// fading in, freshly coloured, over the last.
import { createSurface } from '@flyingrobots/bijou';
import { defineDemo, type Demo } from '../contract.js';
import { stampPanel } from '../panel.js';
import { nextRandom } from '../random.js';
import { colourAt, compose, toRgb, worldHeight, type Composition, type Piece } from './noise-partition-geometry.js';
import { createRaster, fillPolygon, paintSubPixels, sampleColour, toRaster, type Raster } from './noise-partition-raster.js';
import { mix, type Rgb } from './pixels.js';

export interface PartitionState {
  /** The seed the composition grew from. */
  readonly origin: number;
  readonly composition: Composition;
  readonly levels: number;
  /** Layer 0 is the ground; layer k is the plane cut k levels deep. */
  readonly layers: readonly (readonly Piece[])[];
  /** Seconds since the composition began fading in. */
  readonly clock: number;
  readonly lines: boolean;
  readonly hideUI: boolean;
}

type Kept = Pick<PartitionState, 'levels' | 'lines' | 'hideUI'>;

const MIN_LEVELS = 1;
const MAX_LEVELS = 16;
/** The original's defaults: 10 levels, 100 frames a level at 60 frames a second, x and y scale 2^-9, 0.1 colour variation. */
const START_LEVELS = 10;
const LEVEL_SECONDS = 100 / 60;
const SCALE_LOG2 = -9;
const VARIATION = 0.1;
const LUMINOSITY = 0.7;
/** How long the finished partition holds before a new one grows. */
const HOLD_SECONDS = 4;
const LINE: Rgb = [0, 0, 0];

function layered(kept: Kept, origin: number, composition: Composition): PartitionState {
  const { tree, base } = composition;
  let rng = composition.seed;
  const layers: (readonly Piece[])[] = [[{ polygon: tree.polygon, colour: base }]];
  for (let level = 1; level <= kept.levels; level += 1) {
    const [pieces, next] = colourAt(tree, level, base, VARIATION, rng);
    layers.push(pieces);
    rng = next;
  }
  return { levels: kept.levels, lines: kept.lines, hideUI: kept.hideUI, origin, composition, layers, clock: 0 };
}

/** A new composition grown from `origin`, `height` world units tall. */
export function roll(origin: number, height: number, kept: Kept = { levels: START_LEVELS, lines: true, hideUI: false }): PartitionState {
  return layered(kept, origin, compose(origin, height, SCALE_LOG2, LUMINOSITY));
}

const following = (state: PartitionState): number => nextRandom(state.origin)[1];

const relevel = (state: PartitionState, by: number): PartitionState =>
  layered({ ...state, levels: Math.max(MIN_LEVELS, Math.min(MAX_LEVELS, state.levels + by)) }, state.origin, state.composition);

interface Layer {
  readonly raster: Raster;
  readonly colours: readonly Rgb[];
}

function rasterize(pieces: readonly Piece[], composition: Composition, columns: number, rows: number): Layer {
  const raster = createRaster(columns, rows);
  const scale = toRaster(raster, composition.width, composition.height);
  pieces.forEach((piece, i) => {
    fillPolygon(raster, piece.polygon.map(scale), i);
  });
  return { raster, colours: pieces.map((piece) => toRgb(piece.colour)) };
}

export const noisePartition: Demo<PartitionState> = {
  id: 'noise-plane-partition',
  name: 'Noise Plane Partition',
  description: 'The plane cut again and again along noise flow lines, level by level, after Claudio Esperança',
  keys: 'r new composition, + and - levels, s lines, h hides the panel, space pause',
  init: (seed) => roll(seed, 600),
  update(msg, state) {
    if (msg.type === 'resize') {
      const height = worldHeight(msg.width, msg.height);
      return height === state.composition.height ? state : roll(state.origin, height, state);
    }
    if (msg.type === 'pulse') {
      const clock = state.clock + msg.dt;
      if (clock < state.levels * LEVEL_SECONDS + HOLD_SECONDS) return { ...state, clock };
      return roll(following(state), state.composition.height, state);
    }
    if (msg.type !== 'key') return state;
    if (msg.key === 'r') return roll(following(state), state.composition.height, state);
    if (msg.key === '+' || msg.key === '=') return relevel(state, 1);
    if (msg.key === '-') return relevel(state, -1);
    if (msg.key === 's') return { ...state, lines: !state.lines };
    return msg.key === 'h' ? { ...state, hideUI: !state.hideUI } : state;
  },
  view(state, { width, height, ctx }) {
    const surface = createSurface(width, height);
    const step = Math.min(state.levels, Math.floor(state.clock / LEVEL_SECONDS));
    const alpha = Math.min(1, state.clock / LEVEL_SECONDS - step);
    const ground = toRgb(state.composition.base);
    const line = state.lines ? LINE : null;
    const under = rasterize(state.layers[step] ?? [], state.composition, width, height);
    const over = step < state.levels ? rasterize(state.layers[step + 1] ?? [], state.composition, width, height) : null;
    paintSubPixels(surface, (x, y) => {
      const below = sampleColour(under.raster, x, y, under.colours, ground, line);
      return over === null ? below : mix(below, sampleColour(over.raster, x, y, over.colours, ground, line), alpha);
    });
    if (!state.hideUI) {
      const pieces = state.layers[Math.min(state.levels, step + 1)]?.length ?? 0;
      stampPanel(surface, [
        '  ***  NOISE PLANE PARTITION  ***  ',
        '─',
        `  level ${String(Math.min(state.levels, step + 1))} of ${String(state.levels)}, ${String(pieces)} pieces`,
        '  - R     : New composition',
        '  - + / - : Levels',
        '  - S     : Lines',
        '  - H     : Hide panel',
      ], ctx, (free) => ({ x: Math.max(0, Math.min(2, free.x - 2)), y: Math.max(0, free.y - 1) }));
    }
    return surface;
  },
};

export const noisePartitionDemo = defineDemo(noisePartition);
