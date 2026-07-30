import type {
  CreateRuntimeComponentContractOptions,
  CreateRuntimeComponentNodeOptions,
  RuntimeComponentContract,
  RuntimeComponentLayoutNode,
} from "./runtime-engine-component-contract.js";

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
      width: options.layout?.width ?? "content",
      height: options.layout?.height ?? "content",
      alignX: options.layout?.alignX ?? "start",
      alignY: options.layout?.alignY ?? "start",
      minWidth: options.layout?.minWidth,
      maxWidth: options.layout?.maxWidth,
      minHeight: options.layout?.minHeight,
      maxHeight: options.layout?.maxHeight,
      fixedWidth: options.layout?.fixedWidth,
      fixedHeight: options.layout?.fixedHeight,
    },
    overflow: {
      inline: options.overflow?.inline ?? "clip",
      block: options.overflow?.block ?? "wrap",
    },
    interaction:
      options.interaction == null
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
