// Licensed under the Apache License, Version 2.0, like the rest of this repository.
import type { Noise3 } from './noise.js';
import { hex, mix, type Rgb } from './pixels.js';

/** The thin disk lies in the equatorial plane from the innermost stable orbit, 3 Schwarzschild radii, out to 12. */
export const R_IN = 6;
export const R_OUT = 24;
/** Speeds the disk's turning so its texture moves at a watchable pace. */
const TURN = 8;

/** Blackbody-ish colours from cool to hot: deep red, orange, yellow, white, then blue-white. */
const RAMP: readonly Rgb[] = ['#2a0600', '#9c2a06', '#f06414', '#ffae3c', '#ffe6b0', '#fffaf0', '#c8dcff'].map(hex);

function ramp(t: number): Rgb {
  const at = Math.max(0, Math.min(1, t)) * (RAMP.length - 1);
  const i = Math.min(RAMP.length - 2, Math.floor(at));
  return mix(RAMP[i] ?? [0, 0, 0], RAMP[i + 1] ?? [0, 0, 0], at - i);
}

const smooth = (a: number, b: number, x: number): number => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** One hit on the disk, as seen from the camera: linear light (0 to a few a channel) and opacity. */
export interface DiskHit {
  readonly r: number;
  readonly g: number;
  readonly b: number;
  readonly alpha: number;
}

/**
 * The disk at radius `r` and azimuth `angle`, at `time` seconds. `toward` is the cosine between the gas's orbital
 * velocity and the photon's direction to the camera: positive on the side swinging toward the camera. With `doppler`
 * on, that side is beamed brighter and bluer and the far side dims and reddens; the gravitational redshift
 * √(1 − 2/r) cools and dims the gas near the horizon either way.
 */
export function diskHit(r: number, angle: number, toward: number, time: number, doppler: boolean, noise: Noise3): DiskHit {
  const v = Math.sqrt(1 / (r - 2));
  const gamma = 1 / Math.sqrt(1 - v * v);
  const beaming = doppler ? 1 / (gamma * (1 - v * toward)) : 1;
  const shift = beaming * Math.sqrt(1 - 2 / r);
  const heat = (r / R_IN) ** -0.75;
  // Gas at azimuth θ now started at θ + ωt: the disk turns toward decreasing azimuth, with Kepler's ω = r^(-3/2).
  const spun = angle + TURN * time * r ** -1.5;
  const lanes = noise(r * 0.55, Math.cos(spun) * 2.2, Math.sin(spun) * 2.2);
  const fine = noise(r * 1.9, Math.cos(spun) * 6, Math.sin(spun) * 6);
  const texture = Math.max(0.15, 0.78 + 0.5 * lanes + 0.25 * fine);
  const light = 3.6 * heat ** 1.5 * shift * shift * texture;
  const [cr, cg, cb] = ramp((heat * shift - 0.18) / 1.15);
  const alpha = smooth(R_IN, R_IN + 0.8, r) * (1 - smooth(R_OUT * 0.7, R_OUT, r)) * Math.min(1, 0.55 + 0.45 * texture);
  return { r: (cr / 255) * light, g: (cg / 255) * light, b: (cb / 255) * light, alpha };
}
