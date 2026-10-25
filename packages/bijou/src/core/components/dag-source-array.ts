import type { DagNode } from './dag.js';
import { pushMapValue, type SlicedDagSource } from './dag-source-model.js';

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
      pushMapValue(parentMap, c, n.id);
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
    bgToken: (id) => map.get(id)?.bgToken,
    labelToken: (id) => map.get(id)?.labelToken,
    badgeToken: (id) => map.get(id)?.badgeToken,
    compactShape: (id) => map.get(id)?.compactShape,
    ghost: (id) => map.get(id)?._ghost ?? false,
    ghostLabel: (id) => map.get(id)?._ghostLabel,
  };
}

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
    const bgToken = source.bgToken?.(id);
    if (bgToken !== undefined) node.bgToken = bgToken;
    const labelToken = source.labelToken?.(id);
    if (labelToken !== undefined) node.labelToken = labelToken;
    const badgeToken = source.badgeToken?.(id);
    if (badgeToken !== undefined) node.badgeToken = badgeToken;
    const compactShape = source.compactShape?.(id);
    if (compactShape !== undefined) node.compactShape = compactShape;
    if (source.ghost(id)) {
      node._ghost = true;
      node._ghostLabel = source.ghostLabel(id);
    }
    nodes.push(node);
  }
  return nodes;
}
