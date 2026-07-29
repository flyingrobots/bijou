import {
  expectArray,
  expectNullableString,
  expectRecord,
  expectRecords,
  expectString,
  expectStrings,
  expectVersion,
  parseCanonicalRecord,
} from './profunctor-page-json.js';
import {
  expectContractId,
  expectDigest,
  expectExactKeys,
  expectRoute,
} from './profunctor-page-contract.js';
import { failPageTarget } from './profunctor-page-error.js';
import { validateStructuredSourceMapEntry } from './profunctor-page-source-shape.js';
import type {
  ProfunctorArtifactInput,
  ProfunctorBuildManifest,
  ProfunctorPageSourceMap,
} from './profunctor-page-model.js';

export function parsePageSourceMap(
  input: ProfunctorArtifactInput,
): ProfunctorPageSourceMap {
  const raw = parseCanonicalRecord(input.source, input.filename);
  expectVersion(raw, 'profunctor-page-source-map/0', input.filename);
  expectExactKeys(raw, input.filename, ['artifactVersion', 'pageId', 'entries']);
  return {
    artifactVersion: 'profunctor-page-source-map/0',
    entries: expectRecords(raw.entries, `${input.filename}.entries`).map(
      (entry, index) => {
        const path = `${input.filename}.entries[${String(index)}]`;
        validateStructuredSourceMapEntry(entry, path);
        return {
          pageNodeId: expectContractId(
            entry.pageNodeId,
            `${path}.pageNodeId`,
            'page-node:',
          ),
          renderNodeId: expectNullableString(entry.renderNodeId, `${path}.renderNodeId`),
          residual: entry.residual ?? null,
          source: expectRecord(entry.source, `${path}.source`),
          sourceOccurrenceId: expectContractId(
            entry.sourceOccurrenceId,
            `${path}.sourceOccurrenceId`,
            'source-occurrence:',
          ),
          templateNodeId: expectContractId(
            entry.templateNodeId,
            `${path}.templateNodeId`,
            'template:',
          ),
        };
      },
    ),
    pageId: expectContractId(raw.pageId, `${input.filename}.pageId`, 'page:'),
  };
}

export function parseBuildManifest(
  input: ProfunctorArtifactInput,
): ProfunctorBuildManifest {
  const raw = parseCanonicalRecord(input.source, input.filename);
  expectVersion(raw, 'profunctor-build-manifest/0', input.filename);
  expectExactKeys(raw, input.filename, [
    'artifactVersion',
    'pageId',
    'compiler',
    'profile',
    'routes',
    'entity',
    'sources',
    'dependencies',
    'artifactDigest',
    'claims',
    'obstructions',
  ]);
  expectString(raw.compiler, `${input.filename}.compiler`);
  expectString(raw.profile, `${input.filename}.profile`);
  const sources = expectRecords(raw.sources, `${input.filename}.sources`);
  if (sources.length > 0) {
    failPageTarget(
      'BIJOU_PAGE_BLOCK_UNSUPPORTED',
      `${input.filename}.sources`,
      'document sources are outside the bounded ProjectPage target',
    );
  }
  const obstructions = expectArray(
    raw.obstructions,
    `${input.filename}.obstructions`,
  );
  if (obstructions.length > 0) {
    failPageTarget(
      'BIJOU_PAGE_BLOCK_UNSUPPORTED',
      `${input.filename}.obstructions`,
      'obstructed builds are outside the bounded ProjectPage target',
    );
  }
  const entity = expectRecord(raw.entity, `${input.filename}.entity`);
  expectExactKeys(entity, `${input.filename}.entity`, ['entityId', 'entityDigest']);
  return {
    artifactDigest: expectDigest(
      raw.artifactDigest,
      `${input.filename}.artifactDigest`,
    ),
    artifactVersion: 'profunctor-build-manifest/0',
    claims: expectStrings(raw.claims, `${input.filename}.claims`),
    dependencies: expectStrings(
      raw.dependencies,
      `${input.filename}.dependencies`,
    ).map((digest, index) => expectDigest(
      digest,
      `${input.filename}.dependencies[${String(index)}]`,
    )),
    entity: {
      entityDigest: expectDigest(
        entity.entityDigest,
        `${input.filename}.entity.entityDigest`,
      ),
      entityId: expectContractId(
        entity.entityId,
        `${input.filename}.entity.entityId`,
        'entity:',
      ),
    },
    pageId: expectContractId(raw.pageId, `${input.filename}.pageId`, 'page:'),
    routes: expectStrings(raw.routes, `${input.filename}.routes`).map(
      (route, index) => expectRoute(
        route,
        `${input.filename}.routes[${String(index)}]`,
      ),
    ),
  };
}
