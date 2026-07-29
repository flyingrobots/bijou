/**
 * Sugiyama-style layer assignment and column ordering for the DAG renderer.
 *
 * Imports only `DagNode` as a type from `dag.ts` (type-only, erased at runtime).
 */

import type { DagNode } from './dag.js';

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
    if (l !== undefined) layers[l]?.push(n.id);
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
  const childrenMap = new Map<string, readonly string[]>();
  const parentsMap = new Map<string, string[]>();
  for (const n of nodes) {
    childrenMap.set(n.id, n.edges ?? []);
    if (!parentsMap.has(n.id)) parentsMap.set(n.id, []);
  }
  for (const n of nodes) {
    for (const c of n.edges ?? []) {
      const parents = parentsMap.get(c);
      if (parents === undefined) parentsMap.set(c, [n.id]);
      else parents.push(n.id);
    }
  }

  // Top-down pass
  for (let l = 1; l < layers.length; l++) {
    const prevLayer = layers[l - 1] ?? [];
    const curLayer = layers[l] ?? [];
    const prevIndex = new Map<string, number>();
    prevLayer.forEach((id, i) => prevIndex.set(id, i));

    const bary = new Map<string, number>();
    for (const id of curLayer) {
      const pars = (parentsMap.get(id) ?? []).filter((p) => prevIndex.has(p));
      if (pars.length === 0) {
        bary.set(id, Infinity);
      } else {
        const avg =
          pars.reduce((s, p) => s + (prevIndex.get(p) ?? 0), 0) / pars.length;
        bary.set(id, avg);
      }
    }
    curLayer.sort(
      (a, b) => (bary.get(a) ?? Infinity) - (bary.get(b) ?? Infinity),
    );
  }

  // Bottom-up pass
  for (let l = layers.length - 2; l >= 0; l--) {
    const nextLayer = layers[l + 1] ?? [];
    const curLayer = layers[l] ?? [];
    const nextIndex = new Map<string, number>();
    nextLayer.forEach((id, i) => nextIndex.set(id, i));

    const bary = new Map<string, number>();
    for (const id of curLayer) {
      const chlds = (childrenMap.get(id) ?? []).filter((c) => nextIndex.has(c));
      if (chlds.length === 0) {
        bary.set(id, Infinity);
      } else {
        const avg =
          chlds.reduce((s, c) => s + (nextIndex.get(c) ?? 0), 0) / chlds.length;
        bary.set(id, avg);
      }
    }
    curLayer.sort(
      (a, b) => (bary.get(a) ?? Infinity) - (bary.get(b) ?? Infinity),
    );
  }
}

export { assignLayers } from './dag-layers.js';
