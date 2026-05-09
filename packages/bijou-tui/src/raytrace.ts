/**
 * Small raytrace geometry helpers for shader-authored terminal scenes.
 *
 * This module owns camera rays, vector math, and primitive intersections.
 * Apps keep material, lighting, palette, and sampling policy.
 */

export type RaytraceVector3 = readonly [number, number, number];
export type RaytraceScreenPoint = readonly [number, number];

export interface RaytraceRay {
  readonly origin: RaytraceVector3;
  readonly direction: RaytraceVector3;
}

export interface RaytraceSphere {
  readonly kind: 'sphere';
  readonly center: RaytraceVector3;
  readonly radius: number;
}

export interface RaytracePlane {
  readonly kind: 'plane';
  readonly point: RaytraceVector3;
  readonly normal: RaytraceVector3;
}

export type RaytraceShape = RaytraceSphere | RaytracePlane;

export interface RaytraceHit<Shape extends RaytraceShape = RaytraceShape> {
  readonly shape: Shape;
  readonly distance: number;
  readonly point: RaytraceVector3;
  readonly normal: RaytraceVector3;
}

export interface RaytraceLookAtRayOptions {
  readonly origin: RaytraceVector3;
  readonly target: RaytraceVector3;
  readonly screen: RaytraceScreenPoint;
  readonly focalLength?: number;
  readonly up?: RaytraceVector3;
}

export interface RaytraceOrbitCameraRayOptions {
  readonly angleRadians: number;
  readonly radius: number;
  readonly height: number;
  readonly target: RaytraceVector3;
  readonly screen: RaytraceScreenPoint;
  readonly focalLength?: number;
  readonly up?: RaytraceVector3;
}

const DEFAULT_FOCAL_LENGTH = 1;
const MIN_HIT_DISTANCE = 0.000001;
const WORLD_UP: RaytraceVector3 = [0, 1, 0];
const FALLBACK_RIGHT: RaytraceVector3 = [1, 0, 0];

export function raytraceLookAtRay(options: RaytraceLookAtRayOptions): RaytraceRay {
  const focalLength = options.focalLength ?? DEFAULT_FOCAL_LENGTH;
  const up = options.up ?? WORLD_UP;
  const forward = raytraceNormalize(raytraceSub(options.target, options.origin));
  const rightCandidate = raytraceNormalize(raytraceCross(forward, up));
  const right = raytraceLength(rightCandidate) === 0 ? FALLBACK_RIGHT : rightCandidate;
  const cameraUp = raytraceNormalize(raytraceCross(right, forward));
  const direction = raytraceNormalize(raytraceAdd(
    raytraceAdd(
      raytraceScale(right, options.screen[0]),
      raytraceScale(cameraUp, options.screen[1]),
    ),
    raytraceScale(forward, focalLength),
  ));

  return {
    origin: options.origin,
    direction,
  };
}

export function raytraceOrbitCameraRay(options: RaytraceOrbitCameraRayOptions): RaytraceRay {
  const origin: RaytraceVector3 = [
    options.target[0] + (Math.sin(options.angleRadians) * options.radius),
    options.target[1] + options.height,
    options.target[2] + (Math.cos(options.angleRadians) * options.radius),
  ];

  return raytraceLookAtRay({
    origin,
    target: options.target,
    screen: options.screen,
    focalLength: options.focalLength,
    up: options.up,
  });
}

export function raytraceNearestHit(ray: RaytraceRay, shapes: readonly RaytraceShape[]): RaytraceHit | undefined {
  let nearest: RaytraceHit | undefined;

  for (const shape of shapes) {
    const hit = shape.kind === 'sphere'
      ? raytraceSphereHit(ray, shape)
      : raytracePlaneHit(ray, shape);
    if (hit !== undefined && (nearest === undefined || hit.distance < nearest.distance)) {
      nearest = hit;
    }
  }

  return nearest;
}

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
