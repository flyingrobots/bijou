import type { DagNode } from './dag.js';
import type { SlicedDagSource } from './dag-source.js';
import { isSlicedDagSource } from './dag-source.js';
import { materialize } from './dag-source.js';

export interface DagStats {
  nodes: number;
  edges: number;
  depth: number;        // number of layers (longest-path assignment)
  width: number;        // max nodes on any single layer
  roots: number;        // in-degree 0
  leaves: number;       // out-degree 0
}

export function dagStats(nodes: DagNode[]): DagStats;
export function dagStats(source: SlicedDagSource): DagStats;
export function dagStats(input: DagNode[] | SlicedDagSource): DagStats {
  const nodes = isSlicedDagSource(input) ? materialize(input) : input;

  if (nodes.length === 0) {
    return { nodes: 0, edges: 0, depth: 0, width: 0, roots: 0, leaves: 0 };
  }

  // Filter out ghost nodes
  const realNodes = nodes.filter(n => !n._ghost);

  if (realNodes.length === 0) {
    return { nodes: 0, edges: 0, depth: 0, width: 0, roots: 0, leaves: 0 };
  }

  const nodeIds = new Set(realNodes.map(n => n.id));
  const children = new Map<string, string[]>();
  const inDegree = new Map<string, number>();
  const parents = new Map<string, string[]>();

  for (const n of realNodes) {
    const validEdges = (n.edges ?? []).filter(e => nodeIds.has(e));
    children.set(n.id, validEdges);
    inDegree.set(n.id, 0);
    if (!parents.has(n.id)) parents.set(n.id, []);
  }

  let totalEdges = 0;
  for (const n of realNodes) {
    for (const childId of children.get(n.id) ?? []) {
      if (!parents.has(childId)) parents.set(childId, []);
      parents.get(childId)!.push(n.id);
      inDegree.set(childId, (inDegree.get(childId) ?? 0) + 1);
      totalEdges++;
    }
  }

  // Kahn's topological sort (index-based dequeue for O(n) total)
  const queue: string[] = [];
  let head = 0;
  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id);
  }

  const topoOrder: string[] = [];
  while (head < queue.length) {
    const id = queue[head++]!;
    topoOrder.push(id);
    for (const childId of children.get(id) ?? []) {
      const newDeg = inDegree.get(childId)! - 1;
      inDegree.set(childId, newDeg);
      if (newDeg === 0) queue.push(childId);
    }
  }

  if (topoOrder.length !== realNodes.length) {
    throw new Error('[bijou] dagStats(): cycle detected in graph');
  }

  // Longest-path layer assignment
  const layerMap = new Map<string, number>();
  for (const id of topoOrder) {
    const pars = parents.get(id) ?? [];
    if (pars.length === 0) {
      layerMap.set(id, 0);
    } else {
      let maxParent = 0;
      for (const p of pars) {
        maxParent = Math.max(maxParent, layerMap.get(p) ?? 0);
      }
      layerMap.set(id, maxParent + 1);
    }
  }

  // Compute stats
  let maxLayer = 0;
  for (const v of layerMap.values()) {
    if (v > maxLayer) maxLayer = v;
  }
  const depth = maxLayer + 1;

  // Width: count nodes per layer, find max
  const layerCounts = new Map<number, number>();
  for (const v of layerMap.values()) {
    layerCounts.set(v, (layerCounts.get(v) ?? 0) + 1);
  }
  let maxWidth = 0;
  for (const count of layerCounts.values()) {
    if (count > maxWidth) maxWidth = count;
  }

  // Roots: in-degree 0 (already counted)
  let rootCount = 0;
  let leafCount = 0;
  for (const n of realNodes) {
    const pars = parents.get(n.id) ?? [];
    if (pars.length === 0) rootCount++;
    const ch = children.get(n.id) ?? [];
    if (ch.length === 0) leafCount++;
  }

  return {
    nodes: realNodes.length,
    edges: totalEdges,
    depth,
    width: maxWidth,
    roots: rootCount,
    leaves: leafCount,
  };
}
