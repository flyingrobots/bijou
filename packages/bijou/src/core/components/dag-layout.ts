/**
 * Sugiyama-style layer assignment and column ordering for the DAG renderer.
 *
 * Imports only `DagNode` as a type from `dag.ts` (type-only, erased at runtime).
 */

import type { DagNode } from './dag.js';

// ── Layer Assignment ───────────────────────────────────────────────

/**
 * Assign each node to a layer using longest-path layer assignment.
 *
 * Performs Kahn's topological sort to detect cycles, then assigns each
 * node to the layer one past its deepest parent. Root nodes (in-degree 0)
 * are placed on layer 0.
 *
 * @param nodes - The graph nodes to lay out.
 * @returns Map from node ID to its zero-based layer index.
 * @throws If the graph contains a cycle.
 */
export function assignLayers(nodes: DagNode[]): Map<string, number> {
  const children = new Map<string, string[]>();
  const parents = new Map<string, string[]>();
  const inDegree = new Map<string, number>();
  const nodeIds = new Set(nodes.map(n => n.id));

  for (const n of nodes) {
    // Filter edges to only include targets that exist in the graph
    children.set(n.id, (n.edges ?? []).filter(e => nodeIds.has(e)));
    inDegree.set(n.id, 0);
    if (!parents.has(n.id)) parents.set(n.id, []);
  }

  for (const n of nodes) {
    for (const childId of children.get(n.id) ?? []) {
      if (!parents.has(childId)) parents.set(childId, []);
      parents.get(childId)!.push(n.id);
      inDegree.set(childId, (inDegree.get(childId) ?? 0) + 1);
    }
  }

  // Kahn's topological sort
  const queue: string[] = [];
  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id);
  }

  const topoOrder: string[] = [];
  const visited = new Set<string>();
  while (queue.length > 0) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    topoOrder.push(id);
    for (const childId of children.get(id) ?? []) {
      const newDeg = (inDegree.get(childId) ?? 1) - 1;
      inDegree.set(childId, newDeg);
      if (newDeg === 0) queue.push(childId);
    }
  }

  if (topoOrder.length !== nodes.length) {
    throw new Error('[bijou] dag(): cycle detected in graph');
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

  return layerMap;
}

// ── Column Ordering ────────────────────────────────────────────────

/**
 * Group node IDs into layer arrays indexed by layer number.
 *
 * @param nodes - All graph nodes.
 * @param layerMap - Map from node ID to layer index (from `assignLayers`).
 * @returns Array of layers, where each layer is an array of node IDs.
 */
export function buildLayerArrays(
  nodes: DagNode[],
  layerMap: Map<string, number>,
): string[][] {
  let maxLayer = 0;
  for (const v of layerMap.values()) {
    if (v > maxLayer) maxLayer = v;
  }
  const layers: string[][] = Array.from({ length: maxLayer + 1 }, () => []);
  for (const n of nodes) {
    const l = layerMap.get(n.id);
    if (l !== undefined) layers[l]!.push(n.id);
  }
  return layers;
}

/**
 * Reorder nodes within each layer to minimize edge crossings.
 *
 * Uses the barycenter heuristic with one top-down pass followed by
 * one bottom-up pass. Mutates the `layers` arrays in place.
 *
 * @param layers - Layer arrays from `buildLayerArrays`, mutated in place.
 * @param nodes - All graph nodes (used to build adjacency maps).
 */
export function orderColumns(layers: string[][], nodes: DagNode[]): void {
  const childrenMap = new Map<string, string[]>();
  const parentsMap = new Map<string, string[]>();
  for (const n of nodes) {
    childrenMap.set(n.id, n.edges ?? []);
    if (!parentsMap.has(n.id)) parentsMap.set(n.id, []);
  }
  for (const n of nodes) {
    for (const c of n.edges ?? []) {
      if (!parentsMap.has(c)) parentsMap.set(c, []);
      parentsMap.get(c)!.push(n.id);
    }
  }

  // Top-down pass
  for (let l = 1; l < layers.length; l++) {
    const prevLayer = layers[l - 1]!;
    const curLayer = layers[l]!;
    const prevIndex = new Map<string, number>();
    for (let i = 0; i < prevLayer.length; i++) {
      prevIndex.set(prevLayer[i]!, i);
    }

    const bary = new Map<string, number>();
    for (const id of curLayer) {
      const pars = (parentsMap.get(id) ?? []).filter(p => prevIndex.has(p));
      if (pars.length === 0) {
        bary.set(id, Infinity);
      } else {
        const avg = pars.reduce((s, p) => s + (prevIndex.get(p) ?? 0), 0) / pars.length;
        bary.set(id, avg);
      }
    }
    curLayer.sort((a, b) => (bary.get(a) ?? Infinity) - (bary.get(b) ?? Infinity));
  }

  // Bottom-up pass
  for (let l = layers.length - 2; l >= 0; l--) {
    const nextLayer = layers[l + 1]!;
    const curLayer = layers[l]!;
    const nextIndex = new Map<string, number>();
    for (let i = 0; i < nextLayer.length; i++) {
      nextIndex.set(nextLayer[i]!, i);
    }

    const bary = new Map<string, number>();
    for (const id of curLayer) {
      const chlds = (childrenMap.get(id) ?? []).filter(c => nextIndex.has(c));
      if (chlds.length === 0) {
        bary.set(id, Infinity);
      } else {
        const avg = chlds.reduce((s, c) => s + (nextIndex.get(c) ?? 0), 0) / chlds.length;
        bary.set(id, avg);
      }
    }
    curLayer.sort((a, b) => (bary.get(a) ?? Infinity) - (bary.get(b) ?? Infinity));
  }
}
