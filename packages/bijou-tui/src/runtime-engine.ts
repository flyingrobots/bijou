/**
 * Pure runtime-engine primitives for first-class application state and view ownership.
 *
 * These helpers intentionally avoid shell-specific concerns. They model:
 *
 * - explicit state-machine snapshots
 * - explicit root-based view stacks
 * - explicit retained-layout registries
 * - immutable push/pop/replace/clear transitions
 *
 * Later cycles can layer retained layouts, input routing, command/effect
 * buffering, and shell migration on top of these objects.
 */

import type { LayoutNode } from '@flyingrobots/bijou';

// ---------------------------------------------------------------------------
// State machine
// ---------------------------------------------------------------------------

export interface RuntimeStateLike {
  readonly id: string;
}

export interface RuntimeStateMachine<State extends RuntimeStateLike> {
  readonly current: State;
  readonly previous?: State;
  readonly transitionCount: number;
}

export function createRuntimeStateMachine<State extends RuntimeStateLike>(
  initialState: State,
): RuntimeStateMachine<State> {
  return {
    current: initialState,
    previous: undefined,
    transitionCount: 0,
  };
}

export function transitionRuntimeState<State extends RuntimeStateLike>(
  machine: RuntimeStateMachine<State>,
  nextState: State,
): RuntimeStateMachine<State> {
  return {
    current: nextState,
    previous: machine.current,
    transitionCount: machine.transitionCount + 1,
  };
}

// ---------------------------------------------------------------------------
// View stack
// ---------------------------------------------------------------------------

export interface RuntimeViewLayer<Model = unknown> {
  readonly id: string;
  readonly kind: string;
  readonly dismissible: boolean;
  readonly blocksBelow: boolean;
  readonly model?: Model;
}

export interface RuntimeStackLayer<Model = unknown> extends RuntimeViewLayer<Model> {
  readonly root: boolean;
}

export interface RuntimeViewStack<Model = unknown> {
  readonly layers: readonly RuntimeStackLayer<Model>[];
}

export interface PopRuntimeViewResult<Model = unknown> {
  readonly stack: RuntimeViewStack<Model>;
  readonly popped?: RuntimeStackLayer<Model>;
}

export function createRuntimeViewStack<Model = unknown>(
  rootView: RuntimeViewLayer<Model>,
): RuntimeViewStack<Model> {
  return {
    layers: [normalizeRootView(rootView)],
  };
}

export function activeRuntimeView<Model = unknown>(
  stack: RuntimeViewStack<Model>,
): RuntimeStackLayer<Model> | undefined {
  return stack.layers[stack.layers.length - 1];
}

export function pushRuntimeView<Model = unknown>(
  stack: RuntimeViewStack<Model>,
  layer: RuntimeViewLayer<Model>,
): RuntimeViewStack<Model> {
  return {
    layers: [...stack.layers, normalizeOverlayView(layer)],
  };
}

export function popRuntimeView<Model = unknown>(
  stack: RuntimeViewStack<Model>,
): PopRuntimeViewResult<Model> {
  const top = activeRuntimeView(stack);
  if (top == null || top.root || !top.dismissible) {
    return { stack };
  }

  return {
    stack: {
      layers: stack.layers.slice(0, -1),
    },
    popped: top,
  };
}

export function replaceTopRuntimeView<Model = unknown>(
  stack: RuntimeViewStack<Model>,
  layer: RuntimeViewLayer<Model>,
): RuntimeViewStack<Model> {
  if (stack.layers.length <= 1) {
    throw new Error('replaceTopRuntimeView: cannot rewrite the root view; use replaceRuntimeRootView explicitly');
  }

  return {
    layers: [
      ...stack.layers.slice(0, -1),
      normalizeOverlayView(layer),
    ],
  };
}

export function clearRuntimeViewsToRoot<Model = unknown>(
  stack: RuntimeViewStack<Model>,
): RuntimeViewStack<Model> {
  return {
    layers: stack.layers.length === 0 ? [] : [stack.layers[0]!],
  };
}

export function replaceRuntimeRootView<Model = unknown>(
  stack: RuntimeViewStack<Model>,
  rootView: RuntimeViewLayer<Model>,
): RuntimeViewStack<Model> {
  if (stack.layers.length === 0) {
    return createRuntimeViewStack(rootView);
  }

  return {
    layers: [
      normalizeRootView(rootView),
      ...stack.layers.slice(1).map((layer) => ({
        ...layer,
        root: false,
      })),
    ],
  };
}

function normalizeRootView<Model>(
  layer: RuntimeViewLayer<Model>,
): RuntimeStackLayer<Model> {
  if (layer.dismissible) {
    throw new Error('createRuntimeViewStack: root view must not be dismissible');
  }

  return {
    ...layer,
    dismissible: false,
    root: true,
  };
}

function normalizeOverlayView<Model>(
  layer: RuntimeViewLayer<Model>,
): RuntimeStackLayer<Model> {
  return {
    ...layer,
    root: false,
  };
}

// ---------------------------------------------------------------------------
// Retained layouts
// ---------------------------------------------------------------------------

export const RUNTIME_LAYOUT_INVALIDATION_CAUSES = [
  'terminal-resize',
  'view-stack-change',
  'content-change',
  'visibility-change',
  'enablement-change',
  'overflow-change',
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

export interface RetainRuntimeLayoutOptions<Node extends LayoutNode = LayoutNode> {
  readonly viewId: string;
  readonly tree: Node;
}

export function createRuntimeRetainedLayouts<Node extends LayoutNode = LayoutNode>(): RuntimeRetainedLayouts<Node> {
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

export function listRuntimeRetainedLayouts<Node extends LayoutNode = LayoutNode>(
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
    if (retained == null) {
      continue;
    }

    const nextCauses = retained.causes.includes(cause)
      ? retained.causes
      : [...retained.causes, cause];

    if (retained.invalidated && nextCauses === retained.causes) {
      continue;
    }

    nextByViewId[viewId] = {
      ...retained,
      invalidated: true,
      causes: nextCauses,
    };
    changed = true;
  }

  return changed
    ? { byViewId: nextByViewId }
    : layouts;
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

  for (const [viewId, retained] of Object.entries(layouts.byViewId) as Array<
    [string, RuntimeRetainedLayout<Node>]
  >) {
    if (activeViewIds.has(viewId)) {
      nextByViewId[viewId] = retained;
      continue;
    }

    changed = true;
  }

  return changed
    ? { byViewId: nextByViewId }
    : layouts;
}
