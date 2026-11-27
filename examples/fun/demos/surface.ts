// Licensed under the Apache License, Version 2.0, like the rest of this repository.
import { createSurface } from '@flyingrobots/bijou';
import { defineDemo, type Demo } from '../contract.js';
import { stampPanel } from '../panel.js';
import { START_ORBIT, type Orbit } from './surface-math.js';
import { renderSurface } from './surface-raster.js';

export interface SurfaceState {
  /** Where the clock starts: the original reads the wall clock, a demo reads its seed. */
  readonly start: number;
  /** The pointer in pane cells orbits the camera; null lets it turn on its own. */
  readonly pointer: { readonly col: number; readonly row: number } | null;
  readonly hideUI: boolean;
}

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
    // One sample per half-block pixel; the mesh keeps (mesh - 1) a multiple of 4 so grid lines sit on vertex rows.
    const mesh = 4 * Math.max(8, Math.min(16, Math.round(width / 16))) + 1;
    const rgb = renderSurface(orbitAt(state, elapsed, width, height), state.start + elapsed, width, height * 2, mesh);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const top = (y * 2 * width + x) * 3;
        const bottom = top + width * 3;
        out.setRGB(x, y, '▀', rgb[top] ?? 0, rgb[top + 1] ?? 0, rgb[top + 2] ?? 0, rgb[bottom] ?? 0, rgb[bottom + 1] ?? 0, rgb[bottom + 2] ?? 0);
      }
    }
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
