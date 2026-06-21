import { raytraceAdd, raytraceCross, raytraceLength, raytraceNormalize, raytracePlaneHit, raytraceScale, raytraceSphereHit, raytraceSub } from './raytrace.part02.js';
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
export const DEFAULT_FOCAL_LENGTH = 1;
export const MIN_HIT_DISTANCE = 0.000001;
export const WORLD_UP: RaytraceVector3 = [0, 1, 0];
export const FALLBACK_RIGHT: RaytraceVector3 = [1, 0, 0];
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
