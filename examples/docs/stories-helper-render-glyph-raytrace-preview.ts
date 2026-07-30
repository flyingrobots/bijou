import { canvas, raytraceDot, raytraceNearestHit, raytraceNormalize, raytraceOrbitCameraRay, raytraceReflect } from './stories-runtime.js';
import type { Surface } from './stories-runtime.js';
import { MOTION_RAYTRACE_SHAPES } from './stories-helper-motion-raytrace-shapes.js';

export function renderGlyphRaytracePreview(width: number, height: number, timeMs: number): Surface {
  const light = raytraceNormalize([-0.45, 0.9, -0.35]);
  const view = raytraceNormalize([0, 0.15, -1]);
  return canvas(width, height, ({ u, v, time }) => {
    const ray = raytraceOrbitCameraRay({
      angleRadians: 0.52 + (time * 0.16),
      radius: 2.35,
      height: 0.82,
      target: [0, -0.08, 0],
      screen: [(u - 0.5) * 1.65, (0.5 - v) * 1.15],
      focalLength: 1.35,
    });
    const hit = raytraceNearestHit(ray, MOTION_RAYTRACE_SHAPES);
    if (hit === undefined) {
      return { char: ' ', coverage: 0, bgRGB: [8, 11, 15] };
    }

    const diffuse = Math.max(0, raytraceDot(hit.normal, light));
    const reflected = raytraceReflect(ray.direction, hit.normal);
    const rim = Math.pow(Math.max(0, raytraceDot(reflected, view)), 4);
    const planePulse = hit.shape.kind === 'plane'
      ? ((Math.floor(hit.point[0] * 5) + Math.floor(hit.point[2] * 5)) % 2 === 0 ? 0.24 : 0.08)
      : 0;
    const coverage = Math.min(1, 0.18 + (diffuse * 0.62) + (rim * 0.34) + planePulse);
    const warm = hit.shape.kind === 'sphere' ? 70 : 28;

    return {
      char: '█',
      coverage,
      fgRGB: [
        Math.round(52 + (diffuse * 118) + warm),
        Math.round(88 + (diffuse * 104)),
        Math.round(120 + (rim * 96)),
      ],
      bgRGB: [8, 11, 15],
    };
  }, {
    time: timeMs / 1000,
    resolution: 'glyph',
    glyphFit: { mode: 'unicode' },
  });
}
