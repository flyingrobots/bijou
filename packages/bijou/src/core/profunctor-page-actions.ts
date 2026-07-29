import type {
  ProfunctorPageArtifact,
  ProfunctorPageNode,
} from './profunctor-page-model.js';
import type {
  ProfunctorPageActionFact,
} from './profunctor-page-target-types.js';
import type { JsonRecord } from './profunctor-page-json-record.js';
import { expectRecords } from './profunctor-page-json.js';

export interface PageAction extends ProfunctorPageActionFact {
  readonly key: string;
}

export function collectPageActions(page: ProfunctorPageArtifact): PageAction[] {
  return page.readingOrder.flatMap((pageNodeId) => {
    const node = page.nodes.find((candidate) => candidate.pageNodeId === pageNodeId);
    return node == null || node.hidden ? [] : actionsForNode(node);
  });
}

function actionsForNode(node: ProfunctorPageNode): PageAction[] {
  switch (node.blockDefinitionId) {
    case 'block:project-hero':
      return [
        action(node, 'documentation', 'Documentation', stringProp(node, 'documentationUrl')),
        action(node, 'source', 'Source', stringProp(node, 'sourceUrl')),
      ];
    case 'block:project-documentation':
      return [
        action(node, 'documentation', 'Documentation', stringProp(node, 'documentationUrl')),
      ];
    case 'block:project-related':
      return relatedActions(node);
    default:
      return [];
  }
}

function relatedActions(node: ProfunctorPageNode): PageAction[] {
  const related: readonly JsonRecord[] = expectRecords(
    node.props.relatedProjects,
    `${node.pageNodeId}.props.relatedProjects`,
  );
  return related.map((item, index) => action(
    node,
    `related-${String(index)}`,
    String(item.displayTitle),
    String(item.route),
  ));
}

function action(
  node: ProfunctorPageNode,
  key: string,
  label: string,
  target: string,
): PageAction {
  return {
    actionId: `bijou-action:${node.pageNodeId}/${key}`,
    pageNodeId: node.pageNodeId,
    key,
    label,
    target,
  };
}

function stringProp(node: ProfunctorPageNode, key: string): string {
  return String(node.props[key]);
}
