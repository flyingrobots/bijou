import type { LayoutNode, LayoutRect } from '@flyingrobots/bijou';
import type { MotionOptions } from './types.js';

type MotionNode = LayoutNode & { readonly motion?: MotionOptions };

export function hasMotion(node: LayoutNode): node is MotionNode {
  return 'motion' in node;
}

export function isSameRect(a: LayoutRect, b: LayoutRect): boolean {
  return (
    a.x === b.x &&
    a.y === b.y &&
    a.width === b.width &&
    a.height === b.height
  );
}

export function resolveInitialRect(
  target: LayoutRect,
  initial?: Partial<LayoutRect>,
): LayoutRect {
  if (initial == null) return { ...target };
  return {
    x: target.x + (initial.x ?? 0),
    y: target.y + (initial.y ?? 0),
    width: initial.width ?? target.width,
    height: initial.height ?? target.height,
  };
}

export function lerpRect(
  from: LayoutRect,
  to: LayoutRect,
  progress: number,
): LayoutRect {
  return {
    x: lerp(from.x, to.x, progress),
    y: lerp(from.y, to.y, progress),
    width: lerp(from.width, to.width, progress),
    height: lerp(from.height, to.height, progress),
  };
}

function lerp(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}

export function roundRect(rect: LayoutRect): LayoutRect {
  return {
    x: Math.round(rect.x),
    y: Math.round(rect.y),
    width: Math.max(0, Math.round(rect.width)),
    height: Math.max(0, Math.round(rect.height)),
  };
}
