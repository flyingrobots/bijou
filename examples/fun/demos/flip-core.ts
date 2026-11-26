// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// The FLIP method here is after Matthias Mueller (Ten Minute Physics, 2022), MIT License.
// https://matthias-research.github.io/pages/tenMinutePhysics/
export const FLUID_CELL = 0;
export const AIR_CELL = 1;
export const SOLID_CELL = 2;

export function clamp(x: number, min: number, max: number): number {
  return x < min ? min : x > max ? max : x;
}

/** A read that cannot be undefined: every index the solver reads lies inside its array. */
export function at(list: ArrayLike<number>, index: number): number {
  return list[index] ?? 0;
}

export function addTo(list: Float32Array, index: number, value: number): void {
  list[index] = at(list, index) + value;
}

/** The staggered grid and the particles of one FLIP fluid. Each step works on a `clone`, so a session never changes under another. */
export class FlipFluid {
  readonly fNumX: number;
  readonly fNumY: number;
  readonly h: number;
  readonly fInvSpacing: number;
  readonly fNumCells: number;
  readonly u: Float32Array;
  readonly v: Float32Array;
  readonly du: Float32Array;
  readonly dv: Float32Array;
  readonly prevU: Float32Array;
  readonly prevV: Float32Array;
  readonly p: Float32Array;
  readonly s: Float32Array;
  readonly cellType: Int32Array;
  readonly cellColor: Float32Array;
  numParticles = 0;
  readonly particlePos: Float32Array;
  readonly particleVel: Float32Array;
  readonly particleDensity: Float32Array;
  particleRestDensity = 0.0;
  readonly pInvSpacing: number;
  readonly pNumX: number;
  readonly pNumY: number;
  readonly pNumCells: number;
  readonly numCellParticles: Int32Array;
  readonly firstCellParticle: Int32Array;
  readonly cellParticleIds: Int32Array;
  /** Scratch for one particle's four grid neighbours and their weights. */
  readonly stencilIds = new Int32Array(4);
  readonly stencilWeights = new Float64Array(4);

  constructor(
    readonly density: number,
    readonly width: number,
    readonly height: number,
    readonly spacing: number,
    readonly particleRadius: number,
    readonly maxParticles: number,
  ) {
    this.fNumX = Math.floor(width / spacing);
    this.fNumY = Math.floor(height / spacing);
    this.h = Math.max(width / this.fNumX, height / this.fNumY);
    this.fInvSpacing = 1.0 / this.h;
    this.fNumCells = this.fNumX * this.fNumY;
    this.u = new Float32Array(this.fNumCells);
    this.v = new Float32Array(this.fNumCells);
    this.du = new Float32Array(this.fNumCells);
    this.dv = new Float32Array(this.fNumCells);
    this.prevU = new Float32Array(this.fNumCells);
    this.prevV = new Float32Array(this.fNumCells);
    this.p = new Float32Array(this.fNumCells);
    this.s = new Float32Array(this.fNumCells);
    this.cellType = new Int32Array(this.fNumCells);
    this.cellColor = new Float32Array(3 * this.fNumCells);
    this.particlePos = new Float32Array(2 * maxParticles);
    this.particleVel = new Float32Array(2 * maxParticles);
    this.particleDensity = new Float32Array(this.fNumCells);
    this.pInvSpacing = 1.0 / (2.2 * particleRadius);
    this.pNumX = Math.floor(width * this.pInvSpacing) + 1;
    this.pNumY = Math.floor(height * this.pInvSpacing) + 1;
    this.pNumCells = this.pNumX * this.pNumY;
    this.numCellParticles = new Int32Array(this.pNumCells);
    this.firstCellParticle = new Int32Array(this.pNumCells + 1);
    this.cellParticleIds = new Int32Array(maxParticles);
  }

  /** A copy that carries what the next step reads from this one: the grid velocities, walls, cells and particles. */
  clone(): FlipFluid {
    const copy = new FlipFluid(this.density, this.width, this.height, this.spacing, this.particleRadius, this.maxParticles);
    for (const name of ['u', 'v', 's', 'cellColor', 'particlePos', 'particleVel'] as const) copy[name].set(this[name]);
    copy.cellType.set(this.cellType);
    copy.numParticles = this.numParticles;
    copy.particleRestDensity = this.particleRestDensity;
    return copy;
  }
}
