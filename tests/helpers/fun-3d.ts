import type { DemoMsg } from '../../examples/fun/contract.js';

export function keyMsgs(...keys: readonly string[]): DemoMsg[] {
  return keys.map((key) => ({ type: 'key', key }));
}

export function repeatKey(key: string, count: number): DemoMsg[] {
  return Array.from({ length: count }, () => ({ type: 'key', key }));
}

/** The input in the middle of each 3D demo's recorded frames: the demo's own keys or pointer. */
export function threeDMiddle(id: string, width: number, height: number): DemoMsg[] {
  if (id === 'raymarcher') return keyMsgs('d', 'w');
  if (id === 'raycaster') return keyMsgs('w', 'w', 'w', 'd', 'd', 'f');
  if (id === 'raytracer') return [{ type: 'pointer', col: Math.floor(width / 3), row: Math.floor(height / 2) }, ...keyMsgs('-')];
  return [];
}
