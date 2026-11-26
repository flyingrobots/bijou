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

const A: RaytraceVector3 = [1, -2, 3];
const B: RaytraceVector3 = [4, 5, -6];

function fresh(v: RaytraceVector3): RaytraceVector3Mutable {
  return [v[0], v[1], v[2]];
}

describe('raytrace target aliasing', () => {
  const binary = [
    ['raytraceAdd', raytraceAdd],
    ['raytraceSub', raytraceSub],
    ['raytraceCross', raytraceCross],
    ['raytraceReflect', raytraceReflect],
  ] as const;

  for (const [name, fn] of binary) {
    it(`${name} is safe with target === first input`, () => {
      const a = fresh(A);
      expect(fn(a, B, a)).toBe(a);
      expect(a).toEqual(fn(A, B));
    });

    it(`${name} is safe with target === second input`, () => {
      const b = fresh(B);
      expect(fn(A, b, b)).toBe(b);
      expect(b).toEqual(fn(A, B));
    });

    it(`${name} is safe with both inputs and the target the same array`, () => {
      const v = fresh(A);
      expect(fn(v, v, v)).toBe(v);
      expect(v).toEqual(fn(A, A));
    });

    it(`${name} is safe when the two inputs alias and the target is separate`, () => {
      const v = fresh(A);
      const out: RaytraceVector3Mutable = [0, 0, 0];
      fn(v, v, out);
      expect(out).toEqual(fn(A, A));
      expect(v).toEqual([1, -2, 3]);
    });
  }

  it('raytraceScale is safe with target === vector', () => {
    const v = fresh(A);
    expect(raytraceScale(v, -3, v)).toBe(v);
    expect(v).toEqual(raytraceScale(A, -3));
  });

  it('raytraceNormalize is safe with target === vector', () => {
    const v = fresh(A);
    expect(raytraceNormalize(v, v)).toBe(v);
    expect(v).toEqual(raytraceNormalize(A));
  });
});
