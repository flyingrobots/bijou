import type { TokenValue } from '../theme/tokens.js';
import type { DagNode } from './dag.js';

// ── DagSource Interface ─────────────────────────────────────────────

/**
 * Adapter interface for accessing graph data. Decouples DAG rendering
 * from any specific in-memory representation. Implementations can wrap
 * arrays, databases, APIs, or any other graph store.
 *
 * Every render is a bounded slice — `dagSlice()` walks a `DagSource`
 * to produce a new (bounded) `DagSource` that the renderer consumes.
 */
export interface DagSource {
  /** All node IDs in this source (must be finite and enumerable). */
  ids(): readonly string[];

  /** Human-readable label for a node. */
  label(id: string): string;

  /** Child node IDs (outgoing edges). */
  children(id: string): readonly string[];

  /**
   * Parent node IDs (incoming edges). Optional — enables efficient
   * ancestor traversal in `dagSlice()`. When omitted, parents are
   * derived by scanning `children()` of all known IDs.
   */
  parents?(id: string): readonly string[];

  /** Optional badge text for a node. */
  badge?(id: string): string | undefined;

  /** Optional per-node color/style token. */
  token?(id: string): TokenValue | undefined;

  /** Whether this node is a ghost (boundary placeholder). */
  ghost?(id: string): boolean;

  /** Ghost label override (e.g., "... 3 ancestors"). */
  ghostLabel?(id: string): string | undefined;
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
    typeof (value as DagSource).ids === 'function' &&
    typeof (value as DagSource).label === 'function' &&
    typeof (value as DagSource).children === 'function'
  );
}

// ── arraySource ─────────────────────────────────────────────────────

/** Wraps a `DagNode[]` as a `DagSource`. Zero-copy read-only view. */
export function arraySource(nodes: DagNode[]): DagSource {
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

/** Converts a `DagSource` to `DagNode[]` for internal renderers. */
export function materialize(source: DagSource): DagNode[] {
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
    if (source.ghost?.(id)) {
      node._ghost = true;
      node._ghostLabel = source.ghostLabel?.(id);
    }
    nodes.push(node);
  }
  return nodes;
}

// ── emptySource ─────────────────────────────────────────────────────

function emptySource(): DagSource {
  const empty: readonly string[] = Object.freeze([]);
  return {
    ids: () => empty,
    label: () => '',
    children: () => empty,
  };
}

// ── sliceSource ─────────────────────────────────────────────────────

/**
 * BFS-walks a `DagSource` from a focus node and returns a new bounded
 * `DagSource` containing only the neighborhood. Ghost nodes are
 * injected at depth boundaries.
 */
export function sliceSource(
  source: DagSource,
  focus: string,
  opts?: DagSliceOptions,
): DagSource {
  const direction = opts?.direction ?? 'both';
  const maxDepth = opts?.depth ?? Infinity;

  const allIds = new Set(source.ids());
  if (!allIds.has(focus)) return emptySource();

  const included = new Set<string>();
  const ghostNodes = new Map<string, { label: string; edges: string[] }>();

  // Resolve parents — use source.parents if available, else derive
  const getParents = source.parents
    ? (id: string) => source.parents!(id)
    : (id: string) => {
        const parents: string[] = [];
        for (const candidate of allIds) {
          if (source.children(candidate).includes(id)) {
            parents.push(candidate);
          }
        }
        return parents;
      };

  // BFS ancestors
  if (direction === 'ancestors' || direction === 'both') {
    const queue: [string, number][] = [[focus, 0]];
    const visited = new Set<string>();
    while (queue.length > 0) {
      const [id, depth] = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);
      included.add(id);
      if (depth < maxDepth) {
        for (const p of getParents(id)) {
          if (!visited.has(p) && allIds.has(p)) queue.push([p, depth + 1]);
        }
      } else {
        const boundaryParents = [...getParents(id)].filter(
          p => !visited.has(p) && allIds.has(p),
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
      const ch = [...source.children(id)].filter(c => allIds.has(c));
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
        // Ghost ancestor nodes point down — they have no parents in the slice
        // Ghost descendant nodes also have no parents tracked
        if (id.startsWith('__ghost_ancestors_')) return [];
        // Descendant ghosts: parent is the boundary node
        const boundaryId = id.replace('__ghost_descendants_', '');
        return included.has(boundaryId) ? [boundaryId] : [];
      }
      return [...getParents(id)].filter(p => included.has(p));
    },

    badge: (id) => ghostNodes.has(id) ? undefined : source.badge?.(id),

    token: (id) => ghostNodes.has(id) ? undefined : source.token?.(id),

    ghost: (id) => ghostNodes.has(id),

    ghostLabel: (id) => ghostNodes.get(id)?.label,
  };
}
