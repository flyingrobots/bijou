import type { BijouContext } from '../../ports/context.js';
import { segmentGraphemes } from '../text/grapheme.js';
import type {
  DagNode,
  DagOptions,
} from './dag.js';
import type {
  DagRenderLayout,
  PlacedDagNode,
} from './dag-render-contract.js';
import { withBackground } from './dag-render-metrics.js';
import {
  expandToColumns,
  renderCompactNode,
  renderNodeBox,
} from './dag-render-node.js';

/** Place node glyphs and resolve their style tokens over routed edges. */
export function placeDagNodes(
  layout: DagRenderLayout,
  nodes: DagNode[],
  options: DagOptions,
  ctx: BijouContext,
): void {
  const highlighted = new Set(options.highlightPath ?? []);
  for (const node of nodes) {
    const layer = layout.layerMap.get(node.id);
    const column = layout.columnIndex.get(node.id);
    if (layer == null || column == null) continue;
    const box = layout.nodeStyle === 'compact'
      ? renderCompactNode(
        node.label,
        node.badge,
        layout.nodeWidth,
        node.compactShape ?? 'square',
      )
      : renderNodeBox(
        node.label,
        node.badge,
        layout.nodeWidth,
        node._ghost === true,
      );
    const startCol =
      (layout.layerOffsets[layer] ?? 0) + column * layout.columnStride;
    const startRow = layer * layout.rowStride;
    layout.positions.set(node.id, {
      row: startRow,
      col: startCol,
      width: box.width,
      height: box.height,
    });
    const base = options.selectedId === node.id
      ? (options.selectedToken ?? ctx.ui('cursor'))
      : highlighted.has(node.id) && options.highlightToken != null
        ? options.highlightToken
        : (node.token ?? options.nodeToken ?? ctx.border('primary'));
    const background = node.bgToken ?? options.nodeBgToken;
    const chars: string[][] = [];
    const types = [];
    for (const [index, line] of box.lines.entries()) {
      const expanded = expandToColumns(
        segmentGraphemes(line),
        box.charTypes[index] ?? [],
      );
      chars.push(expanded.chars);
      types.push(expanded.types);
    }
    const placed: PlacedDagNode = {
      startRow,
      startCol,
      width: box.width,
      box,
      chars,
      charTypes: types,
      borderToken: withBackground(base, background),
      padToken: background ?? withBackground(base, background),
      labelToken: withBackground(node.labelToken ?? base, background),
      badgeToken: withBackground(
        node.badgeToken ?? node.labelToken ?? base,
        background,
      ),
      node,
    };
    for (let line = 0; line < box.height; line++) {
      const row = startRow + line;
      if (row >= layout.gridRows) continue;
      const list = layout.nodesByRow.get(row) ?? [];
      list.push(placed);
      layout.nodesByRow.set(row, list);
    }
  }
}
