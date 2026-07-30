import type { LayoutNode } from "@flyingrobots/bijou";
import type { RuntimeLayoutHit } from "./runtime-engine-input.js";

export function hitTestRuntimeLayout<Node extends LayoutNode = LayoutNode>(
  viewId: string,
  tree: Node,
  x: number,
  y: number,
): RuntimeLayoutHit<Node> | undefined {
  const path = hitTestLayoutPath(tree, x, y);
  if (path == null || path.length === 0) {
    return undefined;
  }

  const target = path.at(-1);
  if (target === undefined) return undefined;

  return {
    viewId,
    point: { x, y },
    path,
    target,
  };
}

function hitTestLayoutPath<Node extends LayoutNode = LayoutNode>(
  node: Node,
  x: number,
  y: number,
): Node[] | undefined {
  if (!pointInRect(node.rect, x, y)) {
    return undefined;
  }

  for (let index = node.children.length - 1; index >= 0; index -= 1) {
    const child = node.children[index];
    if (!isLayoutPathNode(node, child)) continue;
    const childPath = hitTestLayoutPath(child, x, y);
    if (childPath != null) {
      return [node, ...childPath];
    }
  }

  return [node];
}

function isLayoutPathNode<Node extends LayoutNode>(
  parent: Node,
  node: LayoutNode | undefined,
): node is Node {
  return node !== undefined && parent.children.includes(node);
}

function pointInRect(rect: LayoutNode["rect"], x: number, y: number): boolean {
  return (
    x >= rect.x &&
    y >= rect.y &&
    x < rect.x + rect.width &&
    y < rect.y + rect.height
  );
}
