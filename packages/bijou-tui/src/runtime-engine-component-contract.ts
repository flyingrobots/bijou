import type { LayoutNode, LayoutRect, Surface } from "@flyingrobots/bijou";
import type {
  RuntimeComponentLayoutRules,
  RuntimeComponentOverflowRules,
} from "./runtime-engine-component-layout.js";
import type {
  RuntimeInputRouteContext,
  RuntimeInputRouteOutcome,
  RuntimePointerAction,
} from "./runtime-engine-input.js";

export type RuntimeComponentKeyBindings = readonly string[] | "any";
export type RuntimeComponentPointerBindings =
  readonly RuntimePointerAction[] | "any";

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
  Node extends RuntimeComponentLayoutNode<Command, Effect, Model> =
    RuntimeComponentLayoutNode<Command, Effect, Model>,
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
    "enabled"
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
