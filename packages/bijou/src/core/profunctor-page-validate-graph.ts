import { failPageTarget } from './profunctor-page-error.js';
import type { ProfunctorPageArtifact } from './profunctor-page-model.js';

export function validatePageGraph(page: ProfunctorPageArtifact): void {
  const nodeIds = unique(page.nodes.map((node) => node.pageNodeId), 'page.nodes');
  unique(page.nodes.map((node) => node.templateNodeId), 'page.templateNodeIds');
  unique(page.readingOrder, 'page.readingOrder');
  const contentRefs = unique(page.contentRefs, 'page.contentRefs');
  unique(page.overrideRefs, 'page.overrideRefs');
  unique(page.dependencyDigests, 'page.dependencyDigests');
  unique(page.tokenRefs, 'page.tokenRefs');
  unique(page.capabilityRequirements, 'page.capabilityRequirements');
  unique(page.outline.map((item) => JSON.stringify(item)), 'page.outline');
  unique(page.landmarks.map((item) => JSON.stringify(item)), 'page.landmarks');

  if (!nodeIds.has(page.rootNodeId)) {
    invalid('page.rootNodeId', `missing node ${page.rootNodeId}`);
  }
  assertExactSet(page.readingOrder, nodeIds, 'page.readingOrder');

  const ownedChildren: string[] = [];
  for (const node of page.nodes) {
    unique(node.slots.map((slot) => slot.name), `${node.pageNodeId}.slots`);
    unique(
      node.requiredCapabilities,
      `${node.pageNodeId}.requiredCapabilities`,
    );
    for (const slot of node.slots) {
      for (const childId of slot.childPageNodeIds) {
        if (!nodeIds.has(childId)) {
          invalid(`${node.pageNodeId}.slots.${slot.name}`, `missing child ${childId}`);
        }
        ownedChildren.push(childId);
      }
    }
    for (const capability of node.requiredCapabilities) {
      if (!page.capabilityRequirements.includes(capability)) {
        invalid(node.pageNodeId, `undeclared capability ${capability}`);
      }
    }
    for (const token of Object.values(node.tokens)) {
      if (!page.tokenRefs.includes(token)) {
        invalid(node.pageNodeId, `undeclared token ${token}`);
      }
    }
    if (node.contentNodeId != null && !contentRefs.has(node.contentNodeId)) {
      invalid(node.pageNodeId, `undeclared content node ${node.contentNodeId}`);
    }
  }
  unique(ownedChildren, 'page.slotChildren');
  assertExactSet(
    ownedChildren,
    new Set([...nodeIds].filter((id) => id !== page.rootNodeId)),
    'page.slotChildren',
  );

  for (const [index, item] of page.outline.entries()) {
    if (!nodeIds.has(item.pageNodeId) || !Number.isInteger(item.level) || item.level < 1) {
      invalid(`page.outline[${String(index)}]`, 'invalid node or heading level');
    }
  }
  for (const [index, landmark] of page.landmarks.entries()) {
    if (!nodeIds.has(landmark.pageNodeId)) {
      invalid(`page.landmarks[${String(index)}]`, `missing node ${landmark.pageNodeId}`);
    }
  }
}

function unique(values: readonly string[], path: string): Set<string> {
  const output = new Set<string>();
  for (const value of values) {
    if (output.has(value)) {
      invalid(path, `duplicate identity ${value}`);
    }
    output.add(value);
  }
  return output;
}

function assertExactSet(
  values: readonly string[],
  expected: ReadonlySet<string>,
  path: string,
): void {
  const actual = new Set(values);
  if (actual.size !== expected.size || [...expected].some((value) => !actual.has(value))) {
    invalid(path, 'must contain every page node exactly once');
  }
}

function invalid(path: string, detail: string): never {
  failPageTarget('BIJOU_PAGE_INPUT_REFERENCE_INVALID', path, detail);
}
