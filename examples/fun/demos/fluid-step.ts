// Licensed under the Apache License, Version 2.0, like the rest of this repository.
import { nextRandom } from '../random.js';
import { resolveBoundaryCollision, resolveObstacleCollision, type Particle } from './fluid-collide.js';

const CELL = 1.5;
const D_MIN = 1.3;
const MAX_SPEED = 1.8;

/** The tank holds about this many particles at its densest, so a pour stops here instead of growing without bound. */
export const MAX_PARTICLES = 1500;

/** Push the particle away from a neighbour and damp their relative motion; the neighbour is left alone. */
function repel(pi: Particle, pj: Particle): void {
  const rx = pi.x - pj.x;
  const ry = pi.y - pj.y;
  const d2 = rx * rx + ry * ry;
  if (d2 >= D_MIN * D_MIN || d2 <= 0.0001) return;
  const d = Math.sqrt(d2);
  const ratio = 1.0 - d / D_MIN;
  const f = ratio * 0.5 + ratio * ratio * 1.0;
  pi.vx += (rx / d) * f;
  pi.vy += (ry / d) * f;
  const viscosity = 0.3 * ratio;
  pi.vx -= (pi.vx - pj.vx) * viscosity;
  pi.vy -= (pi.vy - pj.vy) * viscosity;
}

/** One step of the tank: gravity, drag, repulsion from neighbours in a grid, a speed limit, then the walls and the well. */
export function stepParticles(input: readonly Particle[], width: number, height: number): Particle[] {
  const ps = input.map((p) => ({ ...p }));
  const gw = Math.ceil(width / CELL);
  const gh = Math.ceil(height / CELL);
  const cells: number[][] = Array.from({ length: gw * gh }, () => []);
  const col = (p: Particle): number => Math.max(0, Math.min(gw - 1, Math.floor(p.x / CELL)));
  const row = (p: Particle): number => Math.max(0, Math.min(gh - 1, Math.floor(p.y / CELL)));
  ps.forEach((p, i) => cells[row(p) * gw + col(p)]?.push(i));
  for (const [i, pi] of ps.entries()) {
    pi.vy += 0.06;
    pi.vx *= 0.985;
    pi.vy *= 0.985;
    const gx = col(pi);
    const gy = row(pi);
    for (let ny = Math.max(0, gy - 1); ny <= Math.min(gh - 1, gy + 1); ny += 1) {
      for (let nx = Math.max(0, gx - 1); nx <= Math.min(gw - 1, gx + 1); nx += 1) {
        for (const j of cells[ny * gw + nx] ?? []) {
          const pj = ps[j];
          if (j !== i && pj !== undefined) repel(pi, pj);
        }
      }
    }
  }
  for (const p of ps) {
    const speed2 = p.vx * p.vx + p.vy * p.vy;
    if (speed2 > MAX_SPEED * MAX_SPEED) {
      const speed = Math.sqrt(speed2);
      p.vx = (p.vx / speed) * MAX_SPEED;
      p.vy = (p.vy / speed) * MAX_SPEED;
    }
    p.x += p.vx;
    p.y += p.vy;
    resolveObstacleCollision(p, width * 0.5, height * 0.55);
    resolveBoundaryCollision(p, width, height);
  }
  return ps;
}

/** Three new particles at the source stream, in the order the original drew its randomness. Returns the next seed. */
export function spawn(seed: number, side: 'left' | 'right', width: number): readonly [Particle[], number] {
  const made: Particle[] = [];
  let rng = seed;
  const draw = (): number => {
    const [value, next] = nextRandom(rng);
    rng = next;
    return value;
  };
  for (let s = 0; s < 3; s += 1) {
    const x = side === 'left' ? 2.0 + draw() * 2.0 : width - 4.0 + draw() * 2.0;
    const y = 2.0 + draw() * 0.5;
    const vx = side === 'left' ? 0.6 + draw() * 0.4 : -0.6 - draw() * 0.4;
    made.push({ x, y, vx, vy: 0.1 + draw() * 0.1 });
  }
  return [made, rng];
}
