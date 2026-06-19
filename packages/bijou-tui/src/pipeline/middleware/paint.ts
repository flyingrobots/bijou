import type { RenderMiddleware } from '../pipeline.js';
import { getRenderLayoutRoot } from '../pipeline.js';
import type { LayoutNode, Surface } from '@flyingrobots/bijou';

/**
 * Pipeline middleware that paints a LayoutNode tree onto the target surface.
 */
export function paintMiddleware(): RenderMiddleware {
  return (state, next) => {
    const root = getRenderLayoutRoot(state) ?? getLegacyLayoutRoot(state);
    if (root) {
      paintNode(state.targetSurface, root);
    }
    next();
  };
}

function getLegacyLayoutRoot(state: unknown): LayoutNode | undefined {
  if (typeof state !== 'object' || state === null || !('layoutRoot' in state)) return undefined;
  return isLayoutNode(state.layoutRoot) ? state.layoutRoot : undefined;
}

function isLayoutNode(value: unknown): value is LayoutNode {
  return typeof value === 'object' && value !== null && 'rect' in value && 'children' in value;
}

function paintNode(target: Surface, node: LayoutNode) {
  if (node.surface) {
    target.blit(node.surface, node.rect.x, node.rect.y);
  }

  for (const child of node.children) {
    paintNode(target, child);
  }
}
