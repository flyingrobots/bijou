// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// After "Noise plane partition with peel animation" by Claudio Esperança
// (Observable), which joins his "Noise plane partition" and "Peel animation"
// notebooks: a finished partition peels away piece by piece, then reassembles.
import { createSurface } from '@flyingrobots/bijou';
import { defineDemo, type Demo } from '../contract.js';
import { stampPanel } from '../panel.js';
import { nextRandom } from '../random.js';
import { colourAt, compose, worldHeight, type Composition } from './noise-partition-geometry.js';
import { launch, place, runTime, PEEL_STYLES, type Flight, type PeelStyle } from './noise-partition-peel-motion.js';
import { createRaster, fillPolygon, paintSubPixels, sampleColour, toRaster } from './noise-partition-raster.js';
import type { Rgb } from './pixels.js';

export interface PeelState {
  /** The seed the composition grew from. */
  readonly origin: number;
  readonly composition: Composition;
  readonly levels: number;
  readonly style: PeelStyle;
  readonly flights: readonly Flight[];
  /** Seconds into the peel loop. */
  readonly clock: number;
  readonly lines: boolean;
  readonly hideUI: boolean;
}

type Kept = Pick<PeelState, 'levels' | 'style' | 'lines' | 'hideUI'>;

const MIN_LEVELS = 1;
const MAX_LEVELS = 16;
/** The original's defaults: 10 levels, x and y scale 2^-11, 0.1 colour variation, 0.7 luminosity, black lines and ground. */
const START_LEVELS = 10;
const SCALE_LOG2 = -11;
const VARIATION = 0.1;
const LUMINOSITY = 0.7;
const BLACK: Rgb = [0, 0, 0];
const START: Kept = { levels: START_LEVELS, style: 'leftToRight', lines: true, hideUI: false };
const STYLE_NAMES: Readonly<Record<PeelStyle, string>> = {
  leftToRight: 'left to right', topToBottom: 'top to bottom', random: 'scattered',
};

function launched(kept: Kept, origin: number, composition: Composition): PeelState {
  const { tree, base, seed, width, height } = composition;
  const [pieces, rng] = colourAt(tree, kept.levels, base, VARIATION, seed);
  const flights = launch(pieces, kept.style, rng, width, height);
  return { levels: kept.levels, style: kept.style, lines: kept.lines, hideUI: kept.hideUI, origin, composition, flights, clock: 0 };
}

/** A new composition grown from `origin`, `height` world units tall. */
export function roll(origin: number, height: number, kept: Kept = START): PeelState {
  return launched(kept, origin, compose(origin, height, SCALE_LOG2, LUMINOSITY));
}

const relevel = (state: PeelState, by: number): PeelState =>
  launched({ ...state, levels: Math.max(MIN_LEVELS, Math.min(MAX_LEVELS, state.levels + by)) }, state.origin, state.composition);

export const partitionPeel: Demo<PeelState> = {
  id: 'partition-peel',
  name: 'Partition Peel',
  description: 'A noise-cut plane peels away piece by piece, tumbling, then reassembles, after Claudio Esperança',
  keys: 'r new composition, + and - levels, a peel direction, s lines, h hides the panel, space pause',
  init: (seed) => roll(seed, 600),
  update(msg, state) {
    if (msg.type === 'resize') {
      const height = worldHeight(msg.width, msg.height);
      return height === state.composition.height ? state : roll(state.origin, height, state);
    }
    if (msg.type === 'pulse') return { ...state, clock: state.clock + msg.dt };
    if (msg.type !== 'key') return state;
    if (msg.key === 'r') return roll(nextRandom(state.origin)[1], state.composition.height, state);
    if (msg.key === '+' || msg.key === '=') return relevel(state, 1);
    if (msg.key === '-') return relevel(state, -1);
    if (msg.key === 'a') {
      const style = PEEL_STYLES[(PEEL_STYLES.indexOf(state.style) + 1) % PEEL_STYLES.length] ?? 'leftToRight';
      return launched({ ...state, style }, state.origin, state.composition);
    }
    if (msg.key === 's') return { ...state, lines: !state.lines };
    return msg.key === 'h' ? { ...state, hideUI: !state.hideUI } : state;
  },
  view(state, { width, height, ctx }) {
    const surface = createSurface(width, height);
    const raster = createRaster(width, height);
    const scale = toRaster(raster, state.composition.width, state.composition.height);
    const t = runTime(state.clock);
    const colours: Rgb[] = [];
    state.flights.forEach((flight, i) => {
      const { map, front } = place(flight, t);
      colours.push(front ? flight.front : flight.back);
      fillPolygon(raster, flight.polygon.map((p) => scale(map(p))), i);
    });
    const line = state.lines ? BLACK : null;
    paintSubPixels(surface, (x, y) => sampleColour(raster, x, y, colours, BLACK, line));
    if (!state.hideUI) {
      stampPanel(surface, [
        '  ***  PARTITION PEEL  ***  ',
        '─',
        `  ${String(state.flights.length)} pieces, ${String(state.levels)} levels`,
        `  peeling ${STYLE_NAMES[state.style]}`,
        '  - R     : New composition',
        '  - + / - : Levels',
        '  - A     : Peel direction',
        '  - S     : Lines',
        '  - H     : Hide panel',
      ], ctx, (free) => ({ x: Math.max(0, Math.min(2, free.x - 2)), y: Math.max(0, free.y - 1) }));
    }
    return surface;
  },
};

export const partitionPeelDemo = defineDemo(partitionPeel);
