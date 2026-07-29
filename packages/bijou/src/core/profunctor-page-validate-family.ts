import { validateBlockContract } from './profunctor-page-block-contract.js';
import { failPageTarget } from './profunctor-page-error.js';
import type { ProfunctorArtifactFamily } from './profunctor-page-model.js';
import { validatePageGraph } from './profunctor-page-validate-graph.js';

export function validateProfunctorArtifactFamily(
  family: ProfunctorArtifactFamily,
): void {
  const { page, sourceMap, buildManifest, inputDigests } = family;
  if (buildManifest.artifactDigest !== inputDigests.page) {
    failPageTarget(
      'BIJOU_PAGE_INPUT_DIGEST_MISMATCH',
      'buildManifest.artifactDigest',
      `expected ${buildManifest.artifactDigest}; got ${inputDigests.page}`,
    );
  }
  if (sourceMap.pageId !== page.pageId || buildManifest.pageId !== page.pageId) {
    identity('pageId', 'page, source map, and build manifest must agree');
  }
  if (buildManifest.entity.entityId !== page.entityRef) {
    identity('entityRef', 'page and build manifest entity identities must agree');
  }
  if (buildManifest.routes.length !== 1 || buildManifest.routes[0] !== page.route) {
    identity('route', 'page route must be the sole build-manifest route');
  }
  if (!sameOrdered(buildManifest.dependencies, page.dependencyDigests)) {
    identity('dependencies', 'page and build manifest dependencies must agree in order');
  }
  uniqueStrings(buildManifest.dependencies, 'buildManifest.dependencies');
  uniqueStrings(buildManifest.claims, 'buildManifest.claims');

  validatePageGraph(page);
  for (const node of page.nodes) {
    validateBlockContract(node);
  }
  validateSourceMap(family);
}

function validateSourceMap(family: ProfunctorArtifactFamily): void {
  const { page, sourceMap } = family;
  const nodes = new Map(page.nodes.map((node) => [node.pageNodeId, node]));
  const occurrenceOwners = new Map<string, string>();
  for (const [index, entry] of sourceMap.entries.entries()) {
    const path = `sourceMap.entries[${String(index)}]`;
    const node = nodes.get(entry.pageNodeId);
    if (node?.templateNodeId !== entry.templateNodeId) {
      identity(path, 'page and template identities must match a page node');
    }
    if (occurrenceOwners.has(entry.sourceOccurrenceId)) {
      reference(path, 'source-occurrence identities must be unique');
    }
    if (!Object.values(node.sourceBindings).includes(entry.sourceOccurrenceId)) {
      identity(path, 'source occurrence must be bound by its page node');
    }
    if (entry.renderNodeId !== null || entry.residual !== null) {
      identity(path, 'compiler-owned source map must remain target-uncompleted');
    }
    occurrenceOwners.set(entry.sourceOccurrenceId, entry.pageNodeId);
  }
  for (const node of page.nodes) {
    for (const occurrence of Object.values(node.sourceBindings)) {
      const owner = occurrenceOwners.get(occurrence);
      if (owner == null) {
        reference(node.pageNodeId, `missing source occurrence ${occurrence}`);
      }
      if (owner !== node.pageNodeId) {
        identity(
          node.pageNodeId,
          `source occurrence ${occurrence} belongs to ${owner}`,
        );
      }
    }
  }
}

function sameOrdered(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length
    && left.every((value, index) => value === right[index]);
}

function uniqueStrings(values: readonly string[], path: string): void {
  if (new Set(values).size !== values.length) {
    reference(path, 'values must be unique');
  }
}

function identity(path: string, detail: string): never {
  failPageTarget('BIJOU_PAGE_INPUT_IDENTITY_MISMATCH', path, detail);
}

function reference(path: string, detail: string): never {
  failPageTarget('BIJOU_PAGE_INPUT_REFERENCE_INVALID', path, detail);
}
