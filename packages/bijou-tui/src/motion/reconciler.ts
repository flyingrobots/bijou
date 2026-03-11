import type { LayoutNode, LayoutRect } from '@flyingrobots/bijou';
import {
  resolveSpringConfig,
  resolveTweenConfig,
  springStep,
  tweenStep,
  type SpringConfig,
} from '../spring.js';
import type { MotionOptions, TrackedMotion } from './types.js';

type MotionNode = LayoutNode & { motion?: MotionOptions };

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
    const motion = (node as MotionNode).motion;
    const targetRect = { ...node.rect };
    let state = this.tracked.get(key);

    if (!state) {
      const initialRect = resolveInitialRect(targetRect, motion?.initial);
      state = {
        key,
        targetRect,
        currentRect: initialRect,
        velocity: { x: 0, y: 0, w: 0, h: 0 },
        mode: motion?.transition?.type ?? 'spring',
        tweenElapsedMs: 0,
        tweenFromRect: initialRect,
        done: isSameRect(initialRect, targetRect),
      };
      this.tracked.set(key, state);
    }

    const nextMode = motion?.transition?.type ?? state.mode ?? 'spring';
    const targetChanged = !isSameRect(state.targetRect, targetRect) || state.mode !== nextMode;
    if (targetChanged) {
      state.targetRect = targetRect;
      state.mode = nextMode;
      state.done = false;
      if (nextMode === 'tween') {
        state.tweenElapsedMs = 0;
        state.tweenFromRect = { ...state.currentRect };
      }
    }

    // If target changed or we are still moving, step the physics
    const needsUpdate = !isSameRect(state.currentRect, state.targetRect) || !state.done;

    if (needsUpdate && dt > 0) {
      if (state.mode === 'tween') {
        const tween = tweenStep(
          { value: state.tweenElapsedMs <= 0 ? 0 : state.tweenElapsedMs, elapsed: state.tweenElapsedMs, done: false },
          resolveTweenConfig({ duration: Math.max(1, motion?.transition?.duration ?? 300) }),
          dt * 1000,
        );
        state.tweenElapsedMs = tween.elapsed;
        state.currentRect = lerpRect(state.tweenFromRect, state.targetRect, tween.value);
        state.done = tween.done;
      } else {
        const config = resolveSpringConfig(motion?.transition?.spring ?? 'gentle');
        const nextX = this.step(state.currentRect.x, state.targetRect.x, state.velocity.x, config, dt);
        const nextY = this.step(state.currentRect.y, state.targetRect.y, state.velocity.y, config, dt);
        const nextW = this.step(state.currentRect.width, state.targetRect.width, state.velocity.w, config, dt);
        const nextH = this.step(state.currentRect.height, state.targetRect.height, state.velocity.h, config, dt);

        state.currentRect = { x: nextX.val, y: nextY.val, width: nextW.val, height: nextH.val };
        state.velocity = { x: nextX.vel, y: nextY.vel, w: nextW.vel, h: nextH.vel };
        state.done = nextX.done && nextY.done && nextW.done && nextH.done;
      }
    }

    // Apply interpolated rect to the layout node for the paint pass
    node.rect = roundRect(state.currentRect);
  }

  private step(curr: number, target: number, vel: number, config: SpringConfig, dt: number) {
    const s = springStep({ value: curr, velocity: vel, done: false }, target, config, dt);
    return { val: s.value, vel: s.velocity, done: s.done };
  }
}

function isSameRect(a: LayoutRect, b: LayoutRect): boolean {
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}

function resolveInitialRect(target: LayoutRect, initial?: Partial<LayoutRect>): LayoutRect {
  if (initial == null) return { ...target };
  return {
    x: target.x + (initial.x ?? 0),
    y: target.y + (initial.y ?? 0),
    width: initial.width ?? target.width,
    height: initial.height ?? target.height,
  };
}

function lerpRect(from: LayoutRect, to: LayoutRect, progress: number): LayoutRect {
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

function roundRect(rect: LayoutRect): LayoutRect {
  return {
    x: Math.round(rect.x),
    y: Math.round(rect.y),
    width: Math.max(0, Math.round(rect.width)),
    height: Math.max(0, Math.round(rect.height)),
  };
}
