import {
  isBlockDefinition,
  type BlockDefinition,
  type BlockRenderInput,
} from './block-metadata.js';
import {
  type BlockRenderNode,
  BLOCK_RENDER_NODE_BRAND,
  isBlockRenderNode,
} from './block-tree-render-contract.js';
import { isPlainRecord } from './block-tree-render.part03.js';

export function blockRenderNode<Config = unknown>(
  block: BlockDefinition<Config>,
  input: BlockRenderInput<Config> = {},
): BlockRenderNode<Config> {
  if (!isBlockDefinition(block)) {
    throw new Error(
      'block render node: block must be created by defineBlock()',
    );
  }
  return Object.freeze({
    block,
    input: snapshotInput(input),
    [BLOCK_RENDER_NODE_BRAND]: true as const,
  });
}

function snapshotInput<Config>(
  input: BlockRenderInput<Config>,
): BlockRenderInput<Config> {
  return snapshotPlainRecord(input, 'input', new WeakSet());
}

export function snapshotValue(
  value: unknown,
  path: string,
  seen: WeakSet<object>,
): unknown {
  if (isBlockRenderNode(value) || isBlockDefinition(value)) return value;
  if (Array.isArray(value)) {
    if (seen.has(value)) {
      throw new Error(`block render node: circular reference at ${path}`);
    }
    seen.add(value);
    try {
      return Object.freeze(
        value.map((item, index) =>
          snapshotValue(item, `${path}[${String(index)}]`, seen),
        ),
      );
    } finally {
      seen.delete(value);
    }
  }
  if (isPlainRecord(value)) return snapshotPlainRecord(value, path, seen);
  return value;
}

export function snapshotPlainRecord(
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
      if ('value' in descriptor) {
        record[key] = snapshotValue(descriptor.value, `${path}.${key}`, seen);
      }
    }
    return Object.freeze(record);
  } finally {
    seen.delete(input);
  }
}
