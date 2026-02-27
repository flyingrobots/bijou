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
  direction?: 'ancestors' | 'descendants' | 'both';
  depth?: number;
}

// ── Type Guard ──────────────────────────────────────────────────────

/** Returns true if the value implements the `DagSource` interface. */
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

/** Returns true if the value is a `SlicedDagSource` (bounded, with `ids()`). */
export function isSlicedDagSource(value: unknown): value is SlicedDagSource {
  return (
    isDagSource(value) &&
    typeof (value as SlicedDagSource).ids === 'function' &&
    typeof (value as SlicedDagSource).ghost === 'function'
  );
}

// ── arraySource ─────────────────────────────────────────────────────

/** Wraps a `DagNode[]` as a `SlicedDagSource`. Already bounded. */
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
    children: (id) => map.get(id)?.edges ?? [],
    parents: (id) => parentMap.get(id) ?? [],
    badge: (id) => map.get(id)?.badge,
    token: (id) => map.get(id)?.token,
    ghost: (id) => map.get(id)?._ghost ?? false,
    ghostLabel: (id) => map.get(id)?._ghostLabel,
  };
}

// ── materialize ─────────────────────────────────────────────────────

/** Converts a `SlicedDagSource` to `DagNode[]` for internal renderers. */
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
    if (source.ghost(id)) {
      node._ghost = true;
      node._ghostLabel = source.ghostLabel(id);
    }
    nodes.push(node);
  }
  return nodes;
}

// ── emptySource ─────────────────────────────────────────────────────

function emptySource(): SlicedDagSource {
  const empty: readonly string[] = Object.freeze([]);
  return {
    ids: () => empty,
    has: () => false,
    label: () => '',
    children: () => empty,
    ghost: () => false,
    ghostLabel: () => undefined,
  };
}

// ── sliceSource ─────────────────────────────────────────────────────

/**
 * BFS-walks a `DagSource` from a focus node and returns a bounded
 * `SlicedDagSource` containing only the neighborhood. Ghost nodes are
 * injected at depth boundaries.
 *
 * Never calls `ids()` on the source — works purely via traversal.
 * For ancestor/both directions, `source.parents()` must be provided.
 */
export function sliceSource(
  source: DagSource,
  focus: string,
  opts?: DagSliceOptions,
): SlicedDagSource {
  const direction = opts?.direction ?? 'both';
  const maxDepth = opts?.depth ?? Infinity;

  if (!source.has(focus)) return emptySource();

  const included = new Set<string>();
  const ghostNodes = new Map<string, { label: string; edges: string[] }>();

  // BFS ancestors
  if (direction === 'ancestors' || direction === 'both') {
    if (!source.parents) {
      throw new Error(
        '[bijou] dagSlice(): source.parents() is required for ancestor traversal',
      );
    }
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
          const ghostId = `__ghost_ancestors_${id}`;
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
      if (depth < maxDepth) {
        for (const c of ch) {
          if (!visited.has(c)) queue.push([c, depth + 1]);
        }
      } else {
        const boundaryChildren = ch.filter(c => !visited.has(c));
        if (boundaryChildren.length > 0) {
          const ghostId = `__ghost_descendants_${id}`;
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
      if (ghost) return ghost.edges;
      // Filter to included IDs, plus any descendant ghost for this node
      const ch = [...source.children(id)].filter(c => included.has(c));
      const descGhostId = `__ghost_descendants_${id}`;
      if (ghostNodes.has(descGhostId)) ch.push(descGhostId);
      return ch;
    },

    parents: (id) => {
      if (ghostNodes.has(id)) {
        if (id.startsWith('__ghost_ancestors_')) return [];
        const boundaryId = id.replace('__ghost_descendants_', '');
        return included.has(boundaryId) ? [boundaryId] : [];
      }
      if (source.parents) {
        return [...source.parents(id)].filter(p => included.has(p));
      }
      // Derive parents from children of included nodes
      const parents: string[] = [];
      for (const candidate of included) {
        if (!ghostNodes.has(candidate) && source.children(candidate).includes(id)) {
          parents.push(candidate);
        }
      }
      return parents;
    },

    badge: (id) => ghostNodes.has(id) ? undefined : source.badge?.(id),

    token: (id) => ghostNodes.has(id) ? undefined : source.token?.(id),

    ghost: (id) => ghostNodes.has(id),

    ghostLabel: (id) => ghostNodes.get(id)?.label,
  };
}
