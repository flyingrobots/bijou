import type { LayoutNode, Surface } from '../../ports/surface.js';

export function paintLayoutNode(target: Surface, node: LayoutNode): void {
  if (node.surface) {
    target.blit(node.surface, node.rect.x, node.rect.y);
  }
  for (const child of node.children) {
    paintLayoutNode(target, child);
  }
}
