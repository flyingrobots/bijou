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
