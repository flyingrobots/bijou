import type { OutputMode } from './detect/tty.js';
import type { ModeLoweringFact } from './mode-lowering.js';
import {
  type BlockDefinition,
  type BlockRenderInput,
  type BlockRenderResult,
} from './block-metadata.js';
import {
  type BlockRenderNode,
  type RenderContext,
  type ResolvedSlots,
  BLOCK_RENDER_NODE_BRAND,
} from './block-tree-render-contract.js';
import { blockRenderNode } from './block-tree-render-snapshot.js';
import {
  freezeFacts,
  isPlainRecord,
  resolveSlotValue,
} from './block-tree-render.part03.js';

export function renderTarget<Config = unknown>(
  target: BlockDefinition<Config> | BlockRenderNode<Config>,
  context: RenderContext,
  inheritedMode: OutputMode | undefined,
  depth: number,
): BlockRenderResult {
  const node = targetToNode(target);
  if (depth > context.maxDepth) {
    throw new Error(
      `block tree render: maximum depth ${String(context.maxDepth)} exceeded at ${node.block.metadata.blockName}`,
    );
  }

  const mode = node.input.mode ?? inheritedMode ?? context.optionMode;
  const resolvedSlots = resolveSlots(node.input.slots, context, mode, depth);
  const input = Object.freeze({
    ...node.input,
    ...(mode === undefined ? {} : { mode }),
    ...(resolvedSlots.slots === undefined
      ? {}
      : { slots: resolvedSlots.slots }),
  }) as BlockRenderInput<Config>;
  const rendered = node.block.render(input);
  const facts = freezeFacts([
    ...(rendered.facts ?? []),
    ...resolvedSlots.facts,
  ]);

  return Object.freeze({
    output: rendered.output,
    facts,
  });
}
export function targetToNode<Config = unknown>(
  target: BlockDefinition<Config> | BlockRenderNode<Config>,
): BlockRenderNode<Config> {
  if (BLOCK_RENDER_NODE_BRAND in target) {
    return target;
  }
  if (!('metadata' in target))
    throw new Error(
      'block tree render: target must be a BlockDefinition or BlockRenderNode',
    );
  return blockRenderNode(target);
}
export function resolveSlots(
  slots: Readonly<Record<string, unknown>> | undefined,
  context: RenderContext,
  inheritedMode: OutputMode | undefined,
  depth: number,
): ResolvedSlots {
  if (!isPlainRecord(slots)) {
    return {
      slots: undefined,
      facts: Object.freeze([]),
    };
  }

  const facts: ModeLoweringFact[] = [];
  const renderedSlots: Record<string, unknown> = {};
  const descriptors = Object.getOwnPropertyDescriptors(slots);

  for (const [key, descriptor] of Object.entries(descriptors)) {
    if (!('value' in descriptor)) {
      continue;
    }

    const resolved = resolveSlotValue(
      descriptor.value,
      context,
      inheritedMode,
      depth + 1,
      renderTarget,
    );
    renderedSlots[key] = resolved.value;
    facts.push(...resolved.facts);
  }

  return {
    slots: Object.freeze(renderedSlots),
    facts: freezeFacts(facts),
  };
}
