// Licensed under the Apache License, Version 2.0, like the rest of this repository.
import type { Light } from './raytracer-material.js';

export const APERTURE = 0.12;
export const DEFAULT_DISTANCE = 4.3;
export const MIN_DISTANCE = 1.5;
export const MAX_DISTANCE = 10.0;

/** The camera: its origin, the way it faces, and its right and up vectors. */
export interface Camera {
  readonly ox: number;
  readonly oy: number;
  readonly oz: number;
  readonly forward: readonly [number, number, number];
  readonly right: readonly [number, number, number];
  readonly up: readonly [number, number, number];
  readonly distance: number;
}

/** Five lights, two of them orbiting or bobbing with time. */
export function lightsAt(time: number): Light[] {
  return [
    { x: 3.5, y: 5.0, z: -3.0, r: 160, g: 160, b: 160 },
    { x: Math.sin(time * 1.8) * 2.2, y: 1.2 + Math.sin(time * 0.9) * 0.5, z: Math.cos(time * 1.8) * 2.2, r: 220, g: 20, b: 20 },
    { x: Math.cos(time * 1.3) * 2.0, y: 1.8 + Math.cos(time * 1.5) * 0.7, z: Math.sin(time * 1.3) * 2.0, r: 20, g: 20, b: 240 },
    { x: -4.0, y: 3.0, z: -2.0, r: 20, g: 150, b: 20 },
    { x: 0.0, y: 3.5, z: 4.5, r: 150, g: 20, b: 150 },
  ];
}

/** Aim a camera `distance` back from the scene at a point the pointer moves: `tiltX` and `tiltY` are the pointer's place in the pane, minus a half. */
export function cameraAt(distance: number, tiltX: number, tiltY: number): Camera {
  const oy = 1.0;
  const oz = -distance;
  const fdx = tiltX * 2.0;
  const fdy = 0.1 - tiltY * 1.5 - oy;
  const fdz = 0.0 - oz;
  const flen = Math.sqrt(fdx * fdx + fdy * fdy + fdz * fdz);
  const ndx = fdx / flen;
  const ndy = fdy / flen;
  const ndz = fdz / flen;
  const rlen = Math.sqrt(ndz * ndz + ndx * ndx);
  const rx = ndz / rlen;
  const rz = -ndx / rlen;
  return {
    ox: 0.0, oy, oz, distance,
    forward: [ndx, ndy, ndz],
    right: [rx, 0.0, rz],
    up: [ndy * rz - ndz * 0.0, ndz * rx - ndx * rz, ndx * 0.0 - ndy * rx],
  };
}
