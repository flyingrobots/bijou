import { MIN_HIT_DISTANCE } from './raytrace.part01.js';

import type { RaytraceHit, RaytracePlane, RaytraceRay, RaytraceSphere, RaytraceVector3, RaytraceVector3Mutable } from './raytrace.part01.js';
export function raytraceSphereHit(ray: RaytraceRay, sphere: RaytraceSphere): RaytraceHit<RaytraceSphere> | undefined {
  const offset = raytraceSub(ray.origin, sphere.center);
  const halfB = raytraceDot(offset, ray.direction);
  const c = raytraceDot(offset, offset) - (sphere.radius * sphere.radius);
  const discriminant = (halfB * halfB) - c;
  if (discriminant < 0) return undefined;

  const root = Math.sqrt(discriminant);
  const near = -halfB - root;
  const far = -halfB + root;
  const distance = near > MIN_HIT_DISTANCE
    ? near
    : far > MIN_HIT_DISTANCE
      ? far
      : undefined;
  if (distance === undefined) return undefined;

  const point = raytraceAdd(ray.origin, raytraceScale(ray.direction, distance));
  return {
    shape: sphere,
    distance,
    point,
    normal: raytraceNormalize(raytraceSub(point, sphere.center)),
  };
}
export function raytracePlaneHit(ray: RaytraceRay, plane: RaytracePlane): RaytraceHit<RaytracePlane> | undefined {
  const normal = raytraceNormalize(plane.normal);
  const denominator = raytraceDot(normal, ray.direction);
  if (Math.abs(denominator) <= MIN_HIT_DISTANCE) return undefined;

  const distance = raytraceDot(raytraceSub(plane.point, ray.origin), normal) / denominator;
  if (distance <= MIN_HIT_DISTANCE) return undefined;

  return {
    shape: plane,
    distance,
    point: raytraceAdd(ray.origin, raytraceScale(ray.direction, distance)),
    normal,
  };
}
/**
 * Vector helpers. Each takes an optional `target`: when given, the result is
 * written into it and the same array is returned, so CPU-bound loops allocate
 * nothing per call. Without `target` a fresh tuple is returned as before.
 *
 * Aliasing: the target may be the same array as any input, or as several
 * inputs, for every helper. All inputs are read before the target is written
 * (`cross` and `normalize` copy into locals first).
 */
export function raytraceReflect(ray: RaytraceVector3, normal: RaytraceVector3): RaytraceVector3;
export function raytraceReflect(ray: RaytraceVector3, normal: RaytraceVector3, target: RaytraceVector3Mutable): RaytraceVector3Mutable;
export function raytraceReflect(ray: RaytraceVector3, normal: RaytraceVector3, target?: RaytraceVector3Mutable): RaytraceVector3Mutable {
  const twiceDot = 2 * raytraceDot(ray, normal);
  const out = target ?? [0, 0, 0];
  out[0] = ray[0] - (normal[0] * twiceDot);
  out[1] = ray[1] - (normal[1] * twiceDot);
  out[2] = ray[2] - (normal[2] * twiceDot);
  return out;
}
/** A zero-length vector normalizes to `[0, 0, 0]` (positive zeros), as it always has. */
export function raytraceNormalize(vector: RaytraceVector3): RaytraceVector3;
export function raytraceNormalize(vector: RaytraceVector3, target: RaytraceVector3Mutable): RaytraceVector3Mutable;
export function raytraceNormalize(vector: RaytraceVector3, target?: RaytraceVector3Mutable): RaytraceVector3Mutable {
  const length = raytraceLength(vector);
  const x = vector[0];
  const y = vector[1];
  const z = vector[2];
  const out = target ?? [0, 0, 0];
  if (length === 0) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
  } else {
    out[0] = x / length;
    out[1] = y / length;
    out[2] = z / length;
  }
  return out;
}
export function raytraceLength(vector: RaytraceVector3): number {
  return Math.hypot(vector[0], vector[1], vector[2]);
}
export function raytraceDot(a: RaytraceVector3, b: RaytraceVector3): number {
  return (a[0] * b[0]) + (a[1] * b[1]) + (a[2] * b[2]);
}
export function raytraceCross(a: RaytraceVector3, b: RaytraceVector3): RaytraceVector3;
export function raytraceCross(a: RaytraceVector3, b: RaytraceVector3, target: RaytraceVector3Mutable): RaytraceVector3Mutable;
export function raytraceCross(a: RaytraceVector3, b: RaytraceVector3, target?: RaytraceVector3Mutable): RaytraceVector3Mutable {
  const x = (a[1] * b[2]) - (a[2] * b[1]);
  const y = (a[2] * b[0]) - (a[0] * b[2]);
  const z = (a[0] * b[1]) - (a[1] * b[0]);
  const out = target ?? [0, 0, 0];
  out[0] = x;
  out[1] = y;
  out[2] = z;
  return out;
}
export function raytraceAdd(a: RaytraceVector3, b: RaytraceVector3): RaytraceVector3;
export function raytraceAdd(a: RaytraceVector3, b: RaytraceVector3, target: RaytraceVector3Mutable): RaytraceVector3Mutable;
export function raytraceAdd(a: RaytraceVector3, b: RaytraceVector3, target?: RaytraceVector3Mutable): RaytraceVector3Mutable {
  const out = target ?? [0, 0, 0];
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  out[2] = a[2] + b[2];
  return out;
}
export function raytraceSub(a: RaytraceVector3, b: RaytraceVector3): RaytraceVector3;
export function raytraceSub(a: RaytraceVector3, b: RaytraceVector3, target: RaytraceVector3Mutable): RaytraceVector3Mutable;
export function raytraceSub(a: RaytraceVector3, b: RaytraceVector3, target?: RaytraceVector3Mutable): RaytraceVector3Mutable {
  const out = target ?? [0, 0, 0];
  out[0] = a[0] - b[0];
  out[1] = a[1] - b[1];
  out[2] = a[2] - b[2];
  return out;
}
export function raytraceScale(vector: RaytraceVector3, scalar: number): RaytraceVector3;
export function raytraceScale(vector: RaytraceVector3, scalar: number, target: RaytraceVector3Mutable): RaytraceVector3Mutable;
export function raytraceScale(vector: RaytraceVector3, scalar: number, target?: RaytraceVector3Mutable): RaytraceVector3Mutable {
  const out = target ?? [0, 0, 0];
  out[0] = vector[0] * scalar;
  out[1] = vector[1] * scalar;
  out[2] = vector[2] * scalar;
  return out;
}
