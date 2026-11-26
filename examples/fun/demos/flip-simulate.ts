// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// The FLIP method here is after Matthias Mueller (Ten Minute Physics, 2022), MIT License.
import { nextRandom } from '../random.js';
import { FlipFluid } from './flip-core.js';
import { handleParticleCollisions } from './flip-collide.js';
import { updateParticleDensity } from './flip-density.js';
import { integrateParticles, pushParticlesApart } from './flip-particles.js';
import { solveIncompressibility, updateCellColors } from './flip-pressure.js';
import { transferVelocities } from './flip-transfer.js';

const SPACING = 1.0;
const PARTICLE_RADIUS = 0.3 * SPACING;
/** Room for a long pour: the buffers hold this many particles and a pour stops there. */
export const MAX_PARTICLES = 8000;
/** The fixed step of a pulse, a little larger than a real frame for terminal responsiveness. */
const DT = 1.0 / 30.0;

export interface Circle {
  readonly x: number;
  readonly y: number;
  readonly radius: number;
}

/**
 * A tank `numX` by `numY` cells with solid walls and a block of water in its left corner. `limit` caps the
 * water's particle count (zero gives an empty tank); a dam break fills 40% of the width and 70% of the height.
 */
export function createFluid(numX: number, numY: number, limit = Infinity): FlipFluid {
  const h = SPACING;
  const r = PARTICLE_RADIUS;
  const dx = 2.0 * r;
  const dy = (Math.sqrt(3.0) / 2.0) * dx;
  const pNumX = Math.floor((0.4 * numX * SPACING - 2.0 * h - 2.0 * r) / dx);
  const pNumY = Math.floor((0.7 * numY * SPACING - 2.0 * h - 2.0 * r) / dy);
  const f = new FlipFluid(1000.0, numX * SPACING, numY * SPACING, h, r, MAX_PARTICLES);
  f.numParticles = Math.max(0, Math.min(pNumX * pNumY, limit, MAX_PARTICLES));
  let p = 0;
  for (let i = 0; i < pNumX; i += 1) {
    for (let j = 0; j < pNumY && p < 2 * f.numParticles; j += 1) {
      f.particlePos[p++] = h + r + dx * i + (j % 2 === 0 ? 0.0 : r);
      f.particlePos[p++] = h + r + dy * j;
    }
  }
  for (let i = 0; i < f.fNumX; i += 1) {
    for (let j = 0; j < f.fNumY; j += 1) {
      f.s[i * f.fNumY + j] = i === 0 || i === f.fNumX - 1 || j === 0 || j === f.fNumY - 1 ? 0.0 : 1.0;
    }
  }
  return f;
}

/** Make the circle solid in the grid: its cells stop the flow and carry no velocity. */
export function applyObstacle(f: FlipFluid, obstacle: Circle): void {
  const n = f.fNumY;
  for (let i = 1; i < f.fNumX - 2; i += 1) {
    for (let j = 1; j < f.fNumY - 2; j += 1) {
      const cell = i * n + j;
      f.s[cell] = 1.0;
      const dx = (i + 0.5) * f.h - obstacle.x;
      const dy = (j + 0.5) * f.h - obstacle.y;
      if (dx * dx + dy * dy < obstacle.radius * obstacle.radius) {
        f.s[cell] = 0.0;
        f.u[cell] = 0.0;
        f.u[(i + 1) * n + j] = 0.0;
        f.v[cell] = 0.0;
        f.v[i * n + j + 1] = 0.0;
      }
    }
  }
}

/** Add `x`, `y` to every particle's velocity. */
export function shakeParticles(f: FlipFluid, x: number, y: number): void {
  for (let i = 0; i < f.numParticles; i += 1) {
    f.particleVel[2 * i] = (f.particleVel[2 * i] ?? 0) + x;
    f.particleVel[2 * i + 1] = (f.particleVel[2 * i + 1] ?? 0) + y;
  }
}

/** Four new particles at the top of the source side, from the seed. Returns the next seed. */
export function pourParticles(f: FlipFluid, side: 'left' | 'right', seed: number): number {
  let rng = seed;
  const draw = (): number => {
    const [value, next] = nextRandom(rng);
    rng = next;
    return value;
  };
  for (let s = 0; s < 4 && f.numParticles < f.maxParticles; s += 1) {
    const idx = f.numParticles;
    const left = side === 'left';
    f.particlePos[2 * idx] = left ? SPACING + PARTICLE_RADIUS + draw() * 2.0 : f.fNumX - SPACING - PARTICLE_RADIUS - draw() * 2.0;
    f.particlePos[2 * idx + 1] = f.fNumY - 2.0 - draw() * 0.5;
    f.particleVel[2 * idx] = left ? 5.0 + draw() * 2.0 : -5.0 - draw() * 2.0;
    f.particleVel[2 * idx + 1] = -1.0;
    f.numParticles += 1;
  }
  return rng;
}

/** One fixed step: move, push apart, collide, hand velocities to the grid, relax it, take them back. */
export function simulate(f: FlipFluid, obstacle: Circle): void {
  integrateParticles(f, DT, 0.0, -9.81);
  pushParticlesApart(f, 2);
  handleParticleCollisions(f, obstacle.x, obstacle.y, obstacle.radius);
  transferVelocities(f, true);
  updateParticleDensity(f);
  solveIncompressibility(f, 25, DT, 1.9, true);
  transferVelocities(f, false, 0.9);
  updateCellColors(f);
}
