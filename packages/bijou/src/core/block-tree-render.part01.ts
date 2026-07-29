import {
  type BlockDefinition,
  type BlockRenderResult,
} from './block-metadata.js';
import type {
  BlockRenderNode,
  BlockTreeRenderOptions,
} from './block-tree-render-contract.js';
import { renderTarget } from './block-tree-render.part02.js';
import { normalizeMaxDepth } from './block-tree-render.part03.js';
export function renderBlockTree<Config = unknown>(
  target: BlockDefinition<Config> | BlockRenderNode<Config>,
  options: BlockTreeRenderOptions = {},
): BlockRenderResult {
  const maxDepth = normalizeMaxDepth(options.maxDepth);
  return renderTarget(
    target,
    {
      maxDepth,
      ...(options.mode === undefined ? {} : { optionMode: options.mode }),
    },
    undefined,
    0,
  );
}
