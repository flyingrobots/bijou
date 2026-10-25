import type { TokenValue } from '../theme/tokens.js';
import type { DagNode } from './dag.js';

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

  /** Optional per-node background token. */
  bgToken?(id: string): TokenValue | undefined;

  /** Optional per-node label text color. */
  labelToken?(id: string): TokenValue | undefined;

  /** Optional per-node badge text color. */
  badgeToken?(id: string): TokenValue | undefined;

  /** Optional compact node wrapper used by the compact renderer. */
  compactShape?(id: string): DagNode['compactShape'];
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

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value); }

export function pushMapValue(map: Map<string, string[]>, key: string, value: string): void { const values = map.get(key); if (values === undefined) map.set(key, [value]); else values.push(value); }

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
  return isRecord(value)
    && typeof value['has'] === 'function'
    && typeof value['label'] === 'function'
    && typeof value['children'] === 'function';
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
  return isDagSource(value)
    && isRecord(value)
    && typeof value['ids'] === 'function'
    && typeof value['ghost'] === 'function'
    && typeof value['ghostLabel'] === 'function';
}
