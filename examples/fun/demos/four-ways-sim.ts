// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// The one model every pane lowers: a comet on a Keplerian ellipse round a sun, integrated
// with a leapfrog step, past planets on circular orbits. Units are AU and years.
import { nextRandom } from '../random.js';

/** The sun's gravitational parameter in AU³/yr²: 4π². */
export const GM = 4 * Math.PI * Math.PI;
/** One AU per year in kilometres a second. */
export const KMS = 4.740_47;

export interface Planet {
  readonly name: string;
  /** How a sentence names it. */
  readonly called: string;
  readonly radius: number;
  readonly phase: number;
  /** Closer than this, in AU, the comet is passing it. */
  readonly near: number;
  readonly rgb: readonly [number, number, number];
  readonly size: number;
}

const JUPITER: Planet = { name: 'jupiter', called: 'the gas giant', radius: 5.203, phase: 4.1, near: 0.8, rgb: [225, 185, 135], size: 2.2 };

export const PLANETS: readonly Planet[] = [
  { name: 'earth', called: 'the blue planet', radius: 1, phase: 0.4, near: 0.25, rgb: [90, 150, 255], size: 1.3 },
  { name: 'mars', called: 'the red planet', radius: 1.524, phase: 2.6, near: 0.25, rgb: [230, 110, 70], size: 1.1 },
  JUPITER,
];

export interface Comet {
  readonly x: number;
  readonly y: number;
  readonly vx: number;
  readonly vy: number;
}

export type SkyEvent =
  | { readonly kind: 'perihelion' | 'aphelion'; readonly t: number; readonly comet: Comet }
  | { readonly kind: 'crossing' | 'approach'; readonly t: number; readonly comet: Comet; readonly planet: Planet };

export function planetAt(planet: Planet, t: number): readonly [number, number] {
  const angle = planet.phase + (2 * Math.PI * t) / planet.radius ** 1.5;
  return [planet.radius * Math.cos(angle), planet.radius * Math.sin(angle)];
}

export const distance = (comet: Comet): number => Math.hypot(comet.x, comet.y);
export const speedKms = (comet: Comet): number => Math.hypot(comet.vx, comet.vy) * KMS;
/** True while the comet falls toward the sun. */
export const inbound = (comet: Comet): boolean => comet.x * comet.vx + comet.y * comet.vy < 0;

/** The comet's distance to `planet` at time `t`, in AU. */
export function gap(comet: Comet, planet: Planet, t: number): number {
  const [px, py] = planetAt(planet, t);
  return Math.hypot(comet.x - px, comet.y - py);
}

export function nearest(comet: Comet, t: number): { readonly planet: Planet; readonly gap: number } {
  let best = { planet: JUPITER, gap: gap(comet, JUPITER, t) };
  for (const planet of PLANETS) {
    const d = gap(comet, planet, t);
    if (d < best.gap) best = { planet, gap: d };
  }
  return best;
}

/** The osculating ellipse of the comet's state: semi-major axis, eccentricity, perihelion angle, and orbital phase in [0, 1). */
export function elements(comet: Comet): { readonly a: number; readonly e: number; readonly omega: number; readonly phase: number } {
  const r = distance(comet);
  const v2 = comet.vx * comet.vx + comet.vy * comet.vy;
  const a = 1 / (2 / r - v2 / GM);
  const rv = comet.x * comet.vx + comet.y * comet.vy;
  const ex = ((v2 - GM / r) * comet.x - rv * comet.vx) / GM;
  const ey = ((v2 - GM / r) * comet.y - rv * comet.vy) / GM;
  const e = Math.min(0.999, Math.hypot(ex, ey));
  const cosE = Math.max(-1, Math.min(1, (1 - r / a) / Math.max(1e-9, e)));
  const anomaly = rv >= 0 ? Math.acos(cosE) : 2 * Math.PI - Math.acos(cosE);
  const mean = anomaly - e * Math.sin(anomaly);
  return { a, e, omega: Math.atan2(ey, ex), phase: (mean / (2 * Math.PI)) % 1 };
}

/** A new comet from the seed: perihelion inside Mars, aphelion near Jupiter, at a random point on its ellipse. */
export function rollComet(seed: number): readonly [Comet, number] {
  const [ra, s1] = nextRandom(seed);
  const [re, s2] = nextRandom(s1);
  const [rw, s3] = nextRandom(s2);
  const [rn, s4] = nextRandom(s3);
  const aphelion = 4.4 + ra * 1.4;
  const perihelion = 0.35 + re * 0.9;
  const a = (aphelion + perihelion) / 2;
  const e = (aphelion - perihelion) / (aphelion + perihelion);
  const omega = rw * 2 * Math.PI;
  const nu = (0.55 + rn * 0.9) * Math.PI;
  const p = a * (1 - e * e);
  const r = p / (1 + e * Math.cos(nu));
  const k = Math.sqrt(GM / p);
  const [lx, ly, lvx, lvy] = [r * Math.cos(nu), r * Math.sin(nu), -k * Math.sin(nu), k * (e + Math.cos(nu))];
  const [c, s] = [Math.cos(omega), Math.sin(omega)];
  return [{ x: lx * c - ly * s, y: lx * s + ly * c, vx: lvx * c - lvy * s, vy: lvx * s + lvy * c }, s4];
}

function leapfrog(comet: Comet, h: number): Comet {
  const accel = (x: number, y: number): readonly [number, number] => {
    const r = Math.hypot(x, y);
    const f = -GM / (r * r * r);
    return [f * x, f * y];
  };
  const [ax, ay] = accel(comet.x, comet.y);
  const hvx = comet.vx + (ax * h) / 2;
  const hvy = comet.vy + (ay * h) / 2;
  const x = comet.x + hvx * h;
  const y = comet.y + hvy * h;
  const [bx, by] = accel(x, y);
  return { x, y, vx: hvx + (bx * h) / 2, vy: hvy + (by * h) / 2 };
}

/** Advance `years` from time `t`, in steps short enough for the perihelion swing, reporting every event on the way. */
export function advance(comet: Comet, t: number, years: number): { readonly comet: Comet; readonly events: readonly SkyEvent[] } {
  const events: SkyEvent[] = [];
  let now = comet;
  let clock = t;
  let left = years;
  for (let guard = 0; left > 1e-12 && guard < 600; guard += 1) {
    const h = Math.min(left, 0.0012 * distance(now) ** 1.5);
    const next = leapfrog(now, h);
    const later = clock + h;
    if (inbound(now) !== inbound(next)) events.push({ kind: inbound(now) ? 'perihelion' : 'aphelion', t: later, comet: next });
    for (const planet of PLANETS) {
      if ((distance(now) - planet.radius) * (distance(next) - planet.radius) < 0) events.push({ kind: 'crossing', t: later, comet: next, planet });
      if (gap(now, planet, clock) >= planet.near && gap(next, planet, later) < planet.near) events.push({ kind: 'approach', t: later, comet: next, planet });
    }
    now = next;
    clock = later;
    left -= h;
  }
  return { comet: now, events };
}
