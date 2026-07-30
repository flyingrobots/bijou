import type { BijouContext } from '../../ports/context.js';
import type {
  DagNode,
  DagNodePosition,
  DagOptions,
} from './dag.js';
import { serializeDagGrid } from './dag-render-grid.js';
import { createDagRenderLayout } from './dag-render-layout.js';
import { placeDagNodes } from './dag-render-place.js';

export interface InteractiveDagRender {
  readonly output: string;
  readonly nodes: Map<string, DagNodePosition>;
  readonly width: number;
  readonly height: number;
}

/** Render the complete styled DAG layout. */
export function renderInteractiveLayout(
  nodes: DagNode[],
  options: DagOptions,
  ctx: BijouContext,
): InteractiveDagRender {
  if (nodes.length === 0) {
    return { output: '', nodes: new Map(), width: 0, height: 0 };
  }
  const layout = createDagRenderLayout(nodes, options, ctx);
  placeDagNodes(layout, nodes, options, ctx);
  return {
    output: serializeDagGrid(layout, options, ctx),
    nodes: layout.positions,
    width: layout.gridColumns,
    height: layout.gridRows,
  };
}
