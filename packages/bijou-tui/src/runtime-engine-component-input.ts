import type {
  RuntimeComponentContract,
  RuntimeComponentInputContext,
  RuntimeComponentLayoutNode,
} from "./runtime-engine-component-contract.js";
import type {
  RuntimeInputEvent,
  RuntimeInputRouteOutcome,
  RuntimeLayoutHit,
  RuntimePointerAction,
} from "./runtime-engine-input.js";

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
  if (!interaction?.enabled) return false;
  if (event.kind === "key") {
    const bindings = interaction.keyBindings;
    return (
      bindings === "any" ||
      (Array.isArray(bindings) && bindings.includes(event.key))
    );
  }
  if (isScrollRuntimePointerAction(event.action)) {
    return (
      interaction.scrollable === true && component.overflow.block === "viewport"
    );
  }
  const bindings = interaction.pointerActions;
  return (
    bindings === "any" ||
    (Array.isArray(bindings) && bindings.includes(event.action))
  );
}

export function resolveRuntimeInteractiveTarget<
  Command = unknown,
  Effect = unknown,
  Model = unknown,
  Node extends RuntimeComponentLayoutNode<Command, Effect, Model> =
    RuntimeComponentLayoutNode<Command, Effect, Model>,
>(hit: RuntimeLayoutHit<Node>, event: RuntimeInputEvent): Node | undefined {
  for (let index = hit.path.length - 1; index >= 0; index -= 1) {
    const node = hit.path[index];
    if (node?.component == null) continue;
    if (runtimeComponentAcceptsInput(node.component, event)) return node;
  }
  return undefined;
}

export function handleRuntimeComponentInput<
  Command = unknown,
  Effect = unknown,
  Model = unknown,
  Node extends RuntimeComponentLayoutNode<Command, Effect, Model> =
    RuntimeComponentLayoutNode<Command, Effect, Model>,
>(
  context: RuntimeComponentInputContext<Command, Effect, Model, Node>,
): RuntimeInputRouteOutcome<Command, Effect> | undefined {
  if (!runtimeComponentAcceptsInput(context.component, context.event)) {
    return undefined;
  }
  return context.component.interaction?.handleInput?.(context);
}

function isScrollRuntimePointerAction(action: RuntimePointerAction): boolean {
  return action === "scroll-up" || action === "scroll-down";
}
