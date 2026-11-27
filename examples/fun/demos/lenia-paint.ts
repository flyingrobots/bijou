// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// Painting a Lenia world: the state through a perceptual colour ramp over a dark ground, with the kernel potential
// laid underneath as a faint glow, so each creature sits in a halo of the field it feels.
import type { Surface } from '@flyingrobots/bijou';
import { sample, type World } from './lenia-sim.js';
import { hex, mix, paintPixels, type Rgb } from './pixels.js';

/** A named colour ramp, sampled evenly from 0 to 1. */
export interface Ramp {
  readonly name: string;
  readonly stops: readonly Rgb[];
}

/** Ramps after matplotlib's magma and viridis (Smith and van der Walt, CC0), and a cold ice ramp. */
export const RAMPS: readonly Ramp[] = [
  { name: 'magma', stops: ['#000004', '#180f3d', '#440f76', '#721f81', '#9e2f7f', '#cd4071', '#f1605d', '#fd9668', '#feca8d', '#fcfdbf'].map(hex) },
  { name: 'viridis', stops: ['#440154', '#482777', '#3f4a8a', '#31678e', '#26838f', '#1f9d8a', '#6cce5a', '#b6de2b', '#fee825'].map(hex) },
  { name: 'ice', stops: ['#020409', '#04142e', '#0b3a6b', '#1c6fa8', '#3fa7d6', '#8fd8f0', '#e8fbff'].map(hex) },
];

const GROUND: Rgb = hex('#05050b');
const LEVELS = 256;

/** The colour `t` of the way along `ramp`. */
export function rampAt(ramp: Ramp, t: number): Rgb {
  const { stops } = ramp;
  const x = Math.max(0, Math.min(1, t)) * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(x));
  return mix(stops[i] ?? GROUND, stops[i + 1] ?? GROUND, x - i);
}

/** Paint `world` across the whole surface: each half-block pixel samples the grid bilinearly. */
export function paintLenia(surface: Surface, world: World, ramp: Ramp): void {
  const pw = surface.width;
  const ph = surface.height * 2;
  const sx = world.width / pw;
  const sy = world.height / ph;
  const halo = rampAt(ramp, 0.45);
  const round = ([r, g, b]: Rgb): Rgb => [Math.round(r), Math.round(g), Math.round(b)];
  // Look-up tables of 256 levels: the ground under each glow level and the creature colour at each state.
  const grounds = Array.from({ length: LEVELS }, (_, k) => mix(GROUND, halo, (k / (LEVELS - 1)) * 0.3));
  const bodies = Array.from({ length: LEVELS }, (_, k) => rampAt(ramp, 0.12 + (k / (LEVELS - 1)) * 0.88));
  const level = (v: number): number => Math.max(0, Math.min(LEVELS - 1, Math.round(v * (LEVELS - 1))));
  paintPixels(surface, (x, y) => {
    const gx = x * sx - 0.5;
    const gy = y * sy - 0.5;
    const a = sample(world.cells, world.width, world.height, gx, gy);
    const ground = grounds[level(sample(world.potential, world.width, world.height, gx, gy) * 3)] ?? GROUND;
    if (a <= 0.002) return round(ground);
    return round(mix(ground, bodies[level(a)] ?? GROUND, Math.min(1, a * 4)));
  });
}
