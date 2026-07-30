import type { BijouContext } from '../../ports/context.js';
import {
  sanitizeOptionalPositiveInt,
  sanitizePositiveInt,
} from '../numeric.js';
import type {
  DagEdgeStyle,
  DagNode,
  DagNodeStyle,
  DagOptions,
} from './dag.js';
import {
  createGrid,
  markEdge,
} from './dag-edges.js';
import {
  assignLayers,
  buildLayerArrays,
  orderColumns,
} from './dag-layout.js';
import type { DagRenderLayout } from './dag-render-contract.js';
import {
  automaticNodeWidthFloor,
  compactDelimiters,
  minimumDetourWidth,
  minimumNodeWidth,
  nodeHeightForStyle,
  preferredColumnGap,
  rowStrideForStyle,
  visibleLength,
} from './dag-render-metrics.js';

/** Resolve graph geometry and route edges before node styling. */
export function createDagRenderLayout(
  nodes: DagNode[],
  options: DagOptions,
  ctx: BijouContext,
): DagRenderLayout {
  const layerMap = assignLayers(nodes);
  const layers = buildLayerArrays(nodes, layerMap);
  orderColumns(layers, nodes);
  const columnIndex = new Map<string, number>();
  for (const layer of layers) {
    layer.forEach((id, index) => columnIndex.set(id, index));
  }
  const nodeStyle: DagNodeStyle = options.nodeStyle ?? 'box';
  const edgeStyle: DagEdgeStyle = options.edgeStyle ?? 'single';
  const nodeHeight = nodeHeightForStyle(nodeStyle);
  const rowStride = rowStrideForStyle(nodeStyle);
  const maxNodes = Math.max(1, ...layers.map((layer) => layer.length));
  const maxWidth = sanitizePositiveInt(options.maxWidth, ctx.runtime.columns);
  const explicitWidth = sanitizeOptionalPositiveInt(options.nodeWidth);
  const compactChrome = Math.max(2, ...nodes.map((node) => {
    const delimiters = compactDelimiters(node.compactShape ?? 'square');
    return visibleLength(delimiters.open) + visibleLength(delimiters.close);
  }));
  let nodeWidth = Math.max(
    explicitWidth ?? Math.max(
      automaticNodeWidthFloor(nodeStyle),
      ...nodes.map((node) =>
        visibleLength(
          nodeStyle === 'compact' && node.badge != null
            ? `${node.label} ${node.badge}`
            : node.label,
        ) + (nodeStyle === 'compact'
          ? compactChrome
          : node.badge == null ? 4 : visibleLength(node.badge) + 4),
      ),
    ),
    minimumNodeWidth(nodeStyle),
  );
  let gap = preferredColumnGap(nodeWidth);
  let totalWidth = maxNodes * nodeWidth + (maxNodes - 1) * gap;
  if (totalWidth > maxWidth && explicitWidth == null) {
    gap = Math.min(gap, 2);
    totalWidth = maxNodes * nodeWidth + (maxNodes - 1) * gap;
  }
  if (totalWidth > maxWidth && explicitWidth == null) {
    nodeWidth = Math.max(
      automaticNodeWidthFloor(nodeStyle),
      Math.floor((maxWidth - (maxNodes - 1) * gap) / maxNodes),
    );
  }
  const columnStride = nodeWidth + gap;
  const layerWidths = layers.map((layer) =>
    layer.length * nodeWidth + Math.max(0, layer.length - 1) * gap,
  );
  totalWidth = Math.max(
    ...layerWidths,
    minimumDetourWidth(
      nodes,
      layerMap,
      columnIndex,
      layerWidths,
      nodeWidth,
    ),
  );
  const layerOffsets = layerWidths.map((width) =>
    Math.max(0, Math.floor((totalWidth - width) / 2)),
  );
  const columnCenter = (layer: number, column: number): number =>
    (layerOffsets[layer] ?? 0)
      + column * columnStride
      + Math.floor(nodeWidth / 2);
  const gridRows = layers.length * rowStride;
  const grid = createGrid(gridRows, totalWidth);
  for (const node of nodes) {
    const fromLayer = layerMap.get(node.id);
    const fromColumn = columnIndex.get(node.id);
    if (fromLayer == null || fromColumn == null) continue;
    for (const child of node.edges ?? []) {
      const toLayer = layerMap.get(child);
      const toColumn = columnIndex.get(child);
      if (toLayer == null || toColumn == null) continue;
      markEdge(
        grid,
        fromColumn,
        fromLayer,
        toColumn,
        toLayer,
        rowStride,
        columnCenter,
        nodeWidth,
        nodeHeight,
      );
    }
  }
  return {
    layerMap,
    layers,
    columnIndex,
    nodeStyle,
    edgeStyle,
    nodeHeight,
    rowStride,
    nodeWidth,
    layerOffsets,
    columnStride,
    gridRows,
    gridColumns: totalWidth,
    columnCenter,
    grid,
    positions: new Map(),
    nodesByRow: new Map(),
  };
}
