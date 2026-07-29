import {
  expectContractId,
  expectExactKeys,
  expectIntegerAtLeast,
} from './profunctor-page-contract.js';
import { failPageTarget } from './profunctor-page-error.js';
import {
  expectBoolean,
  expectRecord,
  expectRecords,
  expectString,
  expectStringRecord,
  expectStrings,
  type JsonRecord,
} from './profunctor-page-json.js';
import type {
  ProfunctorPageArtifact,
  ProfunctorPageNode,
} from './profunctor-page-model.js';

export function parsePageNode(raw: JsonRecord, path: string): ProfunctorPageNode {
  expectExactKeys(
    raw,
    path,
    [
      'pageNodeId',
      'templateNodeId',
      'blockDefinitionId',
      'props',
      'tokens',
      'slots',
      'requiredCapabilities',
      'hidden',
    ],
    ['contentNodeId', 'sourceBindings'],
  );
  return {
    blockDefinitionId: expectContractId(
      raw.blockDefinitionId,
      `${path}.blockDefinitionId`,
      'block:',
    ),
    contentNodeId: raw.contentNodeId == null
      ? null
      : expectContractId(raw.contentNodeId, `${path}.contentNodeId`, 'content:'),
    hidden: expectBoolean(raw.hidden, `${path}.hidden`),
    pageNodeId: expectContractId(raw.pageNodeId, `${path}.pageNodeId`, 'page-node:'),
    props: expectRecord(raw.props, `${path}.props`),
    requiredCapabilities: expectStrings(
      raw.requiredCapabilities,
      `${path}.requiredCapabilities`,
    ),
    slots: expectRecords(raw.slots, `${path}.slots`).map((slot, index) => {
      const slotPath = `${path}.slots[${String(index)}]`;
      expectExactKeys(slot, slotPath, ['name', 'childPageNodeIds']);
      return {
        name: expectString(slot.name, `${slotPath}.name`),
        childPageNodeIds: expectStrings(
          slot.childPageNodeIds,
          `${slotPath}.childPageNodeIds`,
        ).map((id, childIndex) => expectContractId(
          id,
          `${slotPath}.childPageNodeIds[${String(childIndex)}]`,
          'page-node:',
        )),
      };
    }),
    sourceBindings: raw.sourceBindings === undefined
      ? {}
      : expectSourceBindings(raw.sourceBindings, `${path}.sourceBindings`),
    templateNodeId: expectContractId(
      raw.templateNodeId,
      `${path}.templateNodeId`,
      'template:',
    ),
    tokens: expectStringRecord(raw.tokens, `${path}.tokens`),
  };
}

export function parseLandmarks(
  value: unknown,
  filename: string,
): ProfunctorPageArtifact['landmarks'] {
  return expectRecords(value, `${filename}.landmarks`).map((item, index) => {
    const path = `${filename}.landmarks[${String(index)}]`;
    expectExactKeys(item, path, ['pageNodeId', 'role']);
    return {
      pageNodeId: expectContractId(item.pageNodeId, `${path}.pageNodeId`, 'page-node:'),
      role: expectString(item.role, `${path}.role`),
    };
  });
}

export function parseOutline(
  value: unknown,
  filename: string,
): ProfunctorPageArtifact['outline'] {
  return expectRecords(value, `${filename}.outline`).map((item, index) => {
    const path = `${filename}.outline[${String(index)}]`;
    expectExactKeys(item, path, ['pageNodeId', 'level', 'text']);
    const level = expectIntegerAtLeast(item.level, `${path}.level`, 1);
    if (level > 6) {
      invalid(`${path}.level`, 'expected integer <= 6');
    }
    return {
      level,
      pageNodeId: expectContractId(item.pageNodeId, `${path}.pageNodeId`, 'page-node:'),
      text: expectString(item.text, `${path}.text`),
    };
  });
}

function expectSourceBindings(
  value: unknown,
  path: string,
): Record<string, string> {
  const bindings = expectStringRecord(value, path);
  if (Object.keys(bindings).length === 0) {
    invalid(path, 'source bindings must not be empty');
  }
  return Object.fromEntries(Object.entries(bindings).map(([key, occurrence]) => [
    expectBindingKey(key, path),
    expectContractId(occurrence, `${path}.${key}`, 'source-occurrence:'),
  ]));
}

function expectBindingKey(key: string, path: string): string {
  if (
    key.length === 0
    || /\s/u.test(key)
    || key === '__proto__'
    || key === 'constructor'
    || key === 'prototype'
  ) {
    invalid(`${path}.${key}`, 'unsafe source-binding name');
  }
  return key;
}

function invalid(path: string, detail: string): never {
  failPageTarget('BIJOU_PAGE_INPUT_REFERENCE_INVALID', path, detail);
}
