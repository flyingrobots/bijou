import { isSlicedDagSource, type DagSource, type SlicedDagSource, type DagSliceOptions } from './dag-source-model.js';
import {
  GHOST_ANCESTORS_PREFIX, GHOST_DESCENDANTS_PREFIX,
  includeSliceAncestors, includeSliceDescendants,
} from './dag-source-traversal.js';

/** @internal Shared frozen empty array for sources with no nodes. */
const EMPTY_IDS: readonly string[] = Object.freeze([]);

/** @internal Singleton empty source for missing focus nodes. */
const EMPTY_SOURCE: SlicedDagSource = Object.freeze({
  ids: () => EMPTY_IDS,
  has: () => false,
  label: () => '',
  children: () => EMPTY_IDS,
  ghost: () => false,
  ghostLabel: () => undefined,
});

/**
 * BFS-walk a `DagSource` from a focus node and return a bounded
 * `SlicedDagSource` containing only the neighborhood.
 *
 * Ghost nodes are injected at depth boundaries to indicate truncated
 * branches. Never calls `ids()` on the source — works purely via
 * traversal. For ancestor/both directions, `source.parents()` must
 * be provided.
 *
 * @param source - The (possibly unbounded) graph to slice.
 * @param focus - ID of the node to center the slice around.
 * @param opts - Traversal direction and maximum depth.
 * @returns A bounded `SlicedDagSource` containing the neighborhood.
 * @throws If `direction` is `'ancestors'` and `source.parents` is not provided.
 *   When `direction` is `'both'` (the default) and `source.parents` is absent,
 *   silently downgrades to descendants-only traversal instead of throwing.
 */
export function sliceSource(
  source: DagSource,
  focus: string,
  opts?: DagSliceOptions,
): SlicedDagSource {
  const explicitDirection = opts?.direction;
  const direction = explicitDirection ?? 'both';
  const maxDepth = opts?.depth ?? Infinity;

  if (!source.has(focus)) return EMPTY_SOURCE;

  const included = new Set<string>();
  const ghostNodes = new Map<string, { label: string; edges: string[] }>();
  // Precomputed reverse map for when source.parents is absent
  const derivedParents = new Map<string, string[]>();

  const state = { included, ghostNodes, derivedParents };
  if (direction === 'ancestors' || direction === 'both') {
    includeSliceAncestors(source, focus, maxDepth, explicitDirection, state);
  }
  if (direction === 'descendants' || direction === 'both') {
    includeSliceDescendants(source, focus, maxDepth, state);
  }

  // Build the sliced DagSource
  const slicedIds = Object.freeze([...included]);
  // Inherit ghost status from input when slicing a SlicedDagSource
  const inheritGhost = isSlicedDagSource(source) ? source : null;

  return {
    ids: () => slicedIds,

    has: (id) => included.has(id),

    label: (id) => {
      const ghost = ghostNodes.get(id);
      if (ghost) return ghost.label;
      return source.label(id);
    },

    children: (id) => {
      const ghost = ghostNodes.get(id);
      if (ghost) return [...ghost.edges];
      // Filter to included IDs, plus any descendant ghost for this node
      const ch = [...source.children(id)].filter(c => included.has(c));
      const descGhostId = `${GHOST_DESCENDANTS_PREFIX}${id}`;
      if (ghostNodes.has(descGhostId)) ch.push(descGhostId);
      return ch;
    },

    parents: (id) => {
      if (ghostNodes.has(id)) {
        if (id.startsWith(GHOST_ANCESTORS_PREFIX)) return [];
        const boundaryId = id.replace(GHOST_DESCENDANTS_PREFIX, '');
        return included.has(boundaryId) ? [boundaryId] : [];
      }
      if (source.parents) {
        return [...source.parents(id)].filter(p => included.has(p));
      }
      return (derivedParents.get(id) ?? []).filter(p => included.has(p));
    },

    badge: (id) => ghostNodes.has(id) ? undefined : source.badge?.(id),

    token: (id) => ghostNodes.has(id) ? undefined : source.token?.(id),

    bgToken: (id) => ghostNodes.has(id) ? undefined : source.bgToken?.(id),

    labelToken: (id) => ghostNodes.has(id) ? undefined : source.labelToken?.(id),

    badgeToken: (id) => ghostNodes.has(id) ? undefined : source.badgeToken?.(id),

    compactShape: (id) => ghostNodes.has(id) ? undefined : source.compactShape?.(id),

    ghost: (id) => ghostNodes.has(id) || (inheritGhost?.ghost(id) ?? false),

    ghostLabel: (id) => ghostNodes.get(id)?.label ?? inheritGhost?.ghostLabel(id),
  };
}
