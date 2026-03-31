/**
 * Pure runtime-engine primitives for first-class application state and view ownership.
 *
 * These helpers intentionally avoid shell-specific concerns. They model:
 *
 * - explicit state-machine snapshots
 * - explicit root-based view stacks
 * - immutable push/pop/replace/clear transitions
 *
 * Later cycles can layer retained layouts, input routing, command/effect
 * buffering, and shell migration on top of these objects.
 */

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
