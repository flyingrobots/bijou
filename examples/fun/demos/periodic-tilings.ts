// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// After "Synthesizing periodic tilings of the plane" by Claudio Esperança (Observable), reproducing the technique of
// A. Medeiros e Sá, L. H. de Figueiredo and J. E. Soto Sánchez for tiling the plane with regular polygons, from the
// Galebach and Sá e Sá databases: each pattern's patch, translated over the plane, slowly turning and sliding.
import { createSurface } from '@flyingrobots/bijou';
import { defineDemo, type Demo } from '../contract.js';
import { stampPanel } from '../panel.js';
import { nextRandom } from '../random.js';
import { DATABASES } from './periodic-tilings-data.js';
import { patchOf } from './periodic-tilings-geometry.js';
import { SCHEMES, tilingPixel } from './periodic-tilings-render.js';
import { paintPixels } from './pixels.js';

export interface PeriodicTilingsState {
  readonly seed: number;
  readonly database: number;
  readonly pattern: number;
  /** Edge length in picture pixels. */
  readonly edge: number;
  readonly scheme: number;
  readonly colorShift: number;
  /** Rotation in degrees and translation as a fraction of t1 + t2, as the notebook animates them. */
  readonly angle: number;
  readonly shift: number;
  readonly hideUI: boolean;
}

const MIN_EDGE = 4;
const MAX_EDGE = 30;
/** The notebook's animation steps per frame: 0.1 degrees of turn and 0.005 of t1 + t2. */
const TURN = 0.1;
const SLIDE = 0.005;
/** The pattern the notebook falls back to in each database when the chosen one is missing. */
const FALLBACK: readonly string[] = ['t1001', 'HNQT'];

function databaseAt(index: number) {
  return DATABASES[((index % DATABASES.length) + DATABASES.length) % DATABASES.length] ?? DATABASES[0];
}

function recordOf(state: PeriodicTilingsState) {
  const patterns = databaseAt(state.database)?.patterns ?? [];
  return patterns[((state.pattern % patterns.length) + patterns.length) % patterns.length];
}

function step(state: PeriodicTilingsState, by: number): PeriodicTilingsState {
  const count = databaseAt(state.database)?.patterns.length ?? 1;
  return { ...state, pattern: (state.pattern + by + count) % count };
}

function switchDatabase(state: PeriodicTilingsState): PeriodicTilingsState {
  const database = (state.database + 1) % DATABASES.length;
  const patterns = databaseAt(database)?.patterns ?? [];
  return { ...state, database, pattern: Math.max(0, patterns.findIndex((p) => p.name === FALLBACK[database])) };
}

/** A new tiling from the seed: a database, a pattern, a palette and a colour shift. */
function roll(state: PeriodicTilingsState): PeriodicTilingsState {
  const [a, s1] = nextRandom(state.seed);
  const [b, s2] = nextRandom(s1);
  const [c, s3] = nextRandom(s2);
  const [d, s4] = nextRandom(s3);
  const database = Math.floor(a * DATABASES.length);
  const count = databaseAt(database)?.patterns.length ?? 1;
  return {
    ...state, seed: s4, database, pattern: Math.floor(b * count),
    scheme: Math.floor(c * SCHEMES.length), colorShift: Math.floor(d * 12),
  };
}

/** The notebook's opening view: Sá e Sá's HNR in Pastel2, colour shift 1. */
function initial(seed: number): PeriodicTilingsState {
  const database = DATABASES.findIndex((db) => db.name === 'Sá e Sá');
  const patterns = databaseAt(database)?.patterns ?? [];
  return {
    seed, database: Math.max(0, database), pattern: Math.max(0, patterns.findIndex((p) => p.name === 'HNR')),
    edge: 10, scheme: 0, colorShift: 1, angle: 0, shift: 0, hideUI: false,
  };
}

export const periodicTilings: Demo<PeriodicTilingsState> = {
  id: 'periodic-tilings',
  name: 'Periodic Tilings',
  description: 'Periodic tilings of regular polygons synthesized from seeds and translations, after Claudio Esperança',
  keys: '[ and ] pattern, d database, r new tiling, c shift colours, p palette, + and - edge, h hides the panel, space pause',
  init: initial,
  update(msg, state) {
    if (msg.type === 'pulse') {
      const frames = msg.dt * 60;
      return { ...state, angle: (state.angle + TURN * frames) % 360, shift: (state.shift + SLIDE * frames) % 1 };
    }
    if (msg.type !== 'key') return state;
    if (msg.key === ']') return step(state, 1);
    if (msg.key === '[') return step(state, -1);
    if (msg.key === 'd') return switchDatabase(state);
    if (msg.key === 'r') return roll(state);
    if (msg.key === 'c') return { ...state, colorShift: state.colorShift + 1 };
    if (msg.key === 'p') return { ...state, scheme: (state.scheme + 1) % SCHEMES.length };
    if (msg.key === '+' || msg.key === '=') return { ...state, edge: Math.min(MAX_EDGE, state.edge + 2) };
    if (msg.key === '-') return { ...state, edge: Math.max(MIN_EDGE, state.edge - 2) };
    return msg.key === 'h' ? { ...state, hideUI: !state.hideUI } : state;
  },
  view(state, { width, height, ctx }) {
    const surface = createSurface(width, height);
    const record = recordOf(state);
    if (record === undefined) return surface;
    const patch = patchOf(record);
    paintPixels(surface, tilingPixel(patch, state, width, height * 2), 2);
    if (!state.hideUI) {
      const database = databaseAt(state.database)?.name ?? '';
      stampPanel(surface, [
        '  ***  PERIODIC TILINGS  ***  ',
        '─',
        `  ${database}: ${record.name}, ${String(patch.faces.length)} faces per patch`,
        `  ${SCHEMES[state.scheme]?.name ?? ''}, edge ${String(state.edge)} px`,
        '  - [ / ]  : Pattern',
        '  - D      : Database',
        '  - R      : New tiling',
        '  - C / P  : Shift colours, palette',
        '  - + / -  : Edge length',
        '  - H      : Hide panel',
      ], ctx, (free) => ({ x: Math.max(0, Math.min(2, free.x - 2)), y: Math.max(0, free.y - 1) }));
    }
    return surface;
  },
};

export const periodicTilingsDemo = defineDemo(periodicTilings);
