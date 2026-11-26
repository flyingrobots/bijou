// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// The FLIP method here is after Matthias Mueller (Ten Minute Physics, 2022), MIT License.
import { addTo, AIR_CELL, at, clamp, FLUID_CELL, SOLID_CELL, type FlipFluid } from './flip-core.js';

/** Clear the grid, remember its last velocities, and mark each cell solid, fluid (a particle is in it) or air. */
function prepareGrid(f: FlipFluid): void {
  const n = f.fNumY;
  f.prevU.set(f.u);
  f.prevV.set(f.v);
  f.du.fill(0.0);
  f.dv.fill(0.0);
  f.u.fill(0.0);
  f.v.fill(0.0);
  for (let i = 0; i < f.fNumCells; i += 1) f.cellType[i] = f.s[i] === 0.0 ? SOLID_CELL : AIR_CELL;
  for (let i = 0; i < f.numParticles; i += 1) {
    const xi = clamp(Math.floor(at(f.particlePos, 2 * i) * f.fInvSpacing), 0, f.fNumX - 1);
    const yi = clamp(Math.floor(at(f.particlePos, 2 * i + 1) * f.fInvSpacing), 0, f.fNumY - 1);
    if (f.cellType[xi * n + yi] === AIR_CELL) f.cellType[xi * n + yi] = FLUID_CELL;
  }
}

/** Solid cells and the faces next to them keep the velocity they had. */
function restoreSolids(f: FlipFluid): void {
  const n = f.fNumY;
  for (let i = 0; i < f.fNumX; i += 1) {
    for (let j = 0; j < f.fNumY; j += 1) {
      const idx = i * n + j;
      const solid = f.cellType[idx] === SOLID_CELL;
      if (solid || (i > 0 && f.cellType[(i - 1) * n + j] === SOLID_CELL)) f.u[idx] = at(f.prevU, idx);
      if (solid || (j > 0 && f.cellType[i * n + j - 1] === SOLID_CELL)) f.v[idx] = at(f.prevV, idx);
    }
  }
}

/** The four grid points around a particle for one velocity component, and their bilinear weights, left in the scratch. */
function stencil(f: FlipFluid, particle: number, component: number): void {
  const n = f.fNumY;
  const h = f.h;
  const h1 = f.fInvSpacing;
  const dx = component === 0 ? 0.0 : 0.5 * h;
  const dy = component === 0 ? 0.5 * h : 0.0;
  const x = clamp(at(f.particlePos, 2 * particle), h, (f.fNumX - 1) * h);
  const y = clamp(at(f.particlePos, 2 * particle + 1), h, (f.fNumY - 1) * h);
  const x0 = Math.min(Math.floor((x - dx) * h1), f.fNumX - 2);
  const tx = (x - dx - x0 * h) * h1;
  const x1 = Math.min(x0 + 1, f.fNumX - 2);
  const y0 = Math.min(Math.floor((y - dy) * h1), f.fNumY - 2);
  const ty = (y - dy - y0 * h) * h1;
  const y1 = Math.min(y0 + 1, f.fNumY - 2);
  const sx = 1.0 - tx;
  const sy = 1.0 - ty;
  f.stencilIds[0] = x0 * n + y0;
  f.stencilIds[1] = x1 * n + y0;
  f.stencilIds[2] = x1 * n + y1;
  f.stencilIds[3] = x0 * n + y1;
  f.stencilWeights[0] = sx * sy;
  f.stencilWeights[1] = tx * sy;
  f.stencilWeights[2] = tx * ty;
  f.stencilWeights[3] = sx * ty;
}

/** Blend a particle's velocity component with the grid's: PIC is the grid value, FLIP the particle plus the grid's change. */
function gridToParticle(f: FlipFluid, particle: number, component: number, flipRatio: number): void {
  const field = component === 0 ? f.u : f.v;
  const prev = component === 0 ? f.prevU : f.prevV;
  const offset = component === 0 ? f.fNumY : 1;
  let sumD = 0;
  let pic = 0;
  let corr = 0;
  for (let k = 0; k < 4; k += 1) {
    const id = at(f.stencilIds, k);
    const w = at(f.stencilWeights, k);
    const valid = f.cellType[id] !== AIR_CELL || f.cellType[id - offset] !== AIR_CELL ? 1.0 : 0.0;
    sumD += valid * w;
    pic += valid * w * at(field, id);
    corr += valid * w * (at(field, id) - at(prev, id));
  }
  if (sumD <= 0.0) return;
  const flip = at(f.particleVel, 2 * particle + component) + corr / sumD;
  f.particleVel[2 * particle + component] = (1.0 - flipRatio) * (pic / sumD) + flipRatio * flip;
}

/** Move velocities from the particles to the grid (`toGrid`) or back, as FLIP does. */
export function transferVelocities(f: FlipFluid, toGrid: boolean, flipRatio = 0.9): void {
  if (toGrid) prepareGrid(f);
  for (let component = 0; component < 2; component += 1) {
    const field = component === 0 ? f.u : f.v;
    const weights = component === 0 ? f.du : f.dv;
    for (let i = 0; i < f.numParticles; i += 1) {
      stencil(f, i, component);
      if (!toGrid) {
        gridToParticle(f, i, component, flipRatio);
        continue;
      }
      const pv = at(f.particleVel, 2 * i + component);
      for (let k = 0; k < 4; k += 1) {
        addTo(field, at(f.stencilIds, k), pv * at(f.stencilWeights, k));
        addTo(weights, at(f.stencilIds, k), at(f.stencilWeights, k));
      }
    }
    if (!toGrid) continue;
    for (let i = 0; i < field.length; i += 1) if (at(weights, i) > 0.0) field[i] = at(field, i) / at(weights, i);
    restoreSolids(f);
  }
}
