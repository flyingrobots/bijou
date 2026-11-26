// Licensed under the Apache License, Version 2.0, like the rest of this repository.
import { createSurface, type Surface } from '@flyingrobots/bijou';
import { defineDemo, type Demo } from '../contract.js';
import { stampPanel } from '../panel.js';
import { nextRandom } from '../random.js';
import { paintMetaballs, type DotBlob } from './metaballs-raster.js';

/** A blob in the unit square, moving at `vx`, `vy` units per second. The radius is a share of the shorter side. */
interface Blob {
  readonly x: number;
  readonly y: number;
  readonly vx: number;
  readonly vy: number;
  readonly radius: number;
  readonly hue: number;
}

interface State {
  readonly blobs: readonly Blob[];
  /** The pointer in cells, or null once it has left the pane. */
  readonly pointer: { readonly col: number; readonly row: number } | null;
}

const START: readonly Blob[] = [
  { x: 0.2, y: 0.3, vx: 0.15, vy: 0.12, radius: 0.1, hue: 0 },
  { x: 0.8, y: 0.4, vx: -0.12, vy: 0.18, radius: 0.12, hue: 120 },
  { x: 0.5, y: 0.7, vx: 0.1, vy: -0.14, radius: 0.09, hue: 240 },
  { x: 0.3, y: 0.8, vx: -0.18, vy: -0.08, radius: 0.08, hue: 60 },
  { x: 0.7, y: 0.2, vx: 0.08, vy: 0.2, radius: 0.11, hue: 300 },
];

/** Move along one axis and bounce off the walls of the unit square. */
function bounce(pos: number, vel: number, radius: number, dt: number): readonly [number, number] {
  const next = pos + vel * dt;
  if (next - radius < 0) return [radius, -vel];
  if (next + radius > 1) return [1 - radius, -vel];
  return [next, vel];
}

function step(blob: Blob, dt: number): Blob {
  const [x, vx] = bounce(blob.x, blob.vx, blob.radius, dt);
  const [y, vy] = bounce(blob.y, blob.vy, blob.radius, dt);
  return { ...blob, x, y, vx, vy };
}

function background(width: number, height: number, time: number): Surface {
  const surface = createSurface(width, height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const wave = Math.sin(x * 0.15 + time * 1.5) * Math.cos(y * 0.25 - time * 0.8);
      if (wave > 0.65) surface.setRGB(x, y, '+', 35, 45, 60, 8, 12, 18);
      else if (x % 4 === 0 && y % 2 === 0) surface.setRGB(x, y, '.', 20, 25, 35, 4, 6, 9);
      else surface.setRGB(x, y, ' ', 0, 0, 0, 2, 3, 5);
    }
  }
  return surface;
}

const metaballs: Demo<State> = {
  id: 'metaballs',
  name: 'Color-Blending Metaballs',
  description: 'Fluid blobs that merge, split and blend colours; the pointer carries one of them',
  keys: 'move the pointer to steer a blob, space pause',
  init(seed) {
    let rng = seed;
    const blobs = START.map((blob) => {
      const [r, next] = nextRandom(rng);
      rng = next;
      const scale = 0.8 + 0.4 * r;
      return { ...blob, vx: blob.vx * scale, vy: blob.vy * scale };
    });
    return { blobs, pointer: null };
  },
  update(msg, state) {
    if (msg.type === 'pulse') return { ...state, blobs: state.blobs.map((blob) => step(blob, msg.dt)) };
    if (msg.type === 'pointer') return { ...state, pointer: { col: msg.col, row: msg.row } };
    if (msg.type === 'pointer-leave') return { ...state, pointer: null };
    return state;
  },
  view(state, { width, height, elapsed, ctx }) {
    const surface = background(width, height, elapsed);
    const gridW = width * 2;
    const gridH = height * 4;
    const minDim = Math.min(gridW, gridH);
    const dots: DotBlob[] = state.blobs.map((b) => ({ x: b.x * gridW, y: b.y * gridH, radius: b.radius * minDim, hue: b.hue }));
    const { pointer } = state;
    if (pointer !== null && pointer.col >= 0 && pointer.col < width && pointer.row >= 0 && pointer.row < height) {
      dots.push({ x: pointer.col * 2 + 1, y: pointer.row * 4 + 2, radius: 0.14 * minDim, hue: (elapsed * 50) % 360 });
    }
    paintMetaballs(surface, dots);
    stampPanel(surface, [
      '  ***  COLOR-BLENDING METABALLS  ***  ',
      '─'.repeat(36),
      `  Active blobs: ${String(dots.length)}`,
      '  Move the pointer inside the pane to',
      '  steer the colour-cycling blob.',
    ], ctx, (free) => ({ x: Math.max(0, Math.min(4, free.x - 2)), y: Math.max(0, free.y - 1) }));
    return surface;
  },
};

export const metaballsDemo = defineDemo(metaballs);
