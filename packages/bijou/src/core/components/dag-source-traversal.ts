import { pushMapValue, type DagSource, type DagSliceOptions } from './dag-source-model.js';

/** Mutable working collections owned by one bounded source slice. */
export interface DagSliceState {
  readonly included: Set<string>;
  readonly ghostNodes: Map<string, { label: string; edges: string[] }>;
  readonly derivedParents: Map<string, string[]>;
}

/** @internal ID prefix for ghost nodes representing truncated ancestor branches. */
export const GHOST_ANCESTORS_PREFIX = '__ghost_ancestors_';

/** @internal ID prefix for ghost nodes representing truncated descendant branches. */
export const GHOST_DESCENDANTS_PREFIX = '__ghost_descendants_';

/** Include ancestors and their truncated boundary markers. */
export function includeSliceAncestors(
  source: DagSource, focus: string, maxDepth: number,
  explicitDirection: DagSliceOptions['direction'], state: DagSliceState,
): void {
  const { included, ghostNodes } = state;
  if (!source.parents) {
    if (explicitDirection === 'ancestors') {
      throw new Error(
        '[bijou] dagSlice(): source.parents() is required for ancestor traversal',
      );
    }
    // direction defaulted to 'both' — silently downgrade to descendants-only
  } else {
    const getParents = source.parents.bind(source);
    const queue: [string, number][] = [[focus, 0]];
    const visited = new Set<string>();
    for (let next = queue.shift(); next !== undefined; next = queue.shift()) {
      const [id, depth] = next;
      if (visited.has(id)) continue;
      visited.add(id);
      included.add(id);
      if (depth < maxDepth) {
        for (const p of getParents(id)) {
          if (!visited.has(p) && source.has(p)) queue.push([p, depth + 1]);
        }
      } else {
        const boundaryParents = [...getParents(id)].filter(
          p => !visited.has(p) && source.has(p),
        );
        if (boundaryParents.length > 0) {
          const ghostId = `${GHOST_ANCESTORS_PREFIX}${id}`;
          included.add(ghostId);
          const count = boundaryParents.length;
          ghostNodes.set(ghostId, {
            label: `... ${String(count)} ancestor${count !== 1 ? 's' : ''}`,
            edges: [id],
          });
        }
      }
    }
  }
}

/** Include descendants and derive reverse edges when the source omits parents. */
export function includeSliceDescendants(
  source: DagSource, focus: string, maxDepth: number, state: DagSliceState,
): void {
  const { included, ghostNodes, derivedParents } = state;
  const queue: [string, number][] = [[focus, 0]];
  const visited = new Set<string>();
  for (let next = queue.shift(); next !== undefined; next = queue.shift()) {
    const [id, depth] = next;
    if (visited.has(id)) continue;
    visited.add(id);
    included.add(id);
    const ch = [...source.children(id)].filter(c => source.has(c));
    // Track reverse edges for derived parent map
    if (!source.parents) {
      for (const c of ch) {
        pushMapValue(derivedParents, c, id);
      }
    }
    if (depth < maxDepth) {
      for (const c of ch) {
        if (!visited.has(c)) queue.push([c, depth + 1]);
      }
    } else {
      const boundaryChildren = ch.filter(c => !visited.has(c));
      if (boundaryChildren.length > 0) {
        const ghostId = `${GHOST_DESCENDANTS_PREFIX}${id}`;
        included.add(ghostId);
        const count = boundaryChildren.length;
        ghostNodes.set(ghostId, {
          label: `... ${String(count)} descendant${count !== 1 ? 's' : ''}`,
          edges: [],
        });
      }
    }
  }
}
