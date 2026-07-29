import type { OutputMode } from './detect/tty.js';
import type { ModeLoweringFact } from './mode-lowering.js';
import {
  isBlockDefinition,
  type BlockDefinition,
  type BlockRenderResult,
} from './block-metadata.js';
import {
  type BlockRenderNode,
  type RenderContext,
  DEFAULT_MAX_DEPTH,
  isBlockRenderNode,
} from './block-tree-render-contract.js';

type RenderNestedTarget = (
  target: BlockDefinition | BlockRenderNode,
  context: RenderContext,
  inheritedMode: OutputMode | undefined,
  depth: number,
) => BlockRenderResult;

export function resolveSlotValue(
  value: unknown,
  context: RenderContext,
  inheritedMode: OutputMode | undefined,
  depth: number,
  renderTarget: RenderNestedTarget,
): { readonly value: unknown; readonly facts: readonly ModeLoweringFact[] } {
  if (isBlockRenderNode(value) || isBlockDefinition(value)) {
    const rendered = renderTarget(value, context, inheritedMode, depth);
    return {
      value: rendered.output,
      facts: rendered.facts ?? Object.freeze([]),
    };
  }

  if (Array.isArray(value)) {
    const facts: ModeLoweringFact[] = [];
    const items = value.map((item) => {
      const resolved = resolveSlotValue(
        item,
        context,
        inheritedMode,
        depth,
        renderTarget,
      );
      facts.push(...resolved.facts);
      return resolved.value;
    });
    return {
      value: Object.freeze(items),
      facts: freezeFacts(facts),
    };
  }

  if (isPlainRecord(value)) {
    const facts: ModeLoweringFact[] = [];
    const record: Record<string, unknown> = {};
    const descriptors = Object.getOwnPropertyDescriptors(value);

    for (const [key, descriptor] of Object.entries(descriptors)) {
      if (!('value' in descriptor)) {
        continue;
      }

      const resolved = resolveSlotValue(
        descriptor.value,
        context,
        inheritedMode,
        depth,
        renderTarget,
      );
      record[key] = resolved.value;
      facts.push(...resolved.facts);
    }

    return {
      value: Object.freeze(record),
      facts: freezeFacts(facts),
    };
  }

  return {
    value,
    facts: Object.freeze([]),
  };
}
export function freezeFacts(
  facts: readonly ModeLoweringFact[],
): readonly ModeLoweringFact[] {
  return Object.freeze(facts.map((fact) => Object.freeze({ ...fact })));
}
export function normalizeMaxDepth(maxDepth: number | undefined): number {
  if (maxDepth === undefined) {
    return DEFAULT_MAX_DEPTH;
  }

  if (!Number.isFinite(maxDepth) || maxDepth < 0) {
    throw new Error(
      'block tree render: maxDepth must be a non-negative finite number',
    );
  }

  return Math.floor(maxDepth);
}
export function isPlainRecord(
  input: unknown,
): input is Record<string, unknown> {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    return false;
  }

  const prototype: unknown = Object.getPrototypeOf(input);
  return prototype === Object.prototype || prototype === null;
}
