import type { UiI18nUse, UiTextRef, UiTokenUse } from './ui-scene-ir.js';

import type { BijouBlockField, BijouBlockGroup } from './graphql-bijou-block.part01.js';

import type { ParsedDirective } from './graphql-bijou-block.part02.js';

import { assertUniqueValues } from './graphql-bijou-block.part09.js';
export function requireDirective(
  owner: { readonly fieldName: string; readonly directives: readonly ParsedDirective[] },
  name: string,
  message?: string,
): ParsedDirective {
  const directive = directiveByName(owner.directives, name);
  if (directive == null) {
    throw new Error(message ?? `GraphQL Bijou block field ${owner.fieldName} must include @${name}(...).`);
  }
  return directive;
}
export function directiveByName(directives: readonly ParsedDirective[], name: string): ParsedDirective | undefined {
  const matches = directives.filter((directive) => directive.name === name);
  if (matches.length > 1) {
    throw new Error(`GraphQL Bijou block source has duplicate @${name} directives.`);
  }
  return matches[0];
}
export function directivesByName(directives: readonly ParsedDirective[], name: string): readonly ParsedDirective[] {
  return directives.filter((directive) => directive.name === name);
}
export function requiredStringArg(directive: ParsedDirective, name: string, message: string): string {
  const value = optionalStringArg(directive, name);
  if (value == null) {
    throw new Error(message);
  }
  return value;
}
export function optionalStringArg(directive: ParsedDirective, name: string): string | undefined {
  const value = directive.args[name];
  return typeof value === 'string' ? value : undefined;
}
export function requiredPositiveIntegerArg(directive: ParsedDirective, name: string, message: string): number {
  const value = optionalIntegerArg(directive, name);
  if (value == null || value <= 0) {
    throw new Error(message);
  }
  return value;
}
export function optionalIntegerArg(directive: ParsedDirective, name: string): number | undefined {
  const value = directive.args[name];
  return typeof value === 'number' && Number.isInteger(value) ? value : undefined;
}
export function copyOptionalIntegerArg(
  directive: ParsedDirective,
  layout: { x?: number; y?: number; width?: number; height?: number },
  name: 'x' | 'y' | 'width' | 'height',
): void {
  const value = optionalIntegerArg(directive, name);
  if (value != null) {
    layout[name] = value;
  }
}
export function appendTokenUses(tokenUses: UiTokenUse[], field: BijouBlockField): void {
  if (field.style?.fg?.token != null) {
    tokenUses.push({ nodeId: field.nodeId, slot: 'fg', token: field.style.fg.token });
  }
  if (field.style?.bg?.token != null) {
    tokenUses.push({ nodeId: field.nodeId, slot: 'bg', token: field.style.bg.token });
  }
  if (field.style?.border?.token != null) {
    tokenUses.push({ nodeId: field.nodeId, slot: 'border', token: field.style.border.token });
  }
}
export function appendI18nUse(i18nUses: UiI18nUse[], id: string, text: UiTextRef, kind: 'node' | 'action' = 'node'): void {
  if (text.kind !== 'i18n') {
    return;
  }
  i18nUses.push(kind === 'node'
    ? { nodeId: id, key: text.key }
    : { actionId: id, key: text.key });
}
export function assertUniqueBlockIdentities(
  groups: readonly BijouBlockGroup[],
  fields: readonly BijouBlockField[],
  rootNodeId: string,
): void {
  assertUniqueValues(fields.map((field) => field.fieldName), 'field name');
  assertUniqueValues(groups.map((group) => group.id), 'group id');
  assertUniqueValues([rootNodeId, ...groups.map((group) => group.id), ...fields.map((field) => field.nodeId)], 'node id');
  const groupIds = new Set(groups.map((group) => group.id));
  for (const field of fields) {
    if (field.groupId != null && !groupIds.has(field.groupId)) {
      throw new Error(`GraphQL Bijou block field ${field.fieldName} references missing group: ${field.groupId}`);
    }
  }
  assertUniqueValues(
    fields.flatMap((field) => field.action == null ? [] : [field.action.id]),
    'action id',
  );
  assertUniqueValues(
    fields.flatMap((field) => field.binding == null ? [] : [field.binding.id]),
    'binding id',
  );
}
