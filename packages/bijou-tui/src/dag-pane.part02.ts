import { isSlicedDagSource } from '@flyingrobots/bijou';

import type { DagNode, SlicedDagSource } from '@flyingrobots/bijou';

import type { Adjacency } from './dag-pane.part01.js';
export function buildAdjacency(source: DagNode[] | SlicedDagSource): Adjacency {
  const childMap = new Map<string, string[]>();
  const parentMap = new Map<string, string[]>();

  if (isSlicedDagSource(source)) {
    const ids = source.ids();
    const idSet = new Set(ids);
    for (const id of ids) {
      const children = source.children(id).filter((c) => idSet.has(c));
      childMap.set(id, [...children]);
      if (!parentMap.has(id)) parentMap.set(id, []);
      for (const child of children) {
        let parents = parentMap.get(child);
        if (!parents) {
          parents = [];
          parentMap.set(child, parents);
        }
        parents.push(id);
      }
    }
  } else {
    const idSet = new Set(source.map((n) => n.id));
    for (const node of source) {
      const children = (node.edges ?? []).filter((e) => idSet.has(e));
      childMap.set(node.id, children);
      if (!parentMap.has(node.id)) parentMap.set(node.id, []);
      for (const child of children) {
        let parents = parentMap.get(child);
        if (!parents) {
          parents = [];
          parentMap.set(child, parents);
        }
        parents.push(node.id);
      }
    }
  }

  const roots: string[] = [];
  for (const [id, parents] of parentMap) {
    if (parents.length === 0) roots.push(id);
  }
  // Also add any nodes that are in childMap but not parentMap (shouldn't happen, but safe)
  for (const id of childMap.keys()) {
    if (!parentMap.has(id)) roots.push(id);
  }

  return {
    children: childMap,
    parents: parentMap,
    roots,
  };
}
