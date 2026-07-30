import type { LayoutNode } from "@flyingrobots/bijou";
import type { RuntimeRetainedLayout } from "./runtime-engine-layouts.js";
import type { RuntimeStackLayer } from "./runtime-engine-view-stack.js";

export const RUNTIME_POINTER_ACTIONS = [
  "press",
  "release",
  "move",
  "scroll-up",
  "scroll-down",
] as const;

export const RUNTIME_POINTER_BUTTONS = ["left", "middle", "right"] as const;

export type RuntimePointerAction = (typeof RUNTIME_POINTER_ACTIONS)[number];
export type RuntimePointerButton = (typeof RUNTIME_POINTER_BUTTONS)[number];

export interface RuntimeKeyInputEvent {
  readonly kind: "key";
  readonly key: string;
}

export interface RuntimePointerInputEvent {
  readonly kind: "pointer";
  readonly action: RuntimePointerAction;
  readonly x: number;
  readonly y: number;
  readonly button?: RuntimePointerButton;
}

export type RuntimeInputEvent = RuntimeKeyInputEvent | RuntimePointerInputEvent;

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

export type RuntimeInputHandler<
  Node extends LayoutNode = LayoutNode,
  Model = unknown,
  Command = unknown,
  Effect = unknown,
> = (
  context: RuntimeInputRouteContext<Node, Model>,
) => RuntimeInputRouteOutcome<Command, Effect> | undefined;
