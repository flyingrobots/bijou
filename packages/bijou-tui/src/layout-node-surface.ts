import {
  createSurface,
  paintLayoutNode,
  type LayoutNode,
  type Surface,
} from '@flyingrobots/bijou';

interface LayoutBounds {
  readonly minX: number;
  readonly minY: number;
  readonly maxX: number;
  readonly maxY: number;
}

export interface LocalizedLayoutNode {
  readonly node: LayoutNode;
  readonly width: number;
  readonly height: number;
}

export function localizeLayoutNode(node: LayoutNode): LocalizedLayoutNode {
  const bounds = measureLayoutBounds(node);
  return {
    node: translateLayoutNode(node, -bounds.minX, -bounds.minY),
    width: Math.max(0, bounds.maxX - bounds.minX),
    height: Math.max(0, bounds.maxY - bounds.minY),
  };
}

export function layoutNodeToSurface(node: LayoutNode): Surface {
  const localized = localizeLayoutNode(node);
  const surface = createSurface(localized.width, localized.height);
  paintLayoutNode(surface, localized.node);
  return surface;
}

function measureLayoutBounds(node: LayoutNode): LayoutBounds {
  let minX = node.rect.x;
  let minY = node.rect.y;
  let maxX = node.rect.x + node.rect.width;
  let maxY = node.rect.y + node.rect.height;

  for (const child of node.children) {
    const childBounds = measureLayoutBounds(child);
    minX = Math.min(minX, childBounds.minX);
    minY = Math.min(minY, childBounds.minY);
    maxX = Math.max(maxX, childBounds.maxX);
    maxY = Math.max(maxY, childBounds.maxY);
  }

  return { minX, minY, maxX, maxY };
}

function translateLayoutNode(node: LayoutNode, dx: number, dy: number): LayoutNode {
  return {
    ...node,
    rect: {
      x: node.rect.x + dx,
      y: node.rect.y + dy,
      width: node.rect.width,
      height: node.rect.height,
    },
    children: node.children.map((child) => translateLayoutNode(child, dx, dy)),
  };
}
