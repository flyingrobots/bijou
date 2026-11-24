import { describe, expect, it } from 'vitest';
import {
  raytraceAdd,
  raytraceCross,
  raytraceNormalize,
  raytraceReflect,
  raytraceScale,
  raytraceSub,
  type RaytraceVector3,
  type RaytraceVector3Mutable,
} from './raytrace.js';

const SEED = Number(process.env['RAYTRACE_SEED'] ?? 348) >>> 0;
const SPECIAL = [0, -0, 1, -1, 1e-300, -1e-300, 1e300, -1e300, 1e154, 5e-324, NaN, Infinity, -Infinity];

function rng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sameBits(actual: RaytraceVector3, expected: RaytraceVector3, label: string): void {
  for (let i = 0; i < 3; i++) {
    expect(Object.is(actual[i], expected[i]), `${label} [${i}] ${actual[i]} vs ${expected[i]}`).toBe(true);
  }
}

describe('raytrace target helpers equal the immutable helpers bit for bit', () => {
  it(`over seeded random vectors (seed ${SEED})`, () => {
    console.info(`raytrace property seed=${SEED}`);
    const next = rng(SEED);
    const scalar = (): number => {
      const r = next();
      return r < 0.4 ? SPECIAL[Math.floor(next() * SPECIAL.length)] ?? 0 : (next() - 0.5) * 10 ** Math.floor(next() * 40 - 20);
    };
    const vec = (): RaytraceVector3 => [scalar(), scalar(), scalar()];
    for (let n = 0; n < 5000; n++) {
      const a = vec();
      const b = vec();
      const s = scalar();
      const label = `seed=${SEED} n=${n} a=${a} b=${b} s=${s}`;
      const out: RaytraceVector3Mutable = [1, 1, 1];
      sameBits(raytraceAdd(a, b, out), raytraceAdd(a, b), `add ${label}`);
      sameBits(raytraceSub(a, b, out), raytraceSub(a, b), `sub ${label}`);
      sameBits(raytraceScale(a, s, out), raytraceScale(a, s), `scale ${label}`);
      sameBits(raytraceCross(a, b, out), raytraceCross(a, b), `cross ${label}`);
      sameBits(raytraceNormalize(a, out), raytraceNormalize(a), `normalize ${label}`);
      sameBits(raytraceReflect(a, b, out), raytraceReflect(a, b), `reflect ${label}`);
    }
  });
});
