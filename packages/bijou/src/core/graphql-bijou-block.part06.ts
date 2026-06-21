import type { UiLayoutIntent, UiNode } from './ui-scene-ir.js';

import { capture, parseGraphqlStringArg } from './graphql-parser-utils.js';

import type { BijouBlockArtifact, BijouBlockField, BijouBlockGroup } from './graphql-bijou-block.part01.js';

import { ARG_PATTERN } from './graphql-bijou-block.part02.js';

import type { DirectiveArgValue, ParsedDirective, ParsedField } from './graphql-bijou-block.part02.js';

import { actionFor, bindingFor, layoutFor, styleFor } from './graphql-bijou-block.part07.js';

import { directiveByName, directivesByName, optionalStringArg, requireDirective, requiredStringArg } from './graphql-bijou-block.part08.js';
export function parseDirectiveArgs(source: string): Readonly<Record<string, DirectiveArgValue>> {
  const args: Record<string, DirectiveArgValue> = {};
  for (const match of source.matchAll(ARG_PATTERN)) {
    const key = capture(match, 1, 'argument name');
    const rawValue = capture(match, 2, 'argument value');
    args[key] = rawValue.startsWith('"') ? parseGraphqlStringArg(rawValue) : Number(rawValue);
  }
  return args;
}
export function bijouBlockFieldFor(field: ParsedField, typeName: string, sourceName: string): BijouBlockField {
  const textDirective = requireDirective(field, 'bijouText');
  const i18nDirective = requireDirective(field, 'bijouI18n');
  const tokenDirective = directiveByName(field.directives, 'bijouToken');
  const actionDirective = directiveByName(field.directives, 'bijouAction');
  const bindingDirective = directiveByName(field.directives, 'bijouBind');
  const nodeId = requiredStringArg(textDirective, 'id', `@bijouText on ${field.fieldName} must include id:.`);
  return {
    fieldName: field.fieldName,
    nodeId,
    groupId: optionalStringArg(textDirective, 'group'),
    graphqlType: field.graphqlType,
    source: `${sourceName}#type.${typeName}.field.${field.fieldName}`,
    layout: layoutFor(textDirective),
    text: {
      kind: 'i18n',
      key: requiredStringArg(i18nDirective, 'key', `@bijouI18n on ${field.fieldName} must include key:.`),
      fallback: requiredStringArg(i18nDirective, 'fallback', `@bijouI18n on ${field.fieldName} must include fallback:.`),
    },
    style: tokenDirective == null ? undefined : styleFor(tokenDirective),
    action: actionDirective == null ? undefined : actionFor(actionDirective),
    binding: bindingDirective == null ? undefined : bindingFor(bindingDirective),
  };
}
export function groupsFor(
  directives: readonly ParsedDirective[],
  typeName: string,
  sourceName: string,
): readonly BijouBlockGroup[] {
  return directivesByName(directives, 'bijouGroup').map((directive) => {
    const id = requiredStringArg(directive, 'id', '@bijouGroup must include id:.');
    const label = optionalStringArg(directive, 'label');
    const group: {
      id: string;
      label?: string;
      source: string;
      layout: UiLayoutIntent;
    } = {
      id,
      source: `${sourceName}#type.${typeName}.group.${id}`,
      layout: layoutFor(directive),
    };
    if (label != null) {
      group.label = label;
    }
    return group;
  });
}
export function rootChildNodeIds(
  groups: readonly BijouBlockGroup[],
  fields: readonly BijouBlockField[],
): readonly string[] {
  if (groups.length === 0) {
    return fields.map((field) => field.nodeId);
  }
  return [
    ...groups.map((group) => group.id),
    ...fields.flatMap((field) => field.groupId == null ? [field.nodeId] : []),
  ];
}
export function nodeForGroup(artifact: BijouBlockArtifact, group: BijouBlockGroup): UiNode {
  const node: UiNode = {
    id: group.id,
    kind: 'group',
    component: artifact.component,
    parentId: artifact.rootNodeId,
    children: artifact.fields
      .filter((field) => field.groupId === group.id)
      .map((field) => field.nodeId),
    layout: group.layout,
    metadata: metadataForGroup(group),
  };
  return node;
}
export function metadataForGroup(group: BijouBlockGroup): Record<string, unknown> {
  const metadata: Record<string, unknown> = {
    graphqlGroup: group.id,
  };
  if (group.label != null) {
    metadata['label'] = group.label;
  }
  return metadata;
}
