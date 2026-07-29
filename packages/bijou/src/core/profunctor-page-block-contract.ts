import { failPageTarget } from './profunctor-page-error.js';
import { expectRecords, expectString, expectStrings } from './profunctor-page-json.js';
import type { ProfunctorPageNode } from './profunctor-page-model.js';

export const SUPPORTED_PAGE_BLOCKS = new Set([
  'block:page',
  'block:project-hero',
  'block:project-facts',
  'block:project-documentation',
  'block:project-related',
]);

export function validateBlockContract(node: ProfunctorPageNode): void {
  if (!SUPPORTED_PAGE_BLOCKS.has(node.blockDefinitionId)) {
    if (node.hidden) {
      return;
    }
    failPageTarget(
      'BIJOU_PAGE_BLOCK_UNSUPPORTED',
      node.pageNodeId,
      `unsupported visible block ${node.blockDefinitionId}`,
    );
  }
  const path = `${node.pageNodeId}.props`;
  switch (node.blockDefinitionId) {
    case 'block:page':
      requiredStrings(node, path, ['displayTitle', 'route', 'summary']);
      break;
    case 'block:project-hero':
      requiredStrings(node, path, [
        'title',
        'summary',
        'documentationUrl',
        'sourceUrl',
      ]);
      break;
    case 'block:project-facts':
      requiredStrings(node, path, ['kind', 'organization', 'program']);
      expectStrings(node.props.categoryPaths, `${path}.categoryPaths`);
      break;
    case 'block:project-documentation':
      requiredStrings(node, path, ['displayTitle', 'documentationUrl']);
      break;
    case 'block:project-related':
      requiredStrings(node, path, ['displayTitle', 'primaryCategoryLabel']);
      validateRelated(node, path);
      break;
  }
}

function requiredStrings(
  node: ProfunctorPageNode,
  path: string,
  fields: readonly string[],
): void {
  for (const field of fields) {
    expectString(node.props[field], `${path}.${field}`);
  }
}

function validateRelated(node: ProfunctorPageNode, path: string): void {
  for (const [index, related] of expectRecords(
    node.props.relatedProjects,
    `${path}.relatedProjects`,
  ).entries()) {
    const itemPath = `${path}.relatedProjects[${String(index)}]`;
    expectString(related.displayTitle, `${itemPath}.displayTitle`);
    expectString(related.entityId, `${itemPath}.entityId`);
    expectString(related.kind, `${itemPath}.kind`);
    expectString(related.route, `${itemPath}.route`);
  }
}
