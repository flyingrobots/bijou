// Licensed under the Apache License, Version 2.0, like the rest of this repository.
import { createSurface } from '@flyingrobots/bijou';
import { defineDemo, type Demo } from '../contract.js';
import { stampPanel } from '../panel.js';
import { buildRayTable, type RayTable } from './gargantua-geodesic.js';
import { createSky, type Sky } from './gargantua-sky.js';
import { cameraAt, traceRay, type Camera, type Scene } from './gargantua-trace.js';
import { createNoise3 } from './noise.js';
import { paintPixels } from './pixels.js';

export interface GargantuaState {
  readonly sky: Sky;
  /** Seeds the disk's turbulence. */
  readonly noiseSeed: number;
  /** Index into DISTANCES; the table holds the orbits for that distance. */
  readonly zoom: number;
  readonly table: RayTable;
  /** The pointer in pane cells orbits the camera; null lets it drift round on its own. */
  readonly pointer: { readonly col: number; readonly row: number } | null;
  readonly doppler: boolean;
  readonly hideUI: boolean;
}

/** Camera distances from the hole, in units of M (the Schwarzschild radius is 2). */
export const DISTANCES: readonly number[] = [30, 36, 44, 54, 66, 82, 100];
const START_ZOOM = 3;
/** Half the picture's longer side, as the tangent of the angle it spans. */
const TAN_HALF = 0.6;
/** Radians per second the camera drifts round when no pointer steers it. */
const DRIFT = 0.12;
/** Just above the disk's plane, so its far side shows lensed over and under the shadow. */
const BASE_ELEVATION = 0.12;

/** The camera for this frame: across the pane turns it round the hole, down the pane tilts it over or under the disk. */
export function cameraFor(state: GargantuaState, elapsed: number, width: number, height: number): Camera {
  if (state.pointer === null) return cameraAt(elapsed * DRIFT, BASE_ELEVATION + 0.07 * Math.sin(elapsed * 0.21));
  const u = Math.max(0, Math.min(1, state.pointer.col / Math.max(1, width - 1)));
  const v = Math.max(0, Math.min(1, state.pointer.row / Math.max(1, height - 1)));
  return cameraAt((u - 0.5) * Math.PI * 2, Math.max(-1.4, Math.min(1.4, BASE_ELEVATION + (0.5 - v) * 2.6)));
}

const zoomTo = (state: GargantuaState, zoom: number): GargantuaState => {
  const next = Math.max(0, Math.min(DISTANCES.length - 1, zoom));
  if (next === state.zoom) return state;
  return { ...state, zoom: next, table: buildRayTable(DISTANCES[next] ?? 54) };
};

const degrees = (radians: number): string => `${String(Math.round((radians * 180) / Math.PI))}°`;

export const gargantua: Demo<GargantuaState> = {
  id: 'gargantua',
  name: 'Gargantua',
  description: 'A raytraced Schwarzschild black hole: lensed accretion disk, photon ring, shadow and bent stars',
  keys: 'move the pointer to orbit, + and - move closer or farther, d Doppler beaming, h hides the panel, space pause',
  init(seed) {
    const [sky, next] = createSky(seed);
    return {
      sky, noiseSeed: next, zoom: START_ZOOM, table: buildRayTable(DISTANCES[START_ZOOM] ?? 54),
      pointer: null, doppler: true, hideUI: false,
    };
  },
  update(msg, state) {
    if (msg.type === 'pointer') return { ...state, pointer: { col: msg.col, row: msg.row } };
    if (msg.type === 'pointer-leave') return { ...state, pointer: null };
    if (msg.type !== 'key') return state;
    if (msg.key === '+' || msg.key === '=') return zoomTo(state, state.zoom - 1);
    if (msg.key === '-' || msg.key === '_') return zoomTo(state, state.zoom + 1);
    if (msg.key === 'd') return { ...state, doppler: !state.doppler };
    return msg.key === 'h' ? { ...state, hideUI: !state.hideUI } : state;
  },
  view(state, { width, height, elapsed, ctx }) {
    const out = createSurface(width, height);
    const camera = cameraFor(state, elapsed, width, height);
    const scene: Scene = {
      camera, table: state.table, sky: state.sky, noise: createNoise3(state.noiseSeed), time: elapsed, doppler: state.doppler,
    };
    const w = width;
    const h = height * 2;
    const scale = TAN_HALF / (Math.max(w, h) / 2);
    paintPixels(out, (x, y) => traceRay(scene, (x - w / 2) * scale, (h / 2 - y) * scale), width * height <= 4000 ? 2 : 1);
    if (!state.hideUI) {
      stampPanel(out, [
        '  ***  GARGANTUA  ***  ',
        '─',
        `  Distance    : ${String(state.table.distance)} M`,
        `  Inclination : ${degrees(Math.PI / 2 - Math.asin(camera.out[1]))}`,
        `  Doppler     : ${state.doppler ? 'on' : 'off'}`,
        '─',
        '  - POINTER : Orbit the camera',
        '  - + / -   : Closer / farther',
        '  - D       : Doppler beaming',
        '  - H       : Hide panel',
      ], ctx, (free) => ({ x: Math.max(0, Math.min(2, free.x - 2)), y: Math.max(0, free.y - 1) }));
    }
    return out;
  },
};

export const gargantuaDemo = defineDemo(gargantua);
