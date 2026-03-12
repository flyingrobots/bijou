import type { RenderMiddleware } from '../pipeline.js';
import type { LayoutNode, Surface } from '@flyingrobots/bijou';

/**
 * Pipeline middleware that paints a LayoutNode tree onto the target surface.
 */
export function paintMiddleware(): RenderMiddleware {
  return (state, next) => {
    const root = (state as any).layoutRoot as LayoutNode | undefined;
    if (root) {
      paintNode(state.targetSurface, root);
    }
    next();
  };
}

function paintNode(target: Surface, node: LayoutNode) {
  if (node.surface) {
    target.blit(node.surface, node.rect.x, node.rect.y);
  }

  for (const child of node.children) {
    paintNode(target, child);
  }
}
