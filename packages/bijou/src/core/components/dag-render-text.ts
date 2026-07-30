import type { DagNode } from './dag.js';
import { buildLayerArrays } from './dag-layout.js';

export function renderPipe(nodes: DagNode[]): string {
  if (nodes.length === 0) return '';
  const labels = new Map(nodes.map((node) => [node.id, node.label] as const));
  const lines: string[] = [];
  for (const node of nodes) {
    const edges = node.edges ?? [];
    const badge = node.badge ? ` (${node.badge})` : '';
    if (edges.length === 0) {
      lines.push(`${node.label}${badge}`);
    } else {
      for (const id of edges) {
        lines.push(`${node.label}${badge} -> ${labels.get(id) ?? id}`);
      }
    }
  }
  return lines.join('\n');
}

export function renderAccessible(
  nodes: DagNode[],
  layerMap: Map<string, number>,
): string {
  if (nodes.length === 0) return 'Graph: 0 nodes, 0 edges';
  const layers = buildLayerArrays(nodes, layerMap);
  const nodeMap = new Map(nodes.map((node) => [node.id, node] as const));
  const edgeCount = nodes.reduce(
    (total, node) =>
      total + (node.edges ?? []).filter((id) => nodeMap.has(id)).length,
    0,
  );
  const lines = [
    `Graph: ${String(nodes.length)} nodes, ${String(edgeCount)} edges`,
    '',
  ];
  for (const [index, layer] of layers.entries()) {
    lines.push(`Layer ${String(index + 1)}:`);
    for (const id of layer) {
      const node = nodeMap.get(id);
      if (node == null) continue;
      const badge = node.badge ? ` (${node.badge})` : '';
      const edges = (node.edges ?? []).filter((edge) => nodeMap.has(edge));
      if (edges.length === 0) {
        lines.push(`  ${node.label}${badge} (end)`);
      } else {
        const targets = edges
          .map((edge) => nodeMap.get(edge)?.label ?? edge)
          .join(', ');
        lines.push(`  ${node.label}${badge} -> ${targets}`);
      }
    }
    lines.push('');
  }
  while (lines.at(-1) === '') lines.pop();
  return lines.join('\n');
}
