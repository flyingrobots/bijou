import type { BlockDefinition, BlockRenderInput } from './block-metadata.js';
import type { OutputMode } from './detect/tty.js';
import type { ModeLoweringFact } from './mode-lowering.js';

export const BLOCK_RENDER_NODE_BRAND: unique symbol = Symbol('BlockRenderNode');
export const DEFAULT_MAX_DEPTH = 12;

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

export interface RenderContext {
  readonly maxDepth: number;
  readonly optionMode?: OutputMode;
}

export interface ResolvedSlots {
  readonly slots: Readonly<Record<string, unknown>> | undefined;
  readonly facts: readonly ModeLoweringFact[];
}

export function isBlockRenderNode(value: unknown): value is BlockRenderNode {
  return Boolean(
    value
    && typeof value === 'object'
    && (value as BlockRenderNodeBrandCarrier)[BLOCK_RENDER_NODE_BRAND] === true,
  );
}
