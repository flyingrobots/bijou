import type { LayoutNode, LayoutRect } from '@flyingrobots/bijou';
import { SPRING_PRESETS, springStep } from '../spring.js';
import type { SpringConfig } from '../spring.js';
import type { TrackedMotion } from './types.js';

/**
 * Registry of active motion components across frames.
 */
export class MotionReconciler {
  private tracked = new Map<string, TrackedMotion>();

  /**
   * Reconcile the target layout tree with the last known positions.
   * If a node with a known key has moved, it initiates/continues a transition.
   */
  reconcile(node: LayoutNode, dt: number): void {
    if (node.id) {
      this.processNode(node, dt);
    }

    for (const child of node.children) {
      this.reconcile(child, dt);
    }
  }

  private processNode(node: LayoutNode, dt: number): void {
    const key = node.id!;
    let state = this.tracked.get(key);

    if (!state) {
      // First appearance: snap to target unless 'initial' is provided
      // TODO: Handle initial properties from metadata
      state = {
        key,
        targetRect: { ...node.rect },
        currentRect: { ...node.rect },
        velocity: { x: 0, y: 0, w: 0, h: 0 },
        done: true,
      };
      this.tracked.set(key, state);
    }

    // Update target
    state.targetRect = { ...node.rect };

    // If target changed or we are still moving, step the physics
    const needsUpdate = !isSameRect(state.currentRect, state.targetRect) || !state.done;

    if (needsUpdate && dt > 0) {
      const config = SPRING_PRESETS.gentle; // Default
      
      const nextX = this.step(state.currentRect.x, state.targetRect.x, state.velocity.x, config, dt);
      const nextY = this.step(state.currentRect.y, state.targetRect.y, state.velocity.y, config, dt);
      const nextW = this.step(state.currentRect.width, state.targetRect.width, state.velocity.w, config, dt);
      const nextH = this.step(state.currentRect.height, state.targetRect.height, state.velocity.h, config, dt);

      state.currentRect = { x: nextX.val, y: nextY.val, width: nextW.val, height: nextH.val };
      state.velocity = { x: nextX.vel, y: nextY.vel, w: nextW.vel, h: nextH.vel };
      state.done = nextX.done && nextY.done && nextW.done && nextH.done;
    }

    // Apply interpolated rect to the layout node for the paint pass
    node.rect = { ...state.currentRect };
  }

  private step(curr: number, target: number, vel: number, config: SpringConfig, dt: number) {
    const s = springStep({ value: curr, velocity: vel, done: false }, target, config, dt);
    return { val: s.value, vel: s.velocity, done: s.done };
  }
}

function isSameRect(a: LayoutRect, b: LayoutRect): boolean {
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}
