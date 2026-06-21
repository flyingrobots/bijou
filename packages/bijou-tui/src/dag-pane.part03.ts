import type { DagNodePosition } from '@flyingrobots/bijou';

import type { Adjacency } from './dag-pane.part01.js';
export function computeHighlightPath(
  selectedId: string | undefined,
  adjacency: Adjacency,
): readonly string[] {
  if (!selectedId) return [];

  // BFS upward from selected to find a root, then reverse
  const visited = new Set<string>();
  const cameFrom = new Map<string, string>();
  const queue: string[] = [selectedId];
  visited.add(selectedId);

  let rootFound: string | undefined;

  while (queue.length > 0) {
    const current = queue.shift();
    if (current === undefined) break;
    const parents = adjacency.parents.get(current) ?? [];
    if (parents.length === 0) {
      rootFound = current;
      break;
    }
    for (const parent of parents) {
      if (!visited.has(parent)) {
        visited.add(parent);
        cameFrom.set(parent, current);
        queue.push(parent);
      }
    }
  }

  if (rootFound === undefined) {
    // Selected node is itself a root (or disconnected)
    return [selectedId];
  }

  // Reconstruct path from root to selected
  const path: string[] = [];
  let cursor: string | undefined = rootFound;
  while (cursor !== undefined) {
    path.push(cursor);
    if (cursor === selectedId) break;
    cursor = cameFrom.get(cursor);
  }

  // If we couldn't reach selectedId from the root, just return selected
  if (path[path.length - 1] !== selectedId) {
    return [selectedId];
  }

  return path;
}
export function closestByCol(
  candidates: readonly string[],
  currentCenter: number,
  positions: ReadonlyMap<string, DagNodePosition>,
): string | undefined {
  let best: string | undefined;
  let bestDist = Infinity;
  for (const id of candidates) {
    const pos = positions.get(id);
    if (!pos) continue;
    const center = pos.col + pos.width / 2;
    const dist = Math.abs(center - currentCenter);
    if (dist < bestDist) {
      bestDist = dist;
      best = id;
    }
  }
  return best;
}
export function nodesOnSameRow(
  row: number,
  positions: ReadonlyMap<string, DagNodePosition>,
): string[] {
  const result: string[] = [];
  for (const [id, pos] of positions) {
    if (pos.row === row) result.push(id);
  }
  return result.sort((a, b) => {
    const pa = positions.get(a);
    const pb = positions.get(b);
    if (pa === undefined || pb === undefined) return 0;
    return pa.col - pb.col;
  });
}
