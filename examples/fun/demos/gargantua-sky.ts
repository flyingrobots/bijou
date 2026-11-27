// Licensed under the Apache License, Version 2.0, like the rest of this repository.
import { nextRandom } from '../random.js';

/** Cells around the sky in longitude, and from pole to pole in the sine of latitude, so each cell has the same area. */
const GRID_W = 256;
const GRID_H = 110;
/** Share of cells that hold a star. */
const DENSITY = 0.1;

/** The star behind each cell: brightness, offset across, offset down and colour tint, four numbers per cell. */
export interface Sky {
  readonly cells: Float32Array;
}

/** Scatter the stars from `seed`. Returns the sky and the next seed. */
export function createSky(seed: number): readonly [Sky, number] {
  const cells = new Float32Array(GRID_W * GRID_H * 4);
  let rng = seed;
  const draw = (): number => {
    const [r, next] = nextRandom(rng);
    rng = next;
    return r;
  };
  for (let i = 0; i < GRID_W * GRID_H; i += 1) {
    const roll = draw();
    if (roll >= DENSITY) continue;
    const bright = draw();
    cells[i * 4] = 0.1 + 1.1 * bright * bright * bright;
    cells[i * 4 + 1] = 0.2 + 0.6 * draw();
    cells[i * 4 + 2] = 0.2 + 0.6 * draw();
    cells[i * 4 + 3] = draw();
  }
  return [{ cells }, rng];
}

/** The tilted plane of a faint galactic band. */
const BAND: readonly [number, number, number] = [0.32, 0.88, 0.35];

/** Linear light arriving from unit direction (x, y, z), 0 to about 2 a channel. */
export function skyLight(sky: Sky, x: number, y: number, z: number): readonly [number, number, number] {
  const cx = (Math.atan2(z, x) / (2 * Math.PI) + 0.5) * GRID_W;
  const cy = ((Math.max(-1, Math.min(1, y)) + 1) / 2) * GRID_H;
  const ix = Math.floor(cx) % GRID_W;
  const iy = Math.min(GRID_H - 1, Math.floor(cy));
  const at = (iy * GRID_W + ix) * 4;
  const bright = sky.cells[at] ?? 0;
  const along = BAND[0] * x + BAND[1] * y + BAND[2] * z;
  const band = 0.05 * Math.exp(-(along * along) / 0.03) * (0.6 + 0.4 * Math.sin(x * 7 + z * 5));
  let r = band * 0.75;
  let g = band * 0.8;
  let b = band;
  if (bright > 0) {
    const dx = cx - Math.floor(cx) - (sky.cells[at + 1] ?? 0.5);
    const dy = cy - Math.floor(cy) - (sky.cells[at + 2] ?? 0.5);
    const glow = bright * Math.exp(-(dx * dx + dy * dy) * 14);
    const tint = sky.cells[at + 3] ?? 0.5;
    r += glow * (0.8 + 0.3 * tint);
    g += glow * 0.9;
    b += glow * (1.1 - 0.3 * tint);
  }
  return [r, g, b];
}
