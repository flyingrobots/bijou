// Licensed under the Apache License, Version 2.0, like the rest of this repository.
import { createSurface, type Surface } from '@flyingrobots/bijou';
import { defineDemo, type Demo } from '../contract.js';
import { stampPanel } from '../panel.js';
import { add, cross, dot, getNormal, getShadow, normalize, raymarch, scale, sub, type Vec3 } from './raymarcher-sdf.js';

export interface RaymarcherState {
  /** The light's place in the unit square, set by w, a, s and d. */
  readonly lightX: number;
  readonly lightY: number;
  readonly hideUI: boolean;
}

const RAMP = ' .:-=+*#%@';
const clamp = (v: number): number => Math.max(0.05, Math.min(0.95, v));
const BASE: readonly (readonly [number, number, number])[] = [[120, 120, 120], [255, 60, 180], [255, 200, 10]];

function groundColour(hit: Vec3): readonly [number, number, number] {
  const white = (Math.floor(hit.x * 0.8) + 1000 + Math.floor(hit.z * 0.8) + 1000) % 2 === 0;
  return white ? [180, 180, 220] : [50, 50, 60];
}

function paint(surface: Surface, time: number, light: Vec3): void {
  const { width, height } = surface;
  const cameraPos = { x: 0.0, y: 1.5, z: -8.0 };
  const forward = normalize(sub({ x: 0, y: 0, z: 0 }, cameraPos));
  const right = normalize(cross(forward, { x: 0, y: 1, z: 0 }));
  const up = cross(right, forward);
  const aspectComp = 0.5;
  for (let y = 0; y < height; y++) {
    const py = -((y - height * 0.5) / (height * 0.5));
    for (let x = 0; x < width; x++) {
      const px = ((x - width * 0.5) / (height * 0.5)) * aspectComp;
      const rd = normalize(add(scale(forward, 1.5), add(scale(right, px), scale(up, py))));
      const { dist, objId } = raymarch(cameraPos, rd, time);
      if (dist <= 0) {
        const sky = y / height;
        surface.setRGB(x, y, ' ', 0, 0, 0, Math.round(10 * (1 - sky) + 30 * sky), Math.round(15 * (1 - sky) + 10 * sky), Math.round(35 * (1 - sky) + 60 * sky));
        continue;
      }
      const hitPoint = add(cameraPos, scale(rd, dist));
      const n = getNormal(hitPoint, time);
      const l = normalize(sub(light, hitPoint));
      const diff = Math.max(0.0, dot(n, l));
      const halfDir = normalize(add(l, normalize(sub(cameraPos, hitPoint))));
      const spec = Math.pow(Math.max(0.0, dot(n, halfDir)), 16) * 0.5;
      const shadow = getShadow(add(hitPoint, scale(n, 0.015)), l, time);
      const intensity = Math.min(1.0, 0.15 + (diff + spec) * shadow);
      const char = RAMP[Math.floor(intensity * (RAMP.length - 1))] ?? ' ';
      const [r, g, b] = objId === 3 ? groundColour(hitPoint) : (BASE[objId] ?? BASE[0] ?? [120, 120, 120]);
      surface.setRGB(x, y, char, Math.round(r * intensity), Math.round(g * intensity), Math.round(b * intensity), 0, 0, 0);
    }
  }
}

export const raymarcher: Demo<RaymarcherState> = {
  id: 'raymarcher',
  name: '3D Raymarching Engine',
  description: 'A raymarched signed-distance scene with diffuse and specular light and soft shadows',
  keys: 'w a s d or arrows move the light, h hides the panel, space pause',
  init: () => ({ lightX: 0.5, lightY: 0.54, hideUI: false }),
  update(msg, state) {
    if (msg.type !== 'key') return state;
    switch (msg.key) {
      case 'w': case 'up': return { ...state, lightY: clamp(state.lightY + 0.04) };
      case 's': case 'down': return { ...state, lightY: clamp(state.lightY - 0.04) };
      case 'a': return { ...state, lightX: clamp(state.lightX - 0.03) };
      case 'd': return { ...state, lightX: clamp(state.lightX + 0.03) };
      case 'h': return { ...state, hideUI: !state.hideUI };
      default: return state;
    }
  },
  view(state, { width, height, frame, elapsed, ctx }) {
    const surface = createSurface(width, height);
    const light = { x: (state.lightX - 0.5) * 16.0, y: state.lightY * 8.0 + 1.0, z: -3.5 };
    paint(surface, elapsed, light);
    if (!state.hideUI) {
      stampPanel(surface, [
        '  ***  BIJOU 3D RAYMARCHING SDF  ***  ',
        '─'.repeat(36),
        `  Light X:     ${light.x.toFixed(2)}`,
        `  Light Y:     ${light.y.toFixed(2)}`,
        `  Frame:       ${String(frame)}`,
        '─'.repeat(36),
        '  tab        - Switch demo',
        '  space      - Pause/Resume',
        '  w a s d    - Move the light',
        '  h          - Hide this panel',
      ], ctx, (free) => ({ x: Math.max(0, free.x - 4), y: Math.max(0, Math.min(3, free.y - 1)) }));
    }
    return surface;
  },
};

export const raymarcherDemo = defineDemo(raymarcher);
