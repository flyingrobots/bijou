import { failPageTarget } from './profunctor-page-error.js';
import { expectRecords, expectString, expectStrings } from './profunctor-page-json.js';
import type { ProfunctorPageNode } from './profunctor-page-model.js';
import {
  expectContractId,
  expectHttpUrl,
  expectRoute,
} from './profunctor-page-contract.js';
import { readPageSourceProvenance } from './profunctor-page-provenance.js';

export const SUPPORTED_PAGE_BLOCKS = new Set([
  'block:page',
  'block:project-hero',
  'block:project-facts',
  'block:project-documentation',
  'block:project-related',
]);

export function validateBlockContract(node: ProfunctorPageNode): void {
  const supported = SUPPORTED_PAGE_BLOCKS.has(node.blockDefinitionId);
  readPageSourceProvenance(node, supported);
  if (!supported) {
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
      expectRoute(node.props.route, `${path}.route`);
      break;
    case 'block:project-hero':
      requiredStrings(node, path, [
        'title',
        'summary',
        'documentationUrl',
        'sourceUrl',
      ]);
      expectHttpUrl(node.props['documentationUrl'], `${path}.documentationUrl`);
      expectHttpUrl(node.props['sourceUrl'], `${path}.sourceUrl`);
      break;
    case 'block:project-facts':
      requiredStrings(node, path, ['kind', 'organization', 'program']);
      expectStrings(node.props.categoryPaths, `${path}.categoryPaths`);
      break;
    case 'block:project-documentation':
      requiredStrings(node, path, ['displayTitle', 'documentationUrl']);
      expectHttpUrl(node.props['documentationUrl'], `${path}.documentationUrl`);
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
    expectContractId(related.entityId, `${itemPath}.entityId`, 'entity:');
    expectString(related.kind, `${itemPath}.kind`);
    expectRoute(related.route, `${itemPath}.route`);
  }
}
