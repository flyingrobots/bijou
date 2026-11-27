// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// After "Line Integral Convolution" by stwind (Observable): a vector field made visible by
// convolving noise along its streamlines while the noise itself is advected along the field,
// coloured by speed through viridis. The field formulas, the two passes and the colour map are the
// original's; the WebGL passes run per pixel on the CPU.
import { createSurface } from '@flyingrobots/bijou';
import { defineDemo, type Demo } from '../contract.js';
import { stampPanel } from '../panel.js';
import { nextRandom } from '../random.js';
import { DEFAULT_FIELD, LIC_FIELDS, type LicField } from './lic-fields.js';
import { advect, licPixel, seedFlow, type Flow } from './lic-sim.js';
import { paintPixels, type Rgb } from './pixels.js';

export interface LicState {
  readonly seed: number;
  readonly field: number;
  /** The convolution length in samples, the original's L. */
  readonly length: number;
  readonly flow: Flow;
  /** 60 Hz frames owed to the advection. */
  readonly owed: number;
  readonly hideUI: boolean;
}

const DEFAULT_LENGTH = 12;
const MIN_LENGTH = 2;
const MAX_LENGTH = 32;
/** At most this many advection steps per pulse, so a long stall does not stall again. */
const MAX_STEPS = 3;
/** The picture before the host reports the pane: 80 by 24 cells, two pixels a cell tall. */
const DEFAULT_COLS = 80;
const DEFAULT_ROWS = 24;
const BLACK: Rgb = [0, 0, 0];

const fieldOf = (state: LicState): LicField => LIC_FIELDS[state.field] ?? LIC_FIELDS[0] ?? { name: 'none', h: () => 1, range: () => [0, 1], at: () => [0, 0] };

/** Fresh noise at the given size: the hash's time starts at a point picked from the seed. */
function reseed(state: Omit<LicState, 'flow'>, width: number, height: number): LicState {
  const [r, seed] = nextRandom(state.seed);
  return { ...state, seed, owed: 0, flow: seedFlow(width, height, Math.floor(r * 4096)) };
}

/** Advance the advection by the 60 Hz frames `dt` seconds covers. */
function pulse(state: LicState, dt: number): LicState {
  const owed = state.owed + Math.max(0, dt) * 60;
  const steps = Math.min(MAX_STEPS, Math.floor(owed));
  let flow = state.flow;
  for (let i = 0; i < steps; i += 1) flow = advect(flow, fieldOf(state));
  return { ...state, flow, owed: steps === MAX_STEPS ? 0 : owed - steps };
}

/** The convolved picture, one colour per flow pixel. */
function render(state: LicState): readonly Rgb[] {
  const { width: w, height: h } = state.flow;
  const field = fieldOf(state);
  return Array.from({ length: w * h }, (_, i) => licPixel(state.flow, field, state.length, i % w, Math.floor(i / w)));
}

export const lic: Demo<LicState> = {
  id: 'line-integral-convolution',
  name: 'Line Integral Convolution',
  description: 'Noise smeared along the streamlines of a vector field and carried by it, after stwind',
  keys: 'f next field, r new noise, + and - convolution length, h hides the panel, space pause',
  init: (seed) => reseed({ seed, field: DEFAULT_FIELD, length: DEFAULT_LENGTH, owed: 0, hideUI: false }, DEFAULT_COLS, DEFAULT_ROWS * 2),
  update(msg, state) {
    if (msg.type === 'resize') return reseed(state, Math.max(1, msg.width), Math.max(1, msg.height * 2));
    if (msg.type === 'pulse') return pulse(state, msg.dt);
    if (msg.type !== 'key') return state;
    const { width, height } = state.flow;
    if (msg.key === 'r') return reseed(state, width, height);
    if (msg.key === 'f') return reseed({ ...state, field: (state.field + 1) % LIC_FIELDS.length }, width, height);
    if (msg.key === '+' || msg.key === '=') return { ...state, length: Math.min(MAX_LENGTH, state.length + 2) };
    if (msg.key === '-') return { ...state, length: Math.max(MIN_LENGTH, state.length - 2) };
    return msg.key === 'h' ? { ...state, hideUI: !state.hideUI } : state;
  },
  view(state, { width, height, ctx }) {
    const surface = createSurface(width, height);
    const { width: w, height: h } = state.flow;
    const picture = render(state);
    paintPixels(surface, (x, y) => {
      const gx = Math.min(w - 1, Math.floor((x * w) / width));
      const gy = Math.min(h - 1, Math.floor((y * h) / (height * 2)));
      return picture[gy * w + gx] ?? BLACK;
    });
    if (!state.hideUI) {
      stampPanel(surface, [
        '  ***  LINE INTEGRAL CONVOLUTION  ***  ',
        '─',
        `  field ${fieldOf(state).name}, ${String(state.length)} samples`,
        `  ${String(w)} x ${String(h)} pixels of advected noise`,
        '  - F     : Next field',
        '  - R     : New noise',
        '  - + / - : Convolution length',
        '  - H     : Hide panel',
      ], ctx, (free) => ({ x: Math.max(0, Math.min(2, free.x - 2)), y: Math.max(0, free.y - 1) }));
    }
    return surface;
  },
};

export const licDemo = defineDemo(lic);
