import {
  expectRecords,
  expectStrings,
  expectVersion,
  parseCanonicalRecord,
} from './profunctor-page-json.js';
import {
  expectContractId,
  expectDigest,
  expectExactKeys,
  expectRoute,
  TOKEN_REFERENCE_PREFIX,
} from './profunctor-page-contract.js';
import { failPageTarget } from './profunctor-page-error.js';
import type {
  ProfunctorArtifactInput,
  ProfunctorPageArtifact,
} from './profunctor-page-model.js';
import {
  parseLandmarks,
  parseOutline,
  parsePageNode,
} from './profunctor-page-parse-page-structure.js';

export function parsePageArtifact(input: ProfunctorArtifactInput): ProfunctorPageArtifact {
  const raw = parseCanonicalRecord(input.source, input.filename);
  expectVersion(raw, 'profunctor-page/0', input.filename);
  expectExactKeys(raw, input.filename, [
    'artifactVersion',
    'pageId',
    'route',
    'publicationRef',
    'entityRef',
    'compositionRef',
    'rootNodeId',
    'nodes',
    'outline',
    'landmarks',
    'readingOrder',
    'contentRefs',
    'tokenRefs',
    'capabilityRequirements',
    'applicationIslands',
    'overrideRefs',
    'dependencyDigests',
  ]);
  const applicationIslands = expectRecords(
    raw.applicationIslands,
    `${input.filename}.applicationIslands`,
  );
  if (applicationIslands.length > 0) {
    failPageTarget(
      'BIJOU_PAGE_BLOCK_UNSUPPORTED',
      `${input.filename}.applicationIslands`,
      'application islands are outside the bounded ProjectPage target',
    );
  }
  return {
    artifactVersion: 'profunctor-page/0',
    capabilityRequirements: expectStrings(
      raw.capabilityRequirements,
      `${input.filename}.capabilityRequirements`,
    ),
    compositionRef: expectContractId(
      raw.compositionRef,
      `${input.filename}.compositionRef`,
      'composition:',
    ),
    contentRefs: expectStrings(
      raw.contentRefs,
      `${input.filename}.contentRefs`,
    ).map((id, index) => expectContractId(
      id,
      `${input.filename}.contentRefs[${String(index)}]`,
      'content:',
    )),
    dependencyDigests: expectStrings(
      raw.dependencyDigests,
      `${input.filename}.dependencyDigests`,
    ).map((digest, index) => expectDigest(
      digest,
      `${input.filename}.dependencyDigests[${String(index)}]`,
    )),
    entityRef: expectContractId(raw.entityRef, `${input.filename}.entityRef`, 'entity:'),
    landmarks: parseLandmarks(raw.landmarks, input.filename),
    nodes: expectRecords(raw.nodes, `${input.filename}.nodes`).map(
      (node, index) => parsePageNode(node, `${input.filename}.nodes[${String(index)}]`),
    ),
    outline: parseOutline(raw.outline, input.filename),
    overrideRefs: expectStrings(
      raw.overrideRefs,
      `${input.filename}.overrideRefs`,
    ).map((id, index) => expectContractId(
      id,
      `${input.filename}.overrideRefs[${String(index)}]`,
      'override:',
    )),
    pageId: expectContractId(raw.pageId, `${input.filename}.pageId`, 'page:'),
    publicationRef: expectContractId(
      raw.publicationRef,
      `${input.filename}.publicationRef`,
      'publication:',
    ),
    readingOrder: expectStrings(
      raw.readingOrder,
      `${input.filename}.readingOrder`,
    ).map((id, index) => expectContractId(
      id,
      `${input.filename}.readingOrder[${String(index)}]`,
      'page-node:',
    )),
    rootNodeId: expectContractId(
      raw.rootNodeId,
      `${input.filename}.rootNodeId`,
      'page-node:',
    ),
    route: expectRoute(raw.route, `${input.filename}.route`),
    tokenRefs: expectStrings(
      raw.tokenRefs,
      `${input.filename}.tokenRefs`,
    ).map((id, index) => expectContractId(
      id,
      `${input.filename}.tokenRefs[${String(index)}]`,
      TOKEN_REFERENCE_PREFIX,
    )),
  };
}
