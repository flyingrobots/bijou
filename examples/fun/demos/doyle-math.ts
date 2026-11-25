// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// Doyle spirals after Robin Houston's d3 version (bl.ocks.org/robinhouston/6098310),
// as adapted in an Observable notebook: solve for the (p, q) spiral, then send
// every circle through the Möbius map z -> (z - 1) / (z + 1).

export type Complex = readonly [number, number];

export interface DoyleRoot {
  readonly a: Complex;
  readonly b: Complex;
  readonly r: number;
}

export interface Disc {
  readonly x: number;
  readonly y: number;
  readonly r: number;
  /** Which of the `p` spiral arms the disc belongs to. */
  readonly arm: number;
}

export const cmul = ([wr, wi]: Complex, [zr, zi]: Complex): Complex => [wr * zr - wi * zi, wr * zi + wi * zr];
const crot = (z: Complex, theta: number): Complex => cmul(z, [Math.cos(theta), Math.sin(theta)]);

/** Solve the Doyle spiral for (p, q) by 2D Newton–Raphson from (2, 0); null when it does not converge. */
export function doyle(p: number, q: number): DoyleRoot | null {
  const eps = 1e-10;
  const s = (t: number): number => (p * t + 2 * Math.PI) / q;
  const d = (z: number, t: number, pp: number, qq: number): number => {
    const w = z ** (pp / qq);
    const u = (pp * t + 2 * Math.PI) / qq;
    return (z * Math.cos(t) - w * Math.cos(u)) ** 2 + (z * Math.sin(t) - w * Math.sin(u)) ** 2;
  };
  const sum = (z: number, pp: number, qq: number): number => (z + z ** (pp / qq)) ** 2;
  const r2 = (z: number, t: number, pp: number, qq: number): number => d(z, t, pp, qq) / sum(z, pp, qq);
  const f = (z: number, t: number): number => r2(z, t, 0, 1) - r2(z, t, p, q);
  const g = (z: number, t: number): number => r2(z, t, 0, 1) - r2(z ** (p / q), s(t), 0, 1);
  // Partial derivatives by central differences: the original's closed forms give the same root.
  const h = 1e-7;
  const dz = (fn: (z: number, t: number) => number, z: number, t: number): number => (fn(z + h, t) - fn(z - h, t)) / (2 * h);
  const dt = (fn: (z: number, t: number) => number, z: number, t: number): number => (fn(z, t + h) - fn(z, t - h)) / (2 * h);
  let z = 2;
  let t = 0;
  for (let i = 0; i < 200; i += 1) {
    const vf = f(z, t);
    const vg = g(z, t);
    if (Math.abs(vf) < eps && Math.abs(vg) < eps) {
      const coroot = { z: z ** (p / q), t: s(t) };
      return {
        a: [z * Math.cos(t), z * Math.sin(t)],
        b: [coroot.z * Math.cos(coroot.t), coroot.z * Math.sin(coroot.t)],
        r: Math.sqrt(r2(z, t, 0, 1)),
      };
    }
    const [a, b, c, e] = [dz(f, z, t), dt(f, z, t), dz(g, z, t), dt(g, z, t)];
    const det = a * e - b * c;
    if (Math.abs(det) < eps) return null;
    z -= (e * vf - b * vg) / det;
    t -= (a * vg - c * vf) / det;
    if (!(z > eps) || !Number.isFinite(t)) return null;
  }
  return null;
}

const transformPoint = ([x, y]: Complex): Complex => {
  const den = (x + 1) * (x + 1) + y * y;
  return [(x * x - 1 + y * y) / den, (2 * y) / den];
};

function circleThrough([ax, ay]: Complex, [bx, by]: Complex, [cx, cy]: Complex): readonly [number, number, number] {
  const na = ax * ax + ay * ay;
  const nb = bx * bx + by * by;
  const nc = cx * cx + cy * cy;
  const dy = 2 * (by - ay) * (bx - cx) - 2 * (ax - bx) * (cy - by);
  const y = ((ax - bx) * (nb - nc) - (bx - cx) * (na - nb)) / dy;
  const x = (na - nb + 2 * (by - ay) * y) / (2 * (ax - bx));
  return [x, y, Math.hypot(x - ax, y - ay)];
}

/** The discs of the spiral turned by `turn` (in turns), after the Möbius map, skipping discs larger than 3. */
export function doyleDiscs(root: DoyleRoot, p: number, turn: number): Disc[] {
  const discs: Disc[] = [];
  const modB = Math.hypot(...root.b);
  for (let i = 0, start = crot([1e-4, 0], -turn * 2 * Math.PI); i < p; i += 1, start = cmul(start, root.a)) {
    for (let c = start, dist = Math.hypot(...c); dist < 1e4; c = cmul(c, root.b), dist *= modB) {
      const r = dist * root.r;
      const [x, y, cr] = circleThrough(transformPoint([c[0] - r, c[1]]), transformPoint([c[0] + r, c[1]]), transformPoint([c[0], c[1] + r]));
      if (Number.isFinite(cr) && cr <= 3) discs.push({ x, y, r: cr, arm: i });
    }
  }
  return discs;
}
