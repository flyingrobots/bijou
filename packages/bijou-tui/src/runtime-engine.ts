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

import type { LayoutNode, LayoutRect, Surface } from '@flyingrobots/bijou';

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

// ---------------------------------------------------------------------------
// Input routing
// ---------------------------------------------------------------------------

export const RUNTIME_POINTER_ACTIONS = [
  'press',
  'release',
  'move',
  'scroll-up',
  'scroll-down',
] as const;

export const RUNTIME_POINTER_BUTTONS = [
  'left',
  'middle',
  'right',
] as const;

export type RuntimePointerAction = (typeof RUNTIME_POINTER_ACTIONS)[number];
export type RuntimePointerButton = (typeof RUNTIME_POINTER_BUTTONS)[number];

export interface RuntimeKeyInputEvent {
  readonly kind: 'key';
  readonly key: string;
}

export interface RuntimePointerInputEvent {
  readonly kind: 'pointer';
  readonly action: RuntimePointerAction;
  readonly x: number;
  readonly y: number;
  readonly button?: RuntimePointerButton;
}

export type RuntimeInputEvent =
  | RuntimeKeyInputEvent
  | RuntimePointerInputEvent;

export interface RuntimeLayoutHit<Node extends LayoutNode = LayoutNode> {
  readonly viewId: string;
  readonly point: {
    readonly x: number;
    readonly y: number;
  };
  readonly path: readonly Node[];
  readonly target: Node;
}

export interface RuntimeInputRouteContext<
  Node extends LayoutNode = LayoutNode,
  Model = unknown,
> {
  readonly layer: RuntimeStackLayer<Model>;
  readonly retainedLayout?: RuntimeRetainedLayout<Node>;
  readonly event: RuntimeInputEvent;
  readonly hit?: RuntimeLayoutHit<Node>;
}

export interface RuntimeInputRouteOutcome<Command = unknown, Effect = unknown> {
  readonly handled?: boolean;
  readonly bubble?: boolean;
  readonly stop?: boolean;
  readonly commands?: readonly Command[];
  readonly effects?: readonly Effect[];
}

export interface RuntimeInputRouteResult<
  Command = unknown,
  Effect = unknown,
  Node extends LayoutNode = LayoutNode,
> {
  readonly handled: boolean;
  readonly commands: readonly Command[];
  readonly effects: readonly Effect[];
  readonly visitedViewIds: readonly string[];
  readonly handledByViewId?: string;
  readonly handledByNodeId?: string;
  readonly stoppedByViewId?: string;
  readonly hit?: RuntimeLayoutHit<Node>;
}

export interface RuntimeCommandBuffer<Command = unknown> {
  readonly items: readonly Command[];
}

export interface RuntimeEffectBuffer<Effect = unknown> {
  readonly items: readonly Effect[];
}

export interface RuntimeBuffers<Command = unknown, Effect = unknown> {
  readonly commands: RuntimeCommandBuffer<Command>;
  readonly effects: RuntimeEffectBuffer<Effect>;
}

export interface ApplyRuntimeCommandBufferResult<State, Command = unknown> {
  readonly state: State;
  readonly applied: readonly Command[];
  readonly buffer: RuntimeCommandBuffer<Command>;
}

export interface ExecuteRuntimeEffectBufferResult<Effect = unknown> {
  readonly executed: readonly Effect[];
  readonly buffer: RuntimeEffectBuffer<Effect>;
}

export const RUNTIME_COMPONENT_SIZE_MODES = [
  'content',
  'fill',
  'fixed',
] as const;

export const RUNTIME_COMPONENT_ALIGNMENTS = [
  'start',
  'center',
  'end',
  'stretch',
] as const;

export const RUNTIME_COMPONENT_INLINE_OVERFLOW_POLICIES = [
  'clip',
  'truncate',
  'viewport',
] as const;

export const RUNTIME_COMPONENT_BLOCK_OVERFLOW_POLICIES = [
  'wrap',
  'stack',
  'clip',
  'viewport',
] as const;

export type RuntimeComponentSizeMode =
  (typeof RUNTIME_COMPONENT_SIZE_MODES)[number];

export type RuntimeComponentAlignment =
  (typeof RUNTIME_COMPONENT_ALIGNMENTS)[number];

export type RuntimeComponentInlineOverflowPolicy =
  (typeof RUNTIME_COMPONENT_INLINE_OVERFLOW_POLICIES)[number];

export type RuntimeComponentBlockOverflowPolicy =
  (typeof RUNTIME_COMPONENT_BLOCK_OVERFLOW_POLICIES)[number];

export type RuntimeComponentKeyBindings = readonly string[] | 'any';
export type RuntimeComponentPointerBindings =
  readonly RuntimePointerAction[] | 'any';

export interface RuntimeComponentLayoutRules {
  readonly width: RuntimeComponentSizeMode;
  readonly height: RuntimeComponentSizeMode;
  readonly alignX: RuntimeComponentAlignment;
  readonly alignY: RuntimeComponentAlignment;
  readonly minWidth?: number;
  readonly maxWidth?: number;
  readonly minHeight?: number;
  readonly maxHeight?: number;
  readonly fixedWidth?: number;
  readonly fixedHeight?: number;
}

export interface RuntimeComponentOverflowRules {
  readonly inline: RuntimeComponentInlineOverflowPolicy;
  readonly block: RuntimeComponentBlockOverflowPolicy;
}

export interface RuntimeComponentInteractionContract<
  Command = unknown,
  Effect = unknown,
  Model = unknown,
> {
  readonly enabled: boolean;
  readonly focusable?: boolean;
  readonly keyBindings?: RuntimeComponentKeyBindings;
  readonly pointerActions?: RuntimeComponentPointerBindings;
  readonly scrollable?: boolean;
  readonly handleInput?: (
    context: RuntimeComponentInputContext<Command, Effect, Model>,
  ) => RuntimeInputRouteOutcome<Command, Effect> | undefined;
}

export interface RuntimeComponentContract<
  Command = unknown,
  Effect = unknown,
  Model = unknown,
> {
  readonly componentId: string;
  readonly layout: RuntimeComponentLayoutRules;
  readonly overflow: RuntimeComponentOverflowRules;
  readonly interaction?: RuntimeComponentInteractionContract<
    Command,
    Effect,
    Model
  >;
}

export interface RuntimeComponentLayoutNode<
  Command = unknown,
  Effect = unknown,
  Model = unknown,
> extends LayoutNode {
  readonly component?: RuntimeComponentContract<Command, Effect, Model>;
  readonly children: RuntimeComponentLayoutNode<Command, Effect, Model>[];
}

export interface RuntimeComponentInputContext<
  Command = unknown,
  Effect = unknown,
  Model = unknown,
  Node extends RuntimeComponentLayoutNode<
    Command,
    Effect,
    Model
  > = RuntimeComponentLayoutNode<Command, Effect, Model>,
> extends RuntimeInputRouteContext<Node, Model> {
  readonly node: Node;
  readonly component: RuntimeComponentContract<Command, Effect, Model>;
}

export interface CreateRuntimeComponentContractOptions<
  Command = unknown,
  Effect = unknown,
  Model = unknown,
> {
  readonly componentId: string;
  readonly layout?: Partial<RuntimeComponentLayoutRules>;
  readonly overflow?: Partial<RuntimeComponentOverflowRules>;
  readonly interaction?: Omit<
    RuntimeComponentInteractionContract<Command, Effect, Model>,
    'enabled'
  > & {
    readonly enabled?: boolean;
  };
}

export interface CreateRuntimeComponentNodeOptions<
  Command = unknown,
  Effect = unknown,
  Model = unknown,
> {
  readonly id?: string;
  readonly type?: string;
  readonly classes?: string[];
  readonly rect: LayoutRect;
  readonly surface?: Surface;
  readonly children?: readonly RuntimeComponentLayoutNode<
    Command,
    Effect,
    Model
  >[];
  readonly component: RuntimeComponentContract<Command, Effect, Model>;
}

export type RuntimeInputHandler<
  Node extends LayoutNode = LayoutNode,
  Model = unknown,
  Command = unknown,
  Effect = unknown,
> = (
  context: RuntimeInputRouteContext<Node, Model>,
) => RuntimeInputRouteOutcome<Command, Effect> | undefined;

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

  return {
    viewId,
    point: { x, y },
    path,
    target: path[path.length - 1]!,
  };
}

export function routeRuntimeInput<
  Node extends LayoutNode = LayoutNode,
  Model = unknown,
  Command = unknown,
  Effect = unknown,
>(
  stack: RuntimeViewStack<Model>,
  layouts: RuntimeRetainedLayouts<Node>,
  event: RuntimeInputEvent,
  handle: RuntimeInputHandler<Node, Model, Command, Effect>,
): RuntimeInputRouteResult<Command, Effect, Node> {
  const visitedViewIds: string[] = [];
  const commands: Command[] = [];
  const effects: Effect[] = [];
  let lastHit: RuntimeLayoutHit<Node> | undefined;

  for (let index = stack.layers.length - 1; index >= 0; index -= 1) {
    const layer = stack.layers[index]!;
    visitedViewIds.push(layer.id);

    const retainedLayout = getRuntimeRetainedLayout(layouts, layer.id);
    const hit = event.kind === 'pointer' && retainedLayout != null
      ? hitTestRuntimeLayout(layer.id, retainedLayout.tree, event.x, event.y)
      : undefined;

    if (hit != null) {
      lastHit = hit;
    }

    const outcome = handle({
      layer,
      retainedLayout,
      event,
      hit,
    });

    if (outcome?.commands != null) {
      commands.push(...outcome.commands);
    }
    if (outcome?.effects != null) {
      effects.push(...outcome.effects);
    }

    if (outcome?.handled) {
      return {
        handled: true,
        commands,
        effects,
        visitedViewIds,
        handledByViewId: layer.id,
        handledByNodeId: hit?.target.id,
        hit: hit ?? lastHit,
      };
    }

    if (outcome?.stop) {
      return {
        handled: false,
        commands,
        effects,
        visitedViewIds,
        stoppedByViewId: layer.id,
        hit: hit ?? lastHit,
      };
    }

    if (!outcome?.bubble && layer.blocksBelow) {
      return {
        handled: false,
        commands,
        effects,
        visitedViewIds,
        stoppedByViewId: layer.id,
        hit: hit ?? lastHit,
      };
    }
  }

  return {
    handled: false,
    commands,
    effects,
    visitedViewIds,
    hit: lastHit,
  };
}

export function createRuntimeCommandBuffer<Command = unknown>(
  items: readonly Command[] = [],
): RuntimeCommandBuffer<Command> {
  return {
    items: [...items],
  };
}

export function createRuntimeEffectBuffer<Effect = unknown>(
  items: readonly Effect[] = [],
): RuntimeEffectBuffer<Effect> {
  return {
    items: [...items],
  };
}

export function createRuntimeBuffers<Command = unknown, Effect = unknown>(): RuntimeBuffers<Command, Effect> {
  return {
    commands: createRuntimeCommandBuffer<Command>(),
    effects: createRuntimeEffectBuffer<Effect>(),
  };
}

export function appendRuntimeCommands<Command = unknown>(
  buffer: RuntimeCommandBuffer<Command>,
  commands: readonly Command[],
): RuntimeCommandBuffer<Command> {
  if (commands.length === 0) {
    return buffer;
  }

  return {
    items: [...buffer.items, ...commands],
  };
}

export function appendRuntimeEffects<Effect = unknown>(
  buffer: RuntimeEffectBuffer<Effect>,
  effects: readonly Effect[],
): RuntimeEffectBuffer<Effect> {
  if (effects.length === 0) {
    return buffer;
  }

  return {
    items: [...buffer.items, ...effects],
  };
}

export function bufferRuntimeRouteResult<
  Command = unknown,
  Effect = unknown,
  Result extends {
    readonly commands: readonly Command[];
    readonly effects: readonly Effect[];
  } = RuntimeInputRouteResult<Command, Effect>,
>(
  buffers: RuntimeBuffers<Command, Effect>,
  result: Result,
): RuntimeBuffers<Command, Effect> {
  const nextCommands = appendRuntimeCommands(buffers.commands, result.commands);
  const nextEffects = appendRuntimeEffects(buffers.effects, result.effects);

  if (nextCommands === buffers.commands && nextEffects === buffers.effects) {
    return buffers;
  }

  return {
    commands: nextCommands,
    effects: nextEffects,
  };
}

export function applyRuntimeCommandBuffer<State, Command = unknown>(
  state: State,
  buffer: RuntimeCommandBuffer<Command>,
  apply: (state: State, command: Command) => State,
): ApplyRuntimeCommandBufferResult<State, Command> {
  let nextState = state;

  for (const command of buffer.items) {
    nextState = apply(nextState, command);
  }

  return {
    state: nextState,
    applied: [...buffer.items],
    buffer: createRuntimeCommandBuffer<Command>(),
  };
}

export async function executeRuntimeEffectBuffer<Effect = unknown>(
  buffer: RuntimeEffectBuffer<Effect>,
  execute: (effect: Effect) => void | Promise<void>,
): Promise<ExecuteRuntimeEffectBufferResult<Effect>> {
  for (const effect of buffer.items) {
    await execute(effect);
  }

  return {
    executed: [...buffer.items],
    buffer: createRuntimeEffectBuffer<Effect>(),
  };
}

export function createRuntimeComponentContract<
  Command = unknown,
  Effect = unknown,
  Model = unknown,
>(
  options: CreateRuntimeComponentContractOptions<Command, Effect, Model>,
): RuntimeComponentContract<Command, Effect, Model> {
  return {
    componentId: options.componentId,
    layout: {
      width: options.layout?.width ?? 'content',
      height: options.layout?.height ?? 'content',
      alignX: options.layout?.alignX ?? 'start',
      alignY: options.layout?.alignY ?? 'start',
      minWidth: options.layout?.minWidth,
      maxWidth: options.layout?.maxWidth,
      minHeight: options.layout?.minHeight,
      maxHeight: options.layout?.maxHeight,
      fixedWidth: options.layout?.fixedWidth,
      fixedHeight: options.layout?.fixedHeight,
    },
    overflow: {
      inline: options.overflow?.inline ?? 'clip',
      block: options.overflow?.block ?? 'wrap',
    },
    interaction: options.interaction == null
      ? undefined
      : {
          ...options.interaction,
          enabled: options.interaction.enabled ?? true,
        },
  };
}

export function createRuntimeComponentNode<
  Command = unknown,
  Effect = unknown,
  Model = unknown,
>(
  options: CreateRuntimeComponentNodeOptions<Command, Effect, Model>,
): RuntimeComponentLayoutNode<Command, Effect, Model> {
  return {
    id: options.id,
    type: options.type,
    classes: options.classes == null ? undefined : [...options.classes],
    rect: options.rect,
    surface: options.surface,
    children: options.children == null ? [] : [...options.children],
    component: options.component,
  };
}

export function getRuntimeComponentContract<
  Command = unknown,
  Effect = unknown,
  Model = unknown,
>(
  node: RuntimeComponentLayoutNode<Command, Effect, Model>,
): RuntimeComponentContract<Command, Effect, Model> | undefined {
  return node.component;
}

export function runtimeComponentAcceptsInput<
  Command = unknown,
  Effect = unknown,
  Model = unknown,
>(
  component: RuntimeComponentContract<Command, Effect, Model>,
  event: RuntimeInputEvent,
): boolean {
  const interaction = component.interaction;
  if (interaction == null || interaction.enabled === false) {
    return false;
  }

  if (event.kind === 'key') {
    const bindings = interaction.keyBindings;
    return bindings === 'any'
      || (Array.isArray(bindings) && bindings.includes(event.key));
  }

  if (isScrollRuntimePointerAction(event.action)) {
    return interaction.scrollable === true
      && component.overflow.block === 'viewport';
  }

  const bindings = interaction.pointerActions;
  return bindings === 'any'
    || (Array.isArray(bindings) && bindings.includes(event.action));
}

export function resolveRuntimeInteractiveTarget<
  Command = unknown,
  Effect = unknown,
  Model = unknown,
  Node extends RuntimeComponentLayoutNode<
    Command,
    Effect,
    Model
  > = RuntimeComponentLayoutNode<Command, Effect, Model>,
>(
  hit: RuntimeLayoutHit<Node>,
  event: RuntimeInputEvent,
): Node | undefined {
  for (let index = hit.path.length - 1; index >= 0; index -= 1) {
    const node = hit.path[index];
    if (node == null || node.component == null) {
      continue;
    }

    if (runtimeComponentAcceptsInput(node.component, event)) {
      return node;
    }
  }

  return undefined;
}

export function handleRuntimeComponentInput<
  Command = unknown,
  Effect = unknown,
  Model = unknown,
  Node extends RuntimeComponentLayoutNode<
    Command,
    Effect,
    Model
  > = RuntimeComponentLayoutNode<Command, Effect, Model>,
>(
  context: RuntimeComponentInputContext<Command, Effect, Model, Node>,
): RuntimeInputRouteOutcome<Command, Effect> | undefined {
  if (!runtimeComponentAcceptsInput(context.component, context.event)) {
    return undefined;
  }

  return context.component.interaction?.handleInput?.(context);
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
    const child = node.children[index] as Node;
    const childPath = hitTestLayoutPath(child, x, y);
    if (childPath != null) {
      return [node, ...childPath];
    }
  }

  return [node];
}

function pointInRect(
  rect: LayoutNode['rect'],
  x: number,
  y: number,
): boolean {
  return (
    x >= rect.x
    && y >= rect.y
    && x < rect.x + rect.width
    && y < rect.y + rect.height
  );
}

function isScrollRuntimePointerAction(
  action: RuntimePointerAction,
): boolean {
  return action === 'scroll-up' || action === 'scroll-down';
}
