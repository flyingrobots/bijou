import type { LayoutNode, Surface } from '@flyingrobots/bijou';
import type { MotionOptions } from './types.js';

type MotionNode = LayoutNode & { motion?: MotionOptions };

/**
 * A declarative wrapper that enables automatic layout transitions for a component.
 * 
 * It wraps the component's rendered output into a LayoutNode with a unique ID,
 * allowing the MotionReconciler to track its position across frames and interpolate.
 * 
 * @param options - Motion configuration (key, transition, initial).
 * @param content - The rendered surface or layout node to animate.
 * @returns A LayoutNode tagged for motion reconciliation.
 */
export function motion(
  options: MotionOptions,
  content: Surface | LayoutNode
): LayoutNode {
  const isSurface = (c: any): c is Surface => !!c.cells;

  if (isSurface(content)) {
    return {
      id: options.key,
      type: 'Motion',
      classes: ['motion'],
      rect: { x: 0, y: 0, width: content.width, height: content.height },
      children: [],
      surface: content,
      motion: options,
    } as MotionNode;
  }

  // If already a layout node, just ensure it has the correct ID
  return {
    ...content,
    id: options.key,
    motion: options,
  } as MotionNode;
}
