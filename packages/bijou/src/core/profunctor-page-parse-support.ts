import {
  expectNullableString,
  expectRecord,
  expectRecords,
  expectString,
  expectStrings,
  expectVersion,
  parseCanonicalRecord,
} from './profunctor-page-json.js';
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
  return {
    artifactVersion: 'profunctor-page-source-map/0',
    entries: expectRecords(raw.entries, `${input.filename}.entries`).map(
      (entry, index) => {
        const path = `${input.filename}.entries[${String(index)}]`;
        return {
          pageNodeId: expectString(entry.pageNodeId, `${path}.pageNodeId`),
          renderNodeId: expectNullableString(entry.renderNodeId, `${path}.renderNodeId`),
          residual: entry.residual ?? null,
          source: expectRecord(entry.source, `${path}.source`),
          sourceOccurrenceId: expectString(
            entry.sourceOccurrenceId,
            `${path}.sourceOccurrenceId`,
          ),
          templateNodeId: expectString(entry.templateNodeId, `${path}.templateNodeId`),
        };
      },
    ),
    pageId: expectString(raw.pageId, `${input.filename}.pageId`),
  };
}

export function parseBuildManifest(
  input: ProfunctorArtifactInput,
): ProfunctorBuildManifest {
  const raw = parseCanonicalRecord(input.source, input.filename);
  expectVersion(raw, 'profunctor-build-manifest/0', input.filename);
  const entity = expectRecord(raw.entity, `${input.filename}.entity`);
  return {
    artifactDigest: expectString(
      raw.artifactDigest,
      `${input.filename}.artifactDigest`,
    ),
    artifactVersion: 'profunctor-build-manifest/0',
    claims: expectStrings(raw.claims, `${input.filename}.claims`),
    dependencies: expectStrings(raw.dependencies, `${input.filename}.dependencies`),
    entity: {
      entityDigest: expectString(
        entity.entityDigest,
        `${input.filename}.entity.entityDigest`,
      ),
      entityId: expectString(entity.entityId, `${input.filename}.entity.entityId`),
    },
    pageId: expectString(raw.pageId, `${input.filename}.pageId`),
    routes: expectStrings(raw.routes, `${input.filename}.routes`),
  };
}
