import type { UiStyleRef } from './ui-scene-ir.js';

import type { Surface } from '../ports/surface.js';

import type { BijouBlockArtifact, BijouBlockField, GraphqlBijouBlockDebugFieldFact, GraphqlBijouBlockDebugGroupFact } from './graphql-bijou-block.part01.js';
export function debugGroupFacts(artifact: BijouBlockArtifact): readonly GraphqlBijouBlockDebugGroupFact[] {
  const groups = artifact.groups;
  return groups.map((group) => {
    const fact: {
      id: string;
      label?: string;
      source: string;
      childNodeIds: readonly string[];
    } = {
      id: group.id,
      source: group.source,
      childNodeIds: artifact.fields
        .filter((field) => field.groupId === group.id)
        .map((field) => field.nodeId),
    };
    if (group.label != null) {
      fact.label = group.label;
    }
    return fact;
  });
}
export function debugFieldFact(field: BijouBlockField): GraphqlBijouBlockDebugFieldFact {
  const fact: {
    fieldName: string;
    nodeId: string;
    groupId?: string;
    source: string;
    i18nKey?: string;
    tokenRefs: readonly string[];
    actionId?: string;
    bindingId?: string;
  } = {
    fieldName: field.fieldName,
    nodeId: field.nodeId,
    source: field.source,
    tokenRefs: styleTokenRefs(field.style),
  };
  if (field.groupId != null) {
    fact.groupId = field.groupId;
  }
  if (field.text.kind === 'i18n') {
    fact.i18nKey = field.text.key;
  }
  if (field.action != null) {
    fact.actionId = field.action.id;
  }
  if (field.binding != null) {
    fact.bindingId = field.binding.id;
  }
  return fact;
}
export function styleTokenRefs(style: UiStyleRef | undefined): readonly string[] {
  return sortedUniqueStrings([
    style?.fg?.token,
    style?.bg?.token,
    style?.border?.token,
  ].filter((token): token is string => token != null));
}
export function surfaceRows(surface: Surface): readonly string[] {
  const rows: string[] = [];
  for (let y = 0; y < surface.height; y++) {
    let row = '';
    for (let x = 0; x < surface.width; x++) {
      const cell = surface.get(x, y);
      row += cell.empty ? ' ' : cell.char;
    }
    rows.push(row.trimEnd());
  }
  return rows;
}
export function sortedUniqueStrings(values: readonly string[]): readonly string[] {
  return [...new Set(values)].sort(compareCodeUnits);
}
export function compareCodeUnits(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
export function assertUniqueValues(values: readonly string[], label: string): void {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) {
      throw new Error(`Duplicate GraphQL Bijou block ${label}: ${value}`);
    }
    seen.add(value);
  }
}
