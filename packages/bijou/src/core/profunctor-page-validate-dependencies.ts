import { expectDigest } from './profunctor-page-contract.js';
import { failPageTarget } from './profunctor-page-error.js';
import type { ProfunctorArtifactFamily } from './profunctor-page-model.js';
import { readPageSourceProvenance } from './profunctor-page-provenance.js';

export function validatePageDependencyLineage(
  family: ProfunctorArtifactFamily,
): void {
  const { page, sourceMap, buildManifest } = family;
  const dependencies = new Set(page.dependencyDigests);
  requireDependency(
    buildManifest.entity.entityDigest,
    'buildManifest.entity.entityDigest',
    dependencies,
  );
  for (const node of page.nodes) {
    const provenance = readPageSourceProvenance(node, false);
    if (provenance !== null) {
      requireDependency(
        provenance.sourceDigest,
        `${node.pageNodeId}.props.sourceProvenance.sourceDigest`,
        dependencies,
      );
    }
  }
  for (const [index, entry] of sourceMap.entries.entries()) {
    const path = `sourceMap.entries[${String(index)}].source`;
    requireDependency(
      expectDigest(entry.source.sourceDigest, `${path}.sourceDigest`),
      `${path}.sourceDigest`,
      dependencies,
    );
    requireDependency(
      expectDigest(entry.source.recordDigest, `${path}.recordDigest`),
      `${path}.recordDigest`,
      dependencies,
    );
  }
}

function requireDependency(
  digest: string,
  path: string,
  dependencies: ReadonlySet<string>,
): void {
  if (!dependencies.has(digest)) {
    failPageTarget(
      'BIJOU_PAGE_INPUT_IDENTITY_MISMATCH',
      path,
      `${digest} is not declared as a page dependency`,
    );
  }
}
