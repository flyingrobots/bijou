import type { RenderMiddleware } from '../pipeline.js';
import { MotionReconciler } from '../../motion/reconciler.js';
import type { LayoutNode } from '@flyingrobots/bijou';

const reconciler = new MotionReconciler();

/**
 * Pipeline middleware that performs layout interpolation for motion components.
 */
export function motionMiddleware(): RenderMiddleware {
  return (state, next) => {
    const { ctx, dt } = state;
    
    // We assume the Layout pass has already populated targetSurface 
    // with a LayoutNode tree if it's not a raw Surface.
    // In our simplified V3, App.view might return a LayoutNode.
    
    const root = (state as any).layoutRoot as LayoutNode | undefined;
    if (root) {
      reconciler.reconcile(root, dt, ctx.io);
    }

    next();
  };
}
