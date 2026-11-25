// Licensed under the Apache License, Version 2.0, like the rest of this repository.
import { createSurface } from '@flyingrobots/bijou';
import { defineDemo, type Demo } from '../contract.js';
import { stampPanel } from '../panel.js';
import { DEFAULT_DISTANCE, MAX_DISTANCE, MIN_DISTANCE, cameraAt } from './raytracer-camera.js';
import { paintScene } from './raytracer-paint.js';

export interface RaytracerState {
  /** Seeds the lens jitter and the soft-shadow samples. */
  readonly seed: number;
  /** How far the camera sits from the scene: `+` and `-` move it a quarter unit, between 1.5 and 10. */
  readonly distance: number;
  /** The pointer in pane cells. It tilts the camera, and the tilt stays where the pointer last was. */
  readonly pointer: { readonly col: number; readonly row: number } | null;
  readonly hideUI: boolean;
}

const zoom = (state: RaytracerState, by: number): RaytracerState =>
  ({ ...state, distance: Math.max(MIN_DISTANCE, Math.min(MAX_DISTANCE, state.distance + by)) });

const inside = (value: number, size: number): number => Math.max(0, Math.min(size - 1, value));

export const raytracer: Demo<RaytracerState> = {
  id: 'raytracer',
  name: '3D Raytracer (The Works)',
  description: 'Animated raytracer in braille: reflections, soft shadows, caustics, rim light and depth of field',
  keys: 'move the pointer to tilt the camera, + and - zoom, h hides the panel, space pause',
  init: (seed) => ({ seed, distance: DEFAULT_DISTANCE, pointer: null, hideUI: false }),
  update(msg, state) {
    if (msg.type === 'pointer') return { ...state, pointer: { col: msg.col, row: msg.row } };
    if (msg.type !== 'key') return state;
    if (msg.key === '+' || msg.key === '=') return zoom(state, -0.25);
    if (msg.key === '-') return zoom(state, 0.25);
    return msg.key === 'h' ? { ...state, hideUI: !state.hideUI } : state;
  },
  view(state, { width, height, frame, elapsed, ctx }) {
    const surface = createSurface(width, height);
    const { pointer } = state;
    const tiltX = pointer === null ? 0 : inside(pointer.col, width) / width - 0.5;
    const tiltY = pointer === null ? 0 : inside(pointer.row, height) / height - 0.5;
    paintScene(surface, cameraAt(state.distance, tiltX, tiltY), elapsed, frame, state.seed);
    if (!state.hideUI) {
      stampPanel(surface, [
        '  ***  3D RAYTRACER (THE WORKS)  ***  ',
        '─'.repeat(36),
        '  - 3 spheres (Gold, Chrome, Red)',
        '  - 5 Colored Lights (2 animated)',
        '  - Reflections (metallic recursion)',
        '  - Soft Shadows (dithered sampling)',
        '  - Depth of Field (grainy lens defocus)',
        '  - Caustics (glass spotlight halo)',
        '  - Rim-Lighting (neon silhouette edge)',
        '─'.repeat(36),
        '  - MOVE POINTER : Tilt camera viewport',
        '  - + / -        : Zoom in and out',
        '  - [Space]      : Pause/Resume',
      ], ctx, (free) => ({ x: Math.max(0, Math.min(4, free.x - 2)), y: Math.max(0, free.y - 1) }));
    }
    return surface;
  },
};

export const raytracerDemo = defineDemo(raytracer);
