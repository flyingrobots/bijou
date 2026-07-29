import type { DagNode } from './dag.js';

const edgeKey = (fromId: string, toId: string): string =>
  `${fromId}\u0000${toId}`;

export function assignLayers(nodes: DagNode[]): Map<string, number> {
  const nodeIds = new Set<string>();
  for (const node of nodes) {
    if (nodeIds.has(node.id)) {
      throw new Error(`[bijou] dag(): duplicate node id "${node.id}"`);
    }
    nodeIds.add(node.id);
  }

  const children = new Map<string, string[]>();
  const parents = new Map<string, string[]>();
  const inDegree = new Map<string, number>();
  const ignoredEdges = new Set<string>();
  for (const node of nodes) {
    children.set(
      node.id,
      (node.edges ?? []).filter((edge) => nodeIds.has(edge)),
    );
  }

  const visitState = new Map<string, 'visiting' | 'done'>();
  const visit = (id: string): void => {
    const state = visitState.get(id);
    if (state === 'visiting' || state === 'done') return;
    visitState.set(id, 'visiting');
    for (const childId of children.get(id) ?? []) {
      const childState = visitState.get(childId);
      if (childState === 'visiting') {
        ignoredEdges.add(edgeKey(id, childId));
      } else if (childState !== 'done') {
        visit(childId);
      }
    }
    visitState.set(id, 'done');
  };
  for (const node of nodes) visit(node.id);

  const layerChildren = new Map<string, string[]>();
  for (const node of nodes) {
    layerChildren.set(
      node.id,
      (children.get(node.id) ?? []).filter(
        (childId) => !ignoredEdges.has(edgeKey(node.id, childId)),
      ),
    );
    inDegree.set(node.id, 0);
    if (!parents.has(node.id)) parents.set(node.id, []);
  }
  for (const node of nodes) {
    for (const childId of layerChildren.get(node.id) ?? []) {
      const parentList = parents.get(childId);
      if (parentList === undefined) {
        parents.set(childId, [node.id]);
      } else {
        parentList.push(node.id);
      }
      inDegree.set(childId, (inDegree.get(childId) ?? 0) + 1);
    }
  }

  const queue: string[] = [];
  for (const [id, degree] of inDegree) {
    if (degree === 0) queue.push(id);
  }
  const topologicalOrder: string[] = [];
  let head = 0;
  while (head < queue.length) {
    const id = queue[head++];
    if (id === undefined) break;
    topologicalOrder.push(id);
    for (const childId of layerChildren.get(id) ?? []) {
      const degree = (inDegree.get(childId) ?? 1) - 1;
      inDegree.set(childId, degree);
      if (degree === 0) queue.push(childId);
    }
  }
  if (topologicalOrder.length !== nodes.length) {
    const scheduled = new Set(topologicalOrder);
    for (const node of nodes) {
      if (!scheduled.has(node.id)) topologicalOrder.push(node.id);
    }
  }

  const layerMap = new Map<string, number>();
  for (const id of topologicalOrder) {
    const nodeParents = parents.get(id) ?? [];
    let layer = 0;
    for (const parent of nodeParents) {
      layer = Math.max(layer, (layerMap.get(parent) ?? 0) + 1);
    }
    layerMap.set(id, layer);
  }
  return layerMap;
}
