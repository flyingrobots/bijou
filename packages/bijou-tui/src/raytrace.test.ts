import { describe, expect, it } from 'vitest';
import {
  raytraceLookAtRay,
  raytraceNearestHit,
  raytraceReflect,
  raytraceSphereHit,
  type RaytraceShape,
  type RaytraceVector3,
} from './raytrace.js';

describe('raytrace shader kernel', () => {
  it('builds a normalized look-at camera ray', () => {
    const ray = raytraceLookAtRay({
      origin: [0, 2, 5],
      target: [0, 0, 0],
      screen: [0, 0],
      focalLength: 1,
    });

    expectVector(ray.origin, [0, 2, 5]);
    expectVector(ray.direction, [0, -0.371391, -0.928477]);
  });

  it('reports the first positive sphere hit', () => {
    const hit = raytraceSphereHit(
      { origin: [0, 0, -5], direction: [0, 0, 1] },
      { kind: 'sphere', center: [0, 0, 0], radius: 1 },
    );

    expect(hit).toBeDefined();
    expect(hit?.distance).toBeCloseTo(4);
    expectVector(hit?.point, [0, 0, -1]);
    expectVector(hit?.normal, [0, 0, -1]);
  });

  it('selects the nearest supported shape hit', () => {
    const shapes: readonly RaytraceShape[] = [
      { kind: 'sphere', center: [0, 1, 0], radius: 1 },
      { kind: 'plane', point: [0, 1, -2], normal: [0, 0, -1] },
    ];

    const hit = raytraceNearestHit(
      { origin: [0, 1, -5], direction: [0, 0, 1] },
      shapes,
    );

    expect(hit?.shape.kind).toBe('plane');
    expect(hit?.distance).toBeCloseTo(3);
    expectVector(hit?.point, [0, 1, -2]);
    expectVector(hit?.normal, [0, 0, -1]);
  });

  it('reflects a ray across a surface normal', () => {
    expectVector(raytraceReflect([0, -1, 0], [0, 1, 0]), [0, 1, 0]);
  });
});

function expectVector(actual: RaytraceVector3 | undefined, expected: RaytraceVector3): void {
  expect(actual).toBeDefined();
  expect(actual?.[0]).toBeCloseTo(expected[0]);
  expect(actual?.[1]).toBeCloseTo(expected[1]);
  expect(actual?.[2]).toBeCloseTo(expected[2]);
}
