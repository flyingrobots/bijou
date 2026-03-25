import {
  createSurface,
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

export interface LayoutLocalization {
  readonly width: number;
  readonly height: number;
  readonly dx: number;
  readonly dy: number;
}

export function localizeLayoutNode(node: LayoutNode): LocalizedLayoutNode {
  const localization = localizeLayout(node);
  return {
    node: localization.dx === 0 && localization.dy === 0
      ? node
      : translateLayoutNode(node, localization.dx, localization.dy),
    width: localization.width,
    height: localization.height,
  };
}

export function layoutNodeToSurface(node: LayoutNode): Surface {
  const localization = localizeLayout(node);
  const surface = createSurface(localization.width, localization.height);
  paintLayoutNodeWithOffset(surface, node, localization.dx, localization.dy);
  return surface;
}

export function localizeLayout(node: LayoutNode): LayoutLocalization {
  const bounds = measureLayoutBounds(node);
  return {
    width: Math.max(0, bounds.maxX - bounds.minX),
    height: Math.max(0, bounds.maxY - bounds.minY),
    dx: -bounds.minX,
    dy: -bounds.minY,
  };
}

export function paintLayoutNodeWithOffset(
  target: Surface,
  node: LayoutNode,
  dx: number,
  dy: number,
): void {
  if (node.surface) {
    target.blit(node.surface, node.rect.x + dx, node.rect.y + dy);
  }

  for (const child of node.children) {
    paintLayoutNodeWithOffset(target, child, dx, dy);
  }
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
