import { createSurface, type RGB, type Surface } from '../../packages/bijou/src/index.js';
import { HalfBlockCanvas } from '../../packages/bijou/src/core/viz/index.js';
import {
  raytraceDot,
  raytraceNormalize,
  raytraceOrbitCameraRay,
  raytracePlaneHit,
  raytraceReflect,
  raytraceSphereHit,
  type RaytraceHit,
  type RaytracePlane,
  type RaytraceRay,
  type RaytraceSphere,
  type RaytraceVector3,
} from '../../packages/bijou-tui/src/index.js';
import { sampleRamp, type HeroPalette } from './theme.js';

interface Material {
  readonly color: RGB;
  readonly reflect: number;
}

interface SceneObject {
  readonly shape: RaytraceSphere | RaytracePlane;
  readonly material: (point: RaytraceVector3) => Material;
}

function hexRgb(hex: string): RGB {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function buildScene(time: number, palette: HeroPalette): SceneObject[] {
  const a = hexRgb(palette.accent);
  const b = hexRgb(palette.accent2);
  const c = hexRgb(sampleRamp(palette, 0.85));
  const floorA = hexRgb(palette.panel);
  const floorB = hexRgb(sampleRamp(palette, 0.1));
  const orbit = (phase: number, r: number): RaytraceVector3 =>
    [Math.cos(time * 0.9 + phase) * r, 0.1 + Math.abs(Math.sin(time * 1.7 + phase)) * 0.6, Math.sin(time * 0.9 + phase) * r];
  return [
    { shape: { kind: 'sphere', center: [0, 0.35, 0], radius: 0.85 }, material: () => ({ color: [236, 238, 246], reflect: 0.5 }) },
    { shape: { kind: 'sphere', center: orbit(0, 1.9), radius: 0.45 }, material: () => ({ color: a, reflect: 0.2 }) },
    { shape: { kind: 'sphere', center: orbit(2.1, 1.9), radius: 0.4 }, material: () => ({ color: b, reflect: 0.25 }) },
    { shape: { kind: 'sphere', center: orbit(4.2, 1.9), radius: 0.35 }, material: () => ({ color: c, reflect: 0.3 }) },
    {
      shape: { kind: 'plane', point: [0, -0.5, 0], normal: [0, 1, 0] },
      material: ([x, , z]) => ({ color: (Math.floor(x * 0.8) + Math.floor(z * 0.8)) % 2 === 0 ? floorA : floorB, reflect: 0.18 }),
    },
  ];
}

function nearest(ray: RaytraceRay, scene: readonly SceneObject[]): { hit: RaytraceHit; obj: SceneObject } | undefined {
  let best: { hit: RaytraceHit; obj: SceneObject } | undefined;
  for (const obj of scene) {
    const hit = obj.shape.kind === 'sphere' ? raytraceSphereHit(ray, obj.shape) : raytracePlaneHit(ray, obj.shape);
    if (hit !== undefined && hit.distance > 1e-4 && (best === undefined || hit.distance < best.hit.distance)) {
      best = { hit, obj };
    }
  }
  return best;
}

const LIGHT: RaytraceVector3 = raytraceNormalize([0.6, 1, 0.4]);

type Sky = (direction: RaytraceVector3) => RGB;

function shade(ray: RaytraceRay, scene: readonly SceneObject[], skyAt: Sky, depth: number): RGB {
  const found = nearest(ray, scene);
  const sky = skyAt(ray.direction);
  if (found === undefined) return sky;
  const { hit, obj } = found;
  const material = obj.material(hit.point);
  const lift: RaytraceVector3 = [hit.point[0] + hit.normal[0] * 1e-3, hit.point[1] + hit.normal[1] * 1e-3, hit.point[2] + hit.normal[2] * 1e-3];
  const shadowed = nearest({ origin: lift, direction: LIGHT }, scene) !== undefined;
  const diffuse = Math.max(0, raytraceDot(hit.normal, LIGHT)) * (shadowed ? 0.25 : 1);
  const fog = Math.min(1, Math.max(0, (hit.distance - 4) / 10));
  let color: RGB = [
    material.color[0] * (0.3 + 0.7 * diffuse),
    material.color[1] * (0.3 + 0.7 * diffuse),
    material.color[2] * (0.3 + 0.7 * diffuse),
  ];
  if (material.reflect > 0 && depth < 2) {
    const bounced = shade({ origin: lift, direction: raytraceReflect(ray.direction, hit.normal) }, scene, skyAt, depth + 1);
    color = [
      color[0] * (1 - material.reflect) + bounced[0] * material.reflect,
      color[1] * (1 - material.reflect) + bounced[1] * material.reflect,
      color[2] * (1 - material.reflect) + bounced[2] * material.reflect,
    ];
  }
  return [
    Math.round(color[0] * (1 - fog) + sky[0] * fog),
    Math.round(color[1] * (1 - fog) + sky[1] * fog),
    Math.round(color[2] * (1 - fog) + sky[2] * fog),
  ];
}

/** Trace a pw×ph pixel grid of the orbiting-spheres scene, row-major. */
export function tracePixels(pw: number, ph: number, time: number, palette: HeroPalette): RGB[] {
  const scene = buildScene(time, palette);
  const top = hexRgb(palette.bg);
  const horizon = hexRgb(sampleRamp(palette, 0.35));
  const skyAt: Sky = ([, dy]) => {
    const t = Math.max(0, Math.min(1, 1 - dy * 3));
    return [top[0] + (horizon[0] - top[0]) * t, top[1] + (horizon[1] - top[1]) * t, top[2] + (horizon[2] - top[2]) * t];
  };
  const aspect = pw / ph;
  const pixels: RGB[] = [];
  for (let py = 0; py < ph; py++) {
    for (let px = 0; px < pw; px++) {
      const sx = ((px + 0.5) / pw * 2 - 1) * aspect * 0.5;
      const sy = (1 - (py + 0.5) / ph * 2) * 0.5;
      const ray = raytraceOrbitCameraRay({
        angleRadians: time * 0.35, radius: 3.9, height: 1.0, target: [0, 0.15, 0], screen: [sx, sy], focalLength: 1.0,
      });
      pixels.push(shade(ray, scene, skyAt, 0));
    }
  }
  return pixels;
}

/** Ray-trace into half-block pixels: two colour pixels per cell. */
export function raytraceSurface(width: number, height: number, time: number, palette: HeroPalette): Surface {
  const surface = createSurface(width, height);
  if (width <= 0 || height <= 0) return surface;
  const canvas = new HalfBlockCanvas(width, height);
  tracePixels(width, height * 2, time, palette).forEach(([r, g, b], i) => {
    canvas.setPixel(i % width, Math.floor(i / width), [Math.round(r), Math.round(g), Math.round(b)]);
  });
  canvas.flushToSurface(surface);
  return surface;
}
