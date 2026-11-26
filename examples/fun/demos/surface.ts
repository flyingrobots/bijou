// Licensed under the Apache License, Version 2.0, like the rest of this repository.
import { createSurface } from '@flyingrobots/bijou';
import { defineDemo, type Demo } from '../contract.js';
import { stampPanel } from '../panel.js';
import { paintPixels } from './pixels.js';
import { START_ORBIT, type Orbit } from './surface-math.js';
import { BACKGROUND, renderSurface } from './surface-raster.js';

export interface SurfaceState {
  /** Where the clock starts: the original reads the wall clock, a demo reads its seed. */
  readonly start: number;
  /** The pointer in pane cells orbits the camera; null lets it turn on its own. */
  readonly pointer: { readonly col: number; readonly row: number } | null;
  readonly hideUI: boolean;
}

const SUPERSAMPLE = 2;
/** Radians per second the camera turns on its own. */
const SPIN = 0.12;

/** The camera for this frame: pointer position maps to a turn and a tilt, like dragging the original's OrbitControls. */
export function orbitAt(state: SurfaceState, elapsed: number, width: number, height: number): Orbit {
  if (state.pointer === null) return { ...START_ORBIT, azimuth: START_ORBIT.azimuth + elapsed * SPIN };
  const u = Math.max(0, Math.min(1, state.pointer.col / Math.max(1, width - 1)));
  const v = Math.max(0, Math.min(1, state.pointer.row / Math.max(1, height - 1)));
  return {
    ...START_ORBIT,
    azimuth: START_ORBIT.azimuth + (u - 0.5) * Math.PI * 2,
    elevation: Math.max(0.05, Math.min(1.45, START_ORBIT.elevation + (0.5 - v) * 1.2)),
  };
}

export const surface: Demo<SurfaceState> = {
  id: 'wave-surface',
  name: '3D Wave Surface',
  description: 'A lit 3D surface of ripple, spiral and chaotic waves cross-fading, after laotzunami\'s Three.js graph',
  keys: 'move the pointer to orbit the camera, h hides the panel, space pause',
  init: (seed) => ({ start: seed % 1000, pointer: null, hideUI: false }),
  update(msg, state) {
    if (msg.type === 'pointer') return { ...state, pointer: { col: msg.col, row: msg.row } };
    if (msg.type === 'pointer-leave') return { ...state, pointer: null };
    if (msg.type === 'key' && msg.key === 'h') return { ...state, hideUI: !state.hideUI };
    return state;
  },
  view(state, { width, height, elapsed, ctx }) {
    const out = createSurface(width, height);
    const w = width * SUPERSAMPLE;
    const h = height * 2 * SUPERSAMPLE;
    const mesh = Math.max(41, Math.min(101, Math.round(w / 4)));
    const colours = renderSurface(orbitAt(state, elapsed, width, height), state.start + elapsed, w, h, mesh);
    paintPixels(out, (x, y) => colours[Math.floor(y * SUPERSAMPLE) * w + Math.floor(x * SUPERSAMPLE)] ?? BACKGROUND, SUPERSAMPLE);
    if (!state.hideUI) {
      stampPanel(out, [
        '  ***  3D WAVE SURFACE  ***  ',
        '─',
        '  ripple, spiral and inverse waves',
        '  - POINTER : Orbit the camera',
        '  - H       : Hide panel',
      ], ctx, (free) => ({ x: Math.max(0, Math.min(2, free.x - 2)), y: Math.max(0, free.y - 1) }));
    }
    return out;
  },
};

export const surfaceDemo = defineDemo(surface);
