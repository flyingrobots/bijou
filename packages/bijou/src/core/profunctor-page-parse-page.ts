import {
  expectBoolean,
  expectNullableString,
  expectNumber,
  expectRecord,
  expectRecords,
  expectString,
  expectStringRecord,
  expectStrings,
  expectVersion,
  parseCanonicalRecord,
} from './profunctor-page-json.js';
import type { JsonRecord } from './profunctor-page-json-record.js';
import type {
  ProfunctorArtifactInput,
  ProfunctorPageArtifact,
  ProfunctorPageNode,
} from './profunctor-page-model.js';

export function parsePageArtifact(input: ProfunctorArtifactInput): ProfunctorPageArtifact {
  const raw = parseCanonicalRecord(input.source, input.filename);
  expectVersion(raw, 'profunctor-page/0', input.filename);
  return {
    artifactVersion: 'profunctor-page/0',
    capabilityRequirements: expectStrings(
      raw.capabilityRequirements,
      `${input.filename}.capabilityRequirements`,
    ),
    compositionRef: expectString(raw.compositionRef, `${input.filename}.compositionRef`),
    dependencyDigests: expectStrings(
      raw.dependencyDigests,
      `${input.filename}.dependencyDigests`,
    ),
    entityRef: expectString(raw.entityRef, `${input.filename}.entityRef`),
    landmarks: parseLandmarks(raw.landmarks, input.filename),
    nodes: expectRecords(raw.nodes, `${input.filename}.nodes`).map(
      (node, index) => parseNode(node, `${input.filename}.nodes[${String(index)}]`),
    ),
    outline: parseOutline(raw.outline, input.filename),
    pageId: expectString(raw.pageId, `${input.filename}.pageId`),
    publicationRef: expectString(raw.publicationRef, `${input.filename}.publicationRef`),
    readingOrder: expectStrings(raw.readingOrder, `${input.filename}.readingOrder`),
    rootNodeId: expectString(raw.rootNodeId, `${input.filename}.rootNodeId`),
    route: expectString(raw.route, `${input.filename}.route`),
    tokenRefs: expectStrings(raw.tokenRefs, `${input.filename}.tokenRefs`),
  };
}

function parseNode(raw: JsonRecord, path: string): ProfunctorPageNode {
  return {
    blockDefinitionId: expectString(raw.blockDefinitionId, `${path}.blockDefinitionId`),
    contentNodeId: expectNullableString(raw.contentNodeId, `${path}.contentNodeId`),
    hidden: expectBoolean(raw.hidden, `${path}.hidden`),
    pageNodeId: expectString(raw.pageNodeId, `${path}.pageNodeId`),
    props: expectRecord(raw.props, `${path}.props`),
    requiredCapabilities: expectStrings(
      raw.requiredCapabilities,
      `${path}.requiredCapabilities`,
    ),
    slots: expectRecords(raw.slots, `${path}.slots`).map((slot, index) => ({
      name: expectString(slot.name, `${path}.slots[${String(index)}].name`),
      childPageNodeIds: expectStrings(
        slot.childPageNodeIds,
        `${path}.slots[${String(index)}].childPageNodeIds`,
      ),
    })),
    sourceBindings: raw.sourceBindings === undefined
      ? {}
      : expectStringRecord(raw.sourceBindings, `${path}.sourceBindings`),
    templateNodeId: expectString(raw.templateNodeId, `${path}.templateNodeId`),
    tokens: expectStringRecord(raw.tokens, `${path}.tokens`),
  };
}

function parseLandmarks(
  value: unknown,
  filename: string,
): ProfunctorPageArtifact['landmarks'] {
  return expectRecords(value, `${filename}.landmarks`).map((item, index) => ({
    pageNodeId: expectString(
      item.pageNodeId,
      `${filename}.landmarks[${String(index)}].pageNodeId`,
    ),
    role: expectString(item.role, `${filename}.landmarks[${String(index)}].role`),
  }));
}

function parseOutline(
  value: unknown,
  filename: string,
): ProfunctorPageArtifact['outline'] {
  return expectRecords(value, `${filename}.outline`).map((item, index) => ({
    level: expectNumber(item.level, `${filename}.outline[${String(index)}].level`),
    pageNodeId: expectString(
      item.pageNodeId,
      `${filename}.outline[${String(index)}].pageNodeId`,
    ),
    text: expectString(item.text, `${filename}.outline[${String(index)}].text`),
  }));
}
