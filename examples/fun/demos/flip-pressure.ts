// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// The FLIP method here is after Matthias Mueller (Ten Minute Physics, 2022), MIT License.
import { addTo, at, FLUID_CELL, SOLID_CELL, type FlipFluid } from './flip-core.js';

/** Relax the grid velocities toward zero divergence, with the density correction that keeps the fluid from compressing. */
export function solveIncompressibility(f: FlipFluid, numIters: number, dt: number, overRelaxation: number, compensateDrift = true): void {
  f.p.fill(0.0);
  f.prevU.set(f.u);
  f.prevV.set(f.v);
  const n = f.fNumY;
  const cp = (f.density * f.h) / dt;
  for (let iter = 0; iter < numIters; iter += 1) {
    for (let i = 1; i < f.fNumX - 1; i += 1) {
      for (let j = 1; j < f.fNumY - 1; j += 1) {
        const center = i * n + j;
        if (f.cellType[center] !== FLUID_CELL) continue;
        const left = (i - 1) * n + j;
        const right = (i + 1) * n + j;
        const bottom = center - 1;
        const top = center + 1;
        const sx0 = at(f.s, left);
        const sx1 = at(f.s, right);
        const sy0 = at(f.s, bottom);
        const sy1 = at(f.s, top);
        const sSum = sx0 + sx1 + sy0 + sy1;
        if (sSum === 0.0) continue;
        let div = at(f.u, right) - at(f.u, center) + at(f.v, top) - at(f.v, center);
        if (f.particleRestDensity > 0.0 && compensateDrift) {
          const compression = at(f.particleDensity, center) - f.particleRestDensity;
          if (compression > 0.0) div = div - 1.0 * compression;
        }
        const pVal = (-div / sSum) * overRelaxation;
        addTo(f.p, center, cp * pVal);
        addTo(f.u, center, -(sx0 * pVal));
        addTo(f.u, right, sx1 * pVal);
        addTo(f.v, center, -(sy0 * pVal));
        addTo(f.v, top, sy1 * pVal);
      }
    }
  }
}

/** A sawtooth colour scale on one grey channel, for a value between `minVal` and `maxVal`. */
function scientificGrey(value: number, minVal: number, maxVal: number): number {
  const val = Math.min(Math.max(value, minVal), maxVal - 0.0001);
  const diff = maxVal - minVal;
  const scaled = diff === 0.0 ? 0.5 : (val - minVal) / diff;
  const m = 0.25;
  const num = Math.floor(scaled / m);
  const s = (scaled - num * m) / m;
  return num === 0 || num === 2 ? s : num === 1 || num === 3 ? 1.0 - s : 0;
}

/** Solid cells grey, fluid cells by how compressed they are against the rest density, air black. */
export function updateCellColors(f: FlipFluid): void {
  f.cellColor.fill(0.0);
  for (let i = 0; i < f.fNumCells; i += 1) {
    const type = f.cellType[i];
    const grey = type === SOLID_CELL ? 0.5
      : type === FLUID_CELL ? scientificGrey(at(f.particleDensity, i) / (f.particleRestDensity > 0.0 ? f.particleRestDensity : 1), 0.0, 2.0)
      : undefined;
    if (grey === undefined) continue;
    f.cellColor.fill(grey, 3 * i, 3 * i + 3);
  }
}
