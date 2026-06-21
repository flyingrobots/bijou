import { resolveCtx } from '../resolve-ctx.js';

import { arraySource, isDagSource, isSlicedDagSource, materialize, sliceSource } from './dag-source.js';

import type { DagSliceOptions, DagSource, SlicedDagSource } from './dag-source.js';

import { assignLayers } from './dag-layout.js';

import { renderAccessible, renderInteractiveLayout, renderPipe } from './dag-render.js';

import { renderByMode } from '../mode-render.js';

import type { DagLayout, DagNode, DagOptions } from './dag.part01.js';
export function dagSlice(
  source: DagSource,
  focus: string,
  opts?: DagSliceOptions,
): SlicedDagSource;
export function dagSlice(
  nodes: readonly DagNode[],
  focus: string,
  opts?: DagSliceOptions,
): DagNode[];
export function dagSlice(
  input: readonly DagNode[] | DagSource,
  focus: string,
  opts?: DagSliceOptions,
): DagNode[] | SlicedDagSource {
  if (isDagSource(input)) {
    return sliceSource(input, focus, opts);
  }
  // Array path: wrap, slice, materialize back for backward compat
  const source = arraySource([...input]);
  return materialize(sliceSource(source, focus, opts));
}
export function dagLayout(
  input: readonly DagNode[] | SlicedDagSource,
  options: DagOptions = {},
): DagLayout {
  if (isDagSource(input) && !isSlicedDagSource(input)) {
    throw new Error(
      '[bijou] dagLayout(): received an unbounded DagSource. Use dagSlice() to produce a SlicedDagSource first.',
    );
  }
  const ctx = resolveCtx(options.ctx);
  const nodes = isSlicedDagSource(input) ? materialize(input) : [...input];
  if (nodes.length === 0) return { output: '', nodes: new Map(), width: 0, height: 0 };
  return renderInteractiveLayout(nodes, options, ctx);
}
export function dag(
  input: readonly DagNode[] | SlicedDagSource,
  options: DagOptions = {},
): string {
  if (isDagSource(input) && !isSlicedDagSource(input)) {
    throw new Error(
      '[bijou] dag(): received an unbounded DagSource. Use dagSlice() to produce a SlicedDagSource first.',
    );
  }
  const ctx = resolveCtx(options.ctx);
  const nodes = isSlicedDagSource(input) ? materialize(input) : [...input];

  if (nodes.length === 0) return '';

  return renderByMode(ctx.mode, {
    pipe: () => renderPipe(nodes),
    accessible: () => {
      const layerMap = assignLayers(nodes);
      return renderAccessible(nodes, layerMap);
    },
    interactive: () => renderInteractiveLayout(nodes, options, ctx).output,
  }, options);
}
