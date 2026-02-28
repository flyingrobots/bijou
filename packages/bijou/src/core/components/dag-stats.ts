import type { DagNode } from './dag.js';
import type { SlicedDagSource } from './dag-source.js';
import { isSlicedDagSource, materialize } from './dag-source.js';

/** Statistics computed from a directed acyclic graph. */
export interface DagStats {
  /** Total number of (non-ghost) nodes. */
  nodes: number;
  /** Total number of edges between non-ghost nodes. */
  edges: number;
  /** Number of layers in the longest-path layer assignment. */
  depth: number;
  /** Maximum number of nodes on any single layer. */
  width: number;
  /** Number of root nodes (in-degree 0). */
  roots: number;
  /** Number of leaf nodes (out-degree 0). */
  leaves: number;
}

/**
 * Compute statistics for a directed acyclic graph.
 *
 * Accepts either a `DagNode[]` array or a `SlicedDagSource`. Ghost nodes
 * (internal boundary markers from `dagSlice()`) are filtered out automatically.
 *
 * @param input - The graph nodes or sliced source to analyze.
 * @returns A `DagStats` object with node/edge counts, depth, width, roots, and leaves.
 * @throws If the graph contains a cycle or duplicate node IDs.
 *
 * @example
 * ```ts
 * const stats = dagStats([
 *   { id: 'a', label: 'A', edges: ['b', 'c'] },
 *   { id: 'b', label: 'B', edges: ['d'] },
 *   { id: 'c', label: 'C', edges: ['d'] },
 *   { id: 'd', label: 'D' },
 * ]);
 * // => { nodes: 4, edges: 4, depth: 3, width: 2, roots: 1, leaves: 1 }
 * ```
 */
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

  const nodeIds = new Set<string>();
  for (const n of realNodes) {
    if (nodeIds.has(n.id)) {
      throw new Error(`[bijou] dagStats(): duplicate node id "${n.id}"`);
    }
    nodeIds.add(n.id);
  }
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
