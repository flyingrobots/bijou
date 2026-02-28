import type { TokenValue } from '../theme/tokens.js';
import type { DagNode } from './dag.js';

// ── DagSource Interface ─────────────────────────────────────────────

/**
 * Adapter interface for accessing graph data. Decouples DAG rendering
 * from any specific in-memory representation. Implementations can wrap
 * arrays, databases, APIs, or any other graph store.
 *
 * A DagSource may represent an unbounded graph — it has no enumeration
 * method. Use `dagSlice()` to BFS-walk from a focus node and produce
 * a bounded `SlicedDagSource` that the renderer can consume.
 */
export interface DagSource {
  /** Returns true if a node with this ID exists in the graph. */
  has(id: string): boolean;

  /** Human-readable label for a node. */
  label(id: string): string;

  /** Child node IDs (outgoing edges). */
  children(id: string): readonly string[];

  /**
   * Parent node IDs (incoming edges). Required for ancestor traversal
   * in `dagSlice()`. Without this, only `direction: 'descendants'` is
   * supported.
   */
  parents?(id: string): readonly string[];

  /** Optional badge text for a node. */
  badge?(id: string): string | undefined;

  /** Optional per-node color/style token. */
  token?(id: string): TokenValue | undefined;

  /** Optional per-node label text color. */
  labelToken?(id: string): TokenValue | undefined;

  /** Optional per-node badge text color. */
  badgeToken?(id: string): TokenValue | undefined;
}

/**
 * A bounded DagSource produced by `sliceSource()`. Extends DagSource
 * with `ids()` so the renderer can enumerate the finite node set.
 */
export interface SlicedDagSource extends DagSource {
  /** All node IDs in this bounded slice. */
  ids(): readonly string[];

  /** Whether this node is a ghost (boundary placeholder). */
  ghost(id: string): boolean;

  /** Ghost label override (e.g., "... 3 ancestors"). */
  ghostLabel(id: string): string | undefined;
}

/** Options for `dagSlice()`. */
export interface DagSliceOptions {
  /** Traversal direction from the focus node. Defaults to `'both'`. */
  direction?: 'ancestors' | 'descendants' | 'both';
  /** Maximum BFS depth from the focus node. Defaults to `Infinity`. */
  depth?: number;
}

// ── Type Guard ──────────────────────────────────────────────────────

/**
 * Return true if the value implements the `DagSource` interface.
 *
 * Checks for the presence of `has`, `label`, and `children` methods on
 * a non-null, non-array object.
 *
 * @param value - The value to test.
 * @returns `true` if `value` conforms to `DagSource`.
 */
export function isDagSource(value: unknown): value is DagSource {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    typeof (value as DagSource).has === 'function' &&
    typeof (value as DagSource).label === 'function' &&
    typeof (value as DagSource).children === 'function'
  );
}

/**
 * Return true if the value is a `SlicedDagSource` (bounded, with `ids()`).
 *
 * Extends `isDagSource` by additionally checking for `ids`, `ghost`, and
 * `ghostLabel` methods.
 *
 * @param value - The value to test.
 * @returns `true` if `value` conforms to `SlicedDagSource`.
 */
export function isSlicedDagSource(value: unknown): value is SlicedDagSource {
  return (
    isDagSource(value) &&
    typeof (value as SlicedDagSource).ids === 'function' &&
    typeof (value as SlicedDagSource).ghost === 'function' &&
    typeof (value as SlicedDagSource).ghostLabel === 'function'
  );
}

// ── arraySource ─────────────────────────────────────────────────────

/**
 * Wrap a `DagNode[]` as a `SlicedDagSource`.
 *
 * Pre-computes a parent map for efficient reverse lookups. The returned
 * source is already bounded (all node IDs are known).
 *
 * @param nodes - The array of DAG nodes to wrap.
 * @returns A `SlicedDagSource` backed by the provided array.
 */
export function arraySource(nodes: DagNode[]): SlicedDagSource {
  const map = new Map<string, DagNode>();
  for (const n of nodes) map.set(n.id, n);

  // Pre-compute parent map
  const parentMap = new Map<string, string[]>();
  for (const n of nodes) {
    if (!parentMap.has(n.id)) parentMap.set(n.id, []);
    for (const c of n.edges ?? []) {
      if (!parentMap.has(c)) parentMap.set(c, []);
      parentMap.get(c)!.push(n.id);
    }
  }

  const idList = Object.freeze(nodes.map(n => n.id));

  return {
    ids: () => idList,
    has: (id) => map.has(id),
    label: (id) => map.get(id)?.label ?? id,
    children: (id) => [...(map.get(id)?.edges ?? [])],
    parents: (id) => [...(parentMap.get(id) ?? [])],
    badge: (id) => map.get(id)?.badge,
    token: (id) => map.get(id)?.token,
    labelToken: (id) => map.get(id)?.labelToken,
    badgeToken: (id) => map.get(id)?.badgeToken,
    ghost: (id) => map.get(id)?._ghost ?? false,
    ghostLabel: (id) => map.get(id)?._ghostLabel,
  };
}

// ── materialize ─────────────────────────────────────────────────────

/**
 * @internal Convert a `SlicedDagSource` back to a `DagNode[]` array.
 *
 * Iterates over all IDs in the source and reconstructs `DagNode` objects,
 * preserving badges, tokens, and ghost metadata.
 *
 * @param source - The bounded source to materialize.
 * @returns Array of `DagNode` objects.
 */
export function materialize(source: SlicedDagSource): DagNode[] {
  const ids = source.ids();
  const nodes: DagNode[] = [];
  for (const id of ids) {
    const children = source.children(id);
    const node: DagNode = {
      id,
      label: source.label(id),
      edges: children.length > 0 ? [...children] : undefined,
    };
    const badge = source.badge?.(id);
    if (badge !== undefined) node.badge = badge;
    const token = source.token?.(id);
    if (token !== undefined) node.token = token;
    const labelToken = source.labelToken?.(id);
    if (labelToken !== undefined) node.labelToken = labelToken;
    const badgeToken = source.badgeToken?.(id);
    if (badgeToken !== undefined) node.badgeToken = badgeToken;
    if (source.ghost(id)) {
      node._ghost = true;
      node._ghostLabel = source.ghostLabel(id);
    }
    nodes.push(node);
  }
  return nodes;
}

// ── emptySource ─────────────────────────────────────────────────────

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

// ── Ghost ID Prefixes ───────────────────────────────────────────────

/** @internal ID prefix for ghost nodes representing truncated ancestor branches. */
const GHOST_ANCESTORS_PREFIX = '__ghost_ancestors_';

/** @internal ID prefix for ghost nodes representing truncated descendant branches. */
const GHOST_DESCENDANTS_PREFIX = '__ghost_descendants_';

// ── sliceSource ─────────────────────────────────────────────────────

/**
 * BFS-walk a `DagSource` from a focus node and return a bounded
 * `SlicedDagSource` containing only the neighborhood.
 *
 * Ghost nodes are injected at depth boundaries to indicate truncated
 * branches. Never calls `ids()` on the source -- works purely via
 * traversal. For ancestor/both directions, `source.parents()` must
 * be provided.
 *
 * @param source - The (possibly unbounded) graph to slice.
 * @param focus - ID of the node to center the slice around.
 * @param opts - Traversal direction and maximum depth.
 * @returns A bounded `SlicedDagSource` containing the neighborhood.
 * @throws If `direction` is `'ancestors'` and `source.parents` is not provided.
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

  // BFS ancestors
  if (direction === 'ancestors' || direction === 'both') {
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
      while (queue.length > 0) {
        const [id, depth] = queue.shift()!;
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
              label: `... ${count} ancestor${count !== 1 ? 's' : ''}`,
              edges: [id],
            });
          }
        }
      }
    }
  }

  // BFS descendants
  if (direction === 'descendants' || direction === 'both') {
    const queue: [string, number][] = [[focus, 0]];
    const visited = new Set<string>();
    while (queue.length > 0) {
      const [id, depth] = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);
      included.add(id);
      const ch = [...source.children(id)].filter(c => source.has(c));
      // Track reverse edges for derived parent map
      if (!source.parents) {
        for (const c of ch) {
          if (!derivedParents.has(c)) derivedParents.set(c, []);
          derivedParents.get(c)!.push(id);
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
            label: `... ${count} descendant${count !== 1 ? 's' : ''}`,
            edges: [],
          });
        }
      }
    }
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

    labelToken: (id) => ghostNodes.has(id) ? undefined : source.labelToken?.(id),

    badgeToken: (id) => ghostNodes.has(id) ? undefined : source.badgeToken?.(id),

    ghost: (id) => ghostNodes.has(id) || (inheritGhost !== null && inheritGhost.ghost(id)),

    ghostLabel: (id) => ghostNodes.get(id)?.label ?? inheritGhost?.ghostLabel(id),
  };
}
