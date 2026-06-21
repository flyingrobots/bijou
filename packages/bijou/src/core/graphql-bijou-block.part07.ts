import type { UiLayoutIntent, UiNode, UiStyleRef, UiTargetProfile } from './ui-scene-ir.js';

import type { BijouBlockArtifact, BijouBlockField, BijouBlockFieldAction, BijouBlockFieldBinding } from './graphql-bijou-block.part01.js';

import type { ParsedDirective } from './graphql-bijou-block.part02.js';

import { copyOptionalIntegerArg, optionalStringArg, requireDirective, requiredPositiveIntegerArg, requiredStringArg } from './graphql-bijou-block.part08.js';
export function nodeForField(artifact: BijouBlockArtifact, field: BijouBlockField): UiNode {
  const node: UiNode = {
    id: field.nodeId,
    kind: 'text',
    component: artifact.component,
    parentId: field.groupId ?? artifact.rootNodeId,
    layout: field.layout,
    text: field.text,
    style: field.style,
    actions: field.action == null ? undefined : [field.action.id],
    metadata: {
      graphqlField: field.fieldName,
      graphqlType: field.graphqlType,
    },
  };
  return node;
}
export function targetProfilesFor(directives: readonly ParsedDirective[]): readonly UiTargetProfile[] {
  const targetDirective = requireDirective(
    { fieldName: 'type', directives },
    'bijouTarget',
    'GraphQL Bijou block source must include @bijouTarget(kind:, cols:, rows:).',
  );
  const kind = requiredStringArg(targetDirective, 'kind', '@bijouTarget must include kind:.');
  if (kind !== 'bijou-terminal') {
    throw new Error(`Unsupported GraphQL Bijou block target kind: ${kind}`);
  }
  return [{
    kind,
    cols: requiredPositiveIntegerArg(targetDirective, 'cols', '@bijouTarget bijou-terminal must include positive cols:.'),
    rows: requiredPositiveIntegerArg(targetDirective, 'rows', '@bijouTarget bijou-terminal must include positive rows:.'),
  }];
}
export function layoutFor(directive: ParsedDirective): UiLayoutIntent {
  const layout: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  } = {};
  copyOptionalIntegerArg(directive, layout, 'x');
  copyOptionalIntegerArg(directive, layout, 'y');
  copyOptionalIntegerArg(directive, layout, 'width');
  copyOptionalIntegerArg(directive, layout, 'height');
  return layout;
}
export function styleFor(directive: ParsedDirective): UiStyleRef {
  const style: {
    fg?: { readonly token: string };
    bg?: { readonly token: string };
    border?: { readonly token: string };
  } = {};
  const fg = optionalStringArg(directive, 'fg');
  const bg = optionalStringArg(directive, 'bg');
  const border = optionalStringArg(directive, 'border');
  if (fg != null) {
    style.fg = { token: fg };
  }
  if (bg != null) {
    style.bg = { token: bg };
  }
  if (border != null) {
    style.border = { token: border };
  }
  return style;
}
export function actionFor(directive: ParsedDirective): BijouBlockFieldAction {
  const id = requiredStringArg(directive, 'id', '@bijouAction must include id:.');
  const command = requiredStringArg(directive, 'command', '@bijouAction must include command:.');
  const key = optionalStringArg(directive, 'key');
  return {
    id,
    command,
    keybindings: key == null ? [] : [key],
  };
}
export function bindingFor(directive: ParsedDirective): BijouBlockFieldBinding {
  const kind = requiredStringArg(directive, 'kind', '@bijouBind must include kind:.');
  if (kind !== 'state' && kind !== 'query' && kind !== 'computed') {
    throw new Error(`Unsupported @bijouBind kind: ${kind}`);
  }
  return {
    id: requiredStringArg(directive, 'id', '@bijouBind must include id:.'),
    targetProperty: optionalStringArg(directive, 'targetProperty') ?? 'text',
    source: {
      kind,
      path: requiredStringArg(directive, 'path', '@bijouBind must include path:.'),
    },
    when: optionalStringArg(directive, 'when'),
  };
}
