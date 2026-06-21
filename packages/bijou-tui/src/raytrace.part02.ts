import { MIN_HIT_DISTANCE } from './raytrace.part01.js';

import type { RaytraceHit, RaytracePlane, RaytraceRay, RaytraceSphere, RaytraceVector3 } from './raytrace.part01.js';
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
export function raytraceReflect(ray: RaytraceVector3, normal: RaytraceVector3): RaytraceVector3 {
  return raytraceSub(ray, raytraceScale(normal, 2 * raytraceDot(ray, normal)));
}
export function raytraceNormalize(vector: RaytraceVector3): RaytraceVector3 {
  const length = raytraceLength(vector);
  return length === 0
    ? [0, 0, 0]
    : [vector[0] / length, vector[1] / length, vector[2] / length];
}
export function raytraceLength(vector: RaytraceVector3): number {
  return Math.hypot(vector[0], vector[1], vector[2]);
}
export function raytraceDot(a: RaytraceVector3, b: RaytraceVector3): number {
  return (a[0] * b[0]) + (a[1] * b[1]) + (a[2] * b[2]);
}
export function raytraceCross(a: RaytraceVector3, b: RaytraceVector3): RaytraceVector3 {
  return [
    (a[1] * b[2]) - (a[2] * b[1]),
    (a[2] * b[0]) - (a[0] * b[2]),
    (a[0] * b[1]) - (a[1] * b[0]),
  ];
}
export function raytraceAdd(a: RaytraceVector3, b: RaytraceVector3): RaytraceVector3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}
export function raytraceSub(a: RaytraceVector3, b: RaytraceVector3): RaytraceVector3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}
export function raytraceScale(vector: RaytraceVector3, scalar: number): RaytraceVector3 {
  return [vector[0] * scalar, vector[1] * scalar, vector[2] * scalar];
}
