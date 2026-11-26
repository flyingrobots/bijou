// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// The FLIP method here is after Matthias Mueller (Ten Minute Physics, 2022), MIT License.
import { addTo, at, clamp, FLUID_CELL, type FlipFluid } from './flip-core.js';

/** Spread each particle onto the four grid points around it, and fix the rest density from the first fluid it sees. */
export function updateParticleDensity(f: FlipFluid): void {
  const n = f.fNumY;
  const h = f.h;
  const h1 = f.fInvSpacing;
  const h2 = 0.5 * h;
  const d = f.particleDensity;
  d.fill(0.0);
  for (let i = 0; i < f.numParticles; i += 1) {
    const x = clamp(at(f.particlePos, 2 * i), h, (f.fNumX - 1) * h);
    const y = clamp(at(f.particlePos, 2 * i + 1), h, (f.fNumY - 1) * h);
    const x0 = Math.floor((x - h2) * h1);
    const tx = (x - h2 - x0 * h) * h1;
    const x1 = Math.min(x0 + 1, f.fNumX - 2);
    const y0 = Math.floor((y - h2) * h1);
    const ty = (y - h2 - y0 * h) * h1;
    const y1 = Math.min(y0 + 1, f.fNumY - 2);
    const sx = 1.0 - tx;
    const sy = 1.0 - ty;
    if (x0 < f.fNumX && y0 < f.fNumY) addTo(d, x0 * n + y0, sx * sy);
    if (x1 < f.fNumX && y0 < f.fNumY) addTo(d, x1 * n + y0, tx * sy);
    if (x1 < f.fNumX && y1 < f.fNumY) addTo(d, x1 * n + y1, tx * ty);
    if (x0 < f.fNumX && y1 < f.fNumY) addTo(d, x0 * n + y1, sx * ty);
  }
  if (f.particleRestDensity !== 0.0) return;
  let sum = 0.0;
  let numFluidCells = 0;
  for (let i = 0; i < f.fNumCells; i += 1) {
    if (f.cellType[i] === FLUID_CELL) {
      sum += at(d, i);
      numFluidCells += 1;
    }
  }
  if (numFluidCells > 0) f.particleRestDensity = sum / numFluidCells;
}
