// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// After the p5 sketch in "Global mode p5" by Claudio Esperança (Observable): an 11 by 11 grid of
// white cubes on grey, each tumbling by angles that vary across the grid, under a camera that
// circles above them half a degree per frame.
import { createSurface } from '@flyingrobots/bijou';
import { defineDemo, type Demo } from '../contract.js';
import { stampPanel } from '../panel.js';
import { nextRandom } from '../random.js';
import { paintPixels } from './pixels.js';
import { renderBoxes } from './box-grid-raster.js';

export interface BoxGridState {
  /** The original's ang, frameCount * deg / 2, carried forward by pulses. */
  readonly angle: number;
  /** Multiplies the original's half a degree per frame: `+` and `-` double or halve it, from 1/4 to 8. */
  readonly speed: number;
  readonly seed: number;
  readonly hideUI: boolean;
}

const SUPERSAMPLE = 2;
const MIN_SPEED = 0.25;
const MAX_SPEED = 8;
/** Half a degree, the original's step per frame. */
const STEP = Math.PI / 360;
/** p5's background(100). */
const GROUND = 100;
/** The original's ang grows without end; wrap it after 360 turns, a multiple of PI, so nothing jumps. */
const WRAP = Math.PI * 720;

const speedBy = (state: BoxGridState, factor: number): BoxGridState =>
  ({ ...state, speed: Math.max(MIN_SPEED, Math.min(MAX_SPEED, state.speed * factor)) });

export const boxGrid: Demo<BoxGridState> = {
  id: 'box-grid',
  name: 'Tumbling Box Grid',
  description: 'An orbiting camera over 121 lit cubes, each tumbling at its own angle, after Claudio Esperança',
  keys: 'r jump to a new moment, + and - speed, h hides the panel, space pause',
  init: (seed) => ({ angle: 0, speed: 1, seed, hideUI: false }),
  update(msg, state) {
    if (msg.type === 'pulse') return { ...state, angle: (state.angle + STEP * state.speed * msg.dt * 60) % WRAP };
    if (msg.type !== 'key') return state;
    if (msg.key === 'r') {
      const [u, seed] = nextRandom(state.seed);
      return { ...state, angle: u * WRAP, seed };
    }
    if (msg.key === '+' || msg.key === '=') return speedBy(state, 2);
    if (msg.key === '-') return speedBy(state, 0.5);
    return msg.key === 'h' ? { ...state, hideUI: !state.hideUI } : state;
  },
  view(state, { width, height, ctx }) {
    const surface = createSurface(width, height);
    const w = width * SUPERSAMPLE;
    const h = height * 2 * SUPERSAMPLE;
    const buffer = renderBoxes(state.angle, w, h);
    paintPixels(surface, (x, y) => {
      const grey = buffer[Math.floor(y * SUPERSAMPLE) * w + Math.floor(x * SUPERSAMPLE)] ?? -1;
      const level = grey < 0 ? GROUND : grey;
      return [level, level, level];
    }, SUPERSAMPLE);
    if (!state.hideUI) {
      stampPanel(surface, [
        '  ***  TUMBLING BOX GRID  ***  ',
        '─',
        `  11 x 11 cubes, speed ${String(state.speed)}x`,
        '  - R     : New moment',
        '  - + / - : Speed',
        '  - H     : Hide panel',
      ], ctx, (free) => ({ x: Math.max(0, Math.min(2, free.x - 2)), y: Math.max(0, free.y - 1) }));
    }
    return surface;
  },
};

export const boxGridDemo = defineDemo(boxGrid);
