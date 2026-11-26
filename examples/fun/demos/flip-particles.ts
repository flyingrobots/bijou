// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// The FLIP method here is after Matthias Mueller (Ten Minute Physics, 2022), MIT License.
import { addTo, at, clamp, type FlipFluid } from './flip-core.js';

export function integrateParticles(f: FlipFluid, dt: number, gravityX: number, gravityY: number): void {
  for (let i = 0; i < f.numParticles; i += 1) {
    addTo(f.particleVel, 2 * i, dt * gravityX);
    addTo(f.particleVel, 2 * i + 1, dt * gravityY);
    addTo(f.particlePos, 2 * i, at(f.particleVel, 2 * i) * dt);
    addTo(f.particlePos, 2 * i + 1, at(f.particleVel, 2 * i + 1) * dt);
  }
}

function cellOf(f: FlipFluid, i: number): number {
  const xi = clamp(Math.floor(at(f.particlePos, 2 * i) * f.pInvSpacing), 0, f.pNumX - 1);
  const yi = clamp(Math.floor(at(f.particlePos, 2 * i + 1) * f.pInvSpacing), 0, f.pNumY - 1);
  return xi * f.pNumY + yi;
}

/** Bin the particles into a hash grid: counts per cell, then the start of each cell's slice of `cellParticleIds`. */
function binParticles(f: FlipFluid): void {
  f.numCellParticles.fill(0);
  for (let i = 0; i < f.numParticles; i += 1) {
    const cell = cellOf(f, i);
    f.numCellParticles[cell] = at(f.numCellParticles, cell) + 1;
  }
  let first = 0;
  for (let i = 0; i < f.pNumCells; i += 1) {
    first += at(f.numCellParticles, i);
    f.firstCellParticle[i] = first;
  }
  f.firstCellParticle[f.pNumCells] = first;
  for (let i = 0; i < f.numParticles; i += 1) {
    const cell = cellOf(f, i);
    f.firstCellParticle[cell] = at(f.firstCellParticle, cell) - 1;
    f.cellParticleIds[at(f.firstCellParticle, cell)] = i;
  }
}

/** Move two overlapping particles half the overlap apart each. \`px\` and \`py\` are where \`i\` was when its sweep began. */
function separate(f: FlipFluid, i: number, id: number, px: number, py: number, minDist: number): void {
  const dx = at(f.particlePos, 2 * id) - px;
  const dy = at(f.particlePos, 2 * id + 1) - py;
  const d2 = dx * dx + dy * dy;
  if (d2 > minDist * minDist || d2 === 0.0) return;
  const d = Math.sqrt(d2);
  const s = (0.5 * (minDist - d)) / d;
  addTo(f.particlePos, 2 * i, -(dx * s));
  addTo(f.particlePos, 2 * i + 1, -(dy * s));
  addTo(f.particlePos, 2 * id, dx * s);
  addTo(f.particlePos, 2 * id + 1, dy * s);
}

export function pushParticlesApart(f: FlipFluid, numIters: number): void {
  binParticles(f);
  const minDist = 2.0 * f.particleRadius;
  for (let iter = 0; iter < numIters; iter += 1) {
    for (let i = 0; i < f.numParticles; i += 1) {
      const px = at(f.particlePos, 2 * i);
      const py = at(f.particlePos, 2 * i + 1);
      const pxi = Math.floor(px * f.pInvSpacing);
      const pyi = Math.floor(py * f.pInvSpacing);
      for (let xi = Math.max(pxi - 1, 0); xi <= Math.min(pxi + 1, f.pNumX - 1); xi += 1) {
        for (let yi = Math.max(pyi - 1, 0); yi <= Math.min(pyi + 1, f.pNumY - 1); yi += 1) {
          const cell = xi * f.pNumY + yi;
          for (let j = at(f.firstCellParticle, cell); j < at(f.firstCellParticle, cell + 1); j += 1) {
            const id = at(f.cellParticleIds, j);
            if (id !== i) separate(f, i, id, px, py, minDist);
          }
        }
      }
    }
  }
}
