import type { LayoutNode } from "@flyingrobots/bijou";
import { hitTestRuntimeLayout } from "./runtime-engine-hit-test.js";
import {
  getRuntimeRetainedLayout,
  type RuntimeRetainedLayouts,
} from "./runtime-engine-layouts.js";
import type {
  RuntimeInputEvent,
  RuntimeInputHandler,
  RuntimeInputRouteResult,
  RuntimeLayoutHit,
} from "./runtime-engine-input.js";
import type { RuntimeViewStack } from "./runtime-engine-view-stack.js";

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
    const layer = stack.layers[index];
    if (layer === undefined) continue;
    visitedViewIds.push(layer.id);

    const retainedLayout = getRuntimeRetainedLayout(layouts, layer.id);
    const hit =
      event.kind === "pointer" && retainedLayout != null
        ? hitTestRuntimeLayout(layer.id, retainedLayout.tree, event.x, event.y)
        : undefined;

    if (hit != null) lastHit = hit;
    const outcome = handle({ layer, retainedLayout, event, hit });
    if (outcome?.commands != null) commands.push(...outcome.commands);
    if (outcome?.effects != null) effects.push(...outcome.effects);

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

    if (outcome?.stop || (!outcome?.bubble && layer.blocksBelow)) {
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
