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

describe('raytrace vector helpers with a target', () => {
  it('returns the caller-supplied target, filled', () => {
    const out: RaytraceVector3Mutable = [9, 9, 9];
    expect(raytraceAdd(A, B, out)).toBe(out);
    expect(out).toEqual([5, 3, -3]);
    expect(raytraceSub(A, B, out)).toBe(out);
    expect(out).toEqual([-3, -7, 9]);
    expect(raytraceScale(A, 2, out)).toBe(out);
    expect(out).toEqual([2, -4, 6]);
    expect(raytraceCross(A, B, out)).toBe(out);
    expect(out).toEqual(raytraceCross(A, B));
    expect(raytraceNormalize([0, 3, 4], out)).toBe(out);
    expect(out).toEqual([0, 0.6, 0.8]);
    expect(raytraceReflect([0, -1, 0], [0, 1, 0], out)).toBe(out);
    expect(out).toEqual([0, 1, 0]);
  });

  it('reuses one target across calls without leaking earlier values', () => {
    const out: RaytraceVector3Mutable = [0, 0, 0];
    raytraceAdd(A, B, out);
    raytraceSub(B, A, out);
    expect(out).toEqual([3, 7, -9]);
  });

  it('still returns a fresh tuple when no target is given', () => {
    const first = raytraceAdd(A, B);
    expect(raytraceAdd(A, B)).not.toBe(first);
    expect(first).toEqual([5, 3, -3]);
  });

  it('does not touch the inputs when writing a separate target', () => {
    const a = fresh(A);
    const b = fresh(B);
    raytraceCross(a, b, [0, 0, 0]);
    raytraceNormalize(a, [0, 0, 0]);
    expect(a).toEqual([1, -2, 3]);
    expect(b).toEqual([4, 5, -6]);
  });

  it('normalizes a zero vector to positive zeros, as the immutable helper does', () => {
    const out: RaytraceVector3Mutable = [7, 7, 7];
    raytraceNormalize([-0, 0, -0], out);
    expect(Object.is(out[0], 0)).toBe(true);
    expect(Object.is(out[2], 0)).toBe(true);
    expect(out).toEqual(raytraceNormalize([-0, 0, -0]));
  });
});
