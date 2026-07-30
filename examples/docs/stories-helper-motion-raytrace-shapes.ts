import type { RaytraceShape } from './stories-runtime.js';

export const MOTION_RAYTRACE_SHAPES: readonly RaytraceShape[] = [
  { kind: 'sphere', center: [-0.42, -0.1, 0], radius: 0.42 },
  { kind: 'sphere', center: [0.34, 0.02, 0.18], radius: 0.3 },
  { kind: 'plane', point: [0, -0.58, 0], normal: [0, 1, 0] },
];
