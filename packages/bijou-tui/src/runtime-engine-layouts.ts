import type { LayoutNode } from "@flyingrobots/bijou";
import type { RuntimeViewStack } from "./runtime-engine-view-stack.js";

export const RUNTIME_LAYOUT_INVALIDATION_CAUSES = [
  "terminal-resize",
  "view-stack-change",
  "content-change",
  "visibility-change",
  "enablement-change",
  "overflow-change",
] as const;

export type RuntimeLayoutInvalidationCause =
  (typeof RUNTIME_LAYOUT_INVALIDATION_CAUSES)[number];

export interface RuntimeRetainedLayout<Node extends LayoutNode = LayoutNode> {
  readonly viewId: string;
  readonly tree: Node;
  readonly version: number;
  readonly invalidated: boolean;
  readonly causes: readonly RuntimeLayoutInvalidationCause[];
}

export interface RuntimeRetainedLayouts<Node extends LayoutNode = LayoutNode> {
  readonly byViewId: Readonly<Record<string, RuntimeRetainedLayout<Node>>>;
}

export interface RetainRuntimeLayoutOptions<
  Node extends LayoutNode = LayoutNode,
> {
  readonly viewId: string;
  readonly tree: Node;
}

export function createRuntimeRetainedLayouts<
  Node extends LayoutNode = LayoutNode,
>(): RuntimeRetainedLayouts<Node> {
  return {
    byViewId: {},
  };
}

export function getRuntimeRetainedLayout<Node extends LayoutNode = LayoutNode>(
  layouts: RuntimeRetainedLayouts<Node>,
  viewId: string,
): RuntimeRetainedLayout<Node> | undefined {
  return layouts.byViewId[viewId];
}

export function listRuntimeRetainedLayouts<
  Node extends LayoutNode = LayoutNode,
>(
  layouts: RuntimeRetainedLayouts<Node>,
): readonly RuntimeRetainedLayout<Node>[] {
  return Object.values(layouts.byViewId);
}

export function retainRuntimeLayout<Node extends LayoutNode = LayoutNode>(
  layouts: RuntimeRetainedLayouts<Node>,
  options: RetainRuntimeLayoutOptions<Node>,
): RuntimeRetainedLayouts<Node> {
  const previous = layouts.byViewId[options.viewId];

  return {
    byViewId: {
      ...layouts.byViewId,
      [options.viewId]: {
        viewId: options.viewId,
        tree: options.tree,
        version: previous == null ? 1 : previous.version + 1,
        invalidated: false,
        causes: [],
      },
    },
  };
}

export function invalidateRuntimeLayouts<Node extends LayoutNode = LayoutNode>(
  layouts: RuntimeRetainedLayouts<Node>,
  cause: RuntimeLayoutInvalidationCause,
  viewIds?: readonly string[],
): RuntimeRetainedLayouts<Node> {
  const targetIds = viewIds ?? Object.keys(layouts.byViewId);
  const nextByViewId: Record<string, RuntimeRetainedLayout<Node>> = {
    ...layouts.byViewId,
  };
  let changed = false;

  for (const viewId of targetIds) {
    const retained = nextByViewId[viewId];
    if (retained == null) continue;
    const nextCauses = retained.causes.includes(cause)
      ? retained.causes
      : [...retained.causes, cause];
    if (retained.invalidated && nextCauses === retained.causes) continue;
    nextByViewId[viewId] = {
      ...retained,
      invalidated: true,
      causes: nextCauses,
    };
    changed = true;
  }

  return changed ? { byViewId: nextByViewId } : layouts;
}

export function dropInactiveRuntimeLayouts<
  Node extends LayoutNode = LayoutNode,
  Model = unknown,
>(
  layouts: RuntimeRetainedLayouts<Node>,
  stack: RuntimeViewStack<Model>,
): RuntimeRetainedLayouts<Node> {
  const activeViewIds = new Set(stack.layers.map((layer) => layer.id));
  const nextByViewId: Record<string, RuntimeRetainedLayout<Node>> = {};
  let changed = false;

  for (const [viewId, retained] of Object.entries(layouts.byViewId)) {
    if (activeViewIds.has(viewId)) {
      nextByViewId[viewId] = retained;
      continue;
    }
    changed = true;
  }

  return changed ? { byViewId: nextByViewId } : layouts;
}
