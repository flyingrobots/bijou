import type { OutputMode } from './detect/tty.js';
import type { ModeLoweringFact } from './mode-lowering.js';
import {
  isBlockDefinition,
  type BlockDefinition,
  type BlockRenderInput,
  type BlockRenderResult,
} from './block-metadata.js';

const BLOCK_RENDER_NODE_BRAND: unique symbol = Symbol('BlockRenderNode');
const DEFAULT_MAX_DEPTH = 12;

export interface BlockRenderNode<Config = unknown> {
  readonly [BLOCK_RENDER_NODE_BRAND]: true;
  readonly block: BlockDefinition<Config>;
  readonly input: BlockRenderInput<Config>;
}

export interface BlockTreeRenderOptions {
  readonly mode?: OutputMode;
  readonly maxDepth?: number;
}

interface BlockRenderNodeBrandCarrier {
  readonly [BLOCK_RENDER_NODE_BRAND]?: true;
}

interface RenderContext {
  readonly maxDepth: number;
  readonly optionMode?: OutputMode;
}

interface ResolvedSlots {
  readonly slots: Readonly<Record<string, unknown>> | undefined;
  readonly facts: readonly ModeLoweringFact[];
}

export function blockRenderNode<Config = unknown>(
  block: BlockDefinition<Config>,
  input: BlockRenderInput<Config> = {},
): BlockRenderNode<Config> {
  if (!isBlockDefinition(block)) {
    throw new Error('block render node: block must be created by defineBlock()');
  }

  const node: BlockRenderNode<Config> = {
    block,
    input: snapshotInput(input),
    [BLOCK_RENDER_NODE_BRAND]: true,
  };

  return Object.freeze(node);
}

export function isBlockRenderNode(value: unknown): value is BlockRenderNode {
  return Boolean(
    value
      && typeof value === 'object'
      && (value as BlockRenderNodeBrandCarrier)[BLOCK_RENDER_NODE_BRAND] === true,
  );
}

export function renderBlockTree<Config = unknown>(
  target: BlockDefinition<Config> | BlockRenderNode<Config>,
  options: BlockTreeRenderOptions = {},
): BlockRenderResult {
  const maxDepth = normalizeMaxDepth(options.maxDepth);
  return renderTarget(target, {
    maxDepth,
    ...(options.mode === undefined ? {} : { optionMode: options.mode }),
  }, undefined, 0);
}

function snapshotInput<Config>(input: BlockRenderInput<Config>): BlockRenderInput<Config> {
  return snapshotPlainRecord(input, 'input', new WeakSet());
}

function snapshotValue(value: unknown, path: string, seen: WeakSet<object>): unknown {
  if (isBlockRenderNode(value) || isBlockDefinition(value)) {
    return value;
  }

  if (Array.isArray(value)) {
    if (seen.has(value)) {
      throw new Error(`block render node: circular reference at ${path}`);
    }
    seen.add(value);
    try {
      return Object.freeze(value.map((item, index) => snapshotValue(item, `${path}[${String(index)}]`, seen)));
    } finally {
      seen.delete(value);
    }
  }

  if (isPlainRecord(value)) {
    return snapshotPlainRecord(value, path, seen);
  }

  return value;
}

function snapshotPlainRecord(
  input: object,
  path: string,
  seen: WeakSet<object>,
): Readonly<Record<string, unknown>> {
  if (seen.has(input)) {
    throw new Error(`block render node: circular reference at ${path}`);
  }
  seen.add(input);

  const record: Record<string, unknown> = {};
  try {
    const descriptors = Object.getOwnPropertyDescriptors(input);

    for (const [key, descriptor] of Object.entries(descriptors)) {
      if (!('value' in descriptor)) {
        continue;
      }

      record[key] = snapshotValue(descriptor.value, `${path}.${key}`, seen);
    }

    return Object.freeze(record);
  } finally {
    seen.delete(input);
  }
}

function renderTarget<Config = unknown>(
  target: BlockDefinition<Config> | BlockRenderNode<Config>,
  context: RenderContext,
  inheritedMode: OutputMode | undefined,
  depth: number,
): BlockRenderResult {
  const node = targetToNode(target);
  if (depth > context.maxDepth) {
    throw new Error(`block tree render: maximum depth ${String(context.maxDepth)} exceeded at ${node.block.metadata.blockName}`);
  }

  const mode = node.input.mode ?? inheritedMode ?? context.optionMode;
  const resolvedSlots = resolveSlots(node.input.slots, context, mode, depth);
  const input = Object.freeze({
    ...node.input,
    ...(mode === undefined ? {} : { mode }),
    ...(resolvedSlots.slots === undefined ? {} : { slots: resolvedSlots.slots }),
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

function targetToNode<Config = unknown>(
  target: BlockDefinition<Config> | BlockRenderNode<Config>,
): BlockRenderNode<Config> {
  if (BLOCK_RENDER_NODE_BRAND in target) {
    return target;
  }
  if (!('metadata' in target)) throw new Error('block tree render: target must be a BlockDefinition or BlockRenderNode');
  return blockRenderNode(target);
}

function resolveSlots(
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

    const resolved = resolveSlotValue(descriptor.value, context, inheritedMode, depth + 1);
    renderedSlots[key] = resolved.value;
    facts.push(...resolved.facts);
  }

  return {
    slots: Object.freeze(renderedSlots),
    facts: freezeFacts(facts),
  };
}

function resolveSlotValue(
  value: unknown,
  context: RenderContext,
  inheritedMode: OutputMode | undefined,
  depth: number,
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
      const resolved = resolveSlotValue(item, context, inheritedMode, depth);
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

      const resolved = resolveSlotValue(descriptor.value, context, inheritedMode, depth);
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

function freezeFacts(facts: readonly ModeLoweringFact[]): readonly ModeLoweringFact[] {
  return Object.freeze(facts.map((fact) => Object.freeze({ ...fact })));
}

function normalizeMaxDepth(maxDepth: number | undefined): number {
  if (maxDepth === undefined) {
    return DEFAULT_MAX_DEPTH;
  }

  if (!Number.isFinite(maxDepth) || maxDepth < 0) {
    throw new Error('block tree render: maxDepth must be a non-negative finite number');
  }

  return Math.floor(maxDepth);
}

function isPlainRecord(input: unknown): input is Record<string, unknown> {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    return false;
  }

  const prototype: unknown = Object.getPrototypeOf(input);
  return prototype === Object.prototype || prototype === null;
}
