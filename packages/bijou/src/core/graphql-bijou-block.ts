import {
  UI_SCENE_IR_VERSION,
  hashUiSceneValue,
  type UiAction,
  type UiBinding,
  type UiI18nUse,
  type UiLayoutIntent,
  type UiNode,
  type UiSceneIr,
  type UiSourceMapEntry,
  type UiStyleRef,
  type UiTargetProfile,
  type UiTextRef,
  type UiTokenUse,
} from './ui-scene-ir.js';

export const BIJOU_BLOCK_ARTIFACT_VERSION = 'bijou-block/1' as const;
export type BijouBlockArtifactVersion = typeof BIJOU_BLOCK_ARTIFACT_VERSION;

export interface CompileGraphqlBijouBlockOptions {
  readonly sourceName?: string;
}

export interface BijouBlockFieldAction {
  readonly id: string;
  readonly command: string;
  readonly keybindings: readonly string[];
}

export interface BijouBlockFieldBinding {
  readonly id: string;
  readonly targetProperty: string;
  readonly source: {
    readonly kind: 'state' | 'query' | 'computed';
    readonly path: string;
  };
  readonly when?: string;
}

export interface BijouBlockField {
  readonly fieldName: string;
  readonly nodeId: string;
  readonly graphqlType: string;
  readonly source: string;
  readonly layout: UiLayoutIntent;
  readonly text: UiTextRef;
  readonly style?: UiStyleRef;
  readonly action?: BijouBlockFieldAction;
  readonly binding?: BijouBlockFieldBinding;
}

export interface BijouBlockArtifact {
  readonly artifactVersion: BijouBlockArtifactVersion;
  readonly id: string;
  readonly component: string;
  readonly sourceTypeName: string;
  readonly sourceName: string;
  readonly sourceHash: string;
  readonly rootNodeId: string;
  readonly fields: readonly BijouBlockField[];
  readonly targetProfiles: readonly UiTargetProfile[];
}

interface ParsedGraphqlBijouBlock {
  readonly typeName: string;
  readonly typeDirectives: readonly ParsedDirective[];
  readonly fields: readonly ParsedField[];
}

interface ParsedField {
  readonly fieldName: string;
  readonly graphqlType: string;
  readonly directives: readonly ParsedDirective[];
}

interface FieldDraft {
  readonly fieldName: string;
  readonly graphqlType: string;
  readonly directiveTexts: string[];
}

interface ParsedDirective {
  readonly name: string;
  readonly args: Readonly<Record<string, DirectiveArgValue>>;
}

type DirectiveArgValue = string | number;

const DEFAULT_SOURCE_NAME = 'inline.graphql';
const IDENTIFIER_PATTERN = '[A-Za-z_][A-Za-z0-9_]*';
const FIELD_PATTERN = new RegExp(`^(${IDENTIFIER_PATTERN})\\s*:\\s*([A-Za-z0-9_!\\[\\]]+)(.*)$`);
const TYPE_PATTERN = new RegExp(`^type\\s+(${IDENTIFIER_PATTERN})\\b(.*)$`);
const DIRECTIVE_PATTERN = new RegExp(`@(${IDENTIFIER_PATTERN})\\s*\\(([^)]*)\\)`, 'g');
const ARG_PATTERN = new RegExp(`(${IDENTIFIER_PATTERN})\\s*:\\s*("(?:[^"\\\\]|\\\\.)*"|-?\\d+)`, 'g');

export function compileGraphqlBijouBlock(
  source: string,
  options: CompileGraphqlBijouBlockOptions = {},
): BijouBlockArtifact {
  const sourceName = normalizeSourceName(options.sourceName ?? DEFAULT_SOURCE_NAME);
  const parsed = parseConstrainedGraphqlBijouBlock(source);
  const blockDirective = directiveByName(parsed.typeDirectives, 'bijouBlock');
  const blockId = blockDirective == null ? undefined : optionalStringArg(blockDirective, 'id');
  const component = blockDirective == null ? undefined : optionalStringArg(blockDirective, 'component');
  if (blockId == null || component == null) {
    throw new Error('GraphQL Bijou block source must include @bijouBlock(id:, component:).');
  }

  const targetProfiles = targetProfilesFor(parsed.typeDirectives);
  const fields = parsed.fields.map((field) => bijouBlockFieldFor(field, parsed.typeName, sourceName));
  const rootNodeId = `${blockId}.root`;
  assertUniqueBlockIdentities(fields, rootNodeId);
  const artifactBody = {
    artifactVersion: BIJOU_BLOCK_ARTIFACT_VERSION,
    id: blockId,
    component,
    sourceTypeName: parsed.typeName,
    sourceName,
    rootNodeId,
    fields,
    targetProfiles,
  } satisfies Omit<BijouBlockArtifact, 'sourceHash'>;

  return {
    ...artifactBody,
    sourceHash: hashUiSceneValue(artifactBody),
  };
}

export function lowerBijouBlockToUiScene(artifact: BijouBlockArtifact): UiSceneIr {
  const nodes: UiNode[] = [
    {
      id: artifact.rootNodeId,
      kind: 'group',
      component: artifact.component,
      children: artifact.fields.map((field) => field.nodeId),
      metadata: {
        artifactVersion: artifact.artifactVersion,
        sourceTypeName: artifact.sourceTypeName,
      },
    },
  ];
  const actions: UiAction[] = [];
  const bindings: UiBinding[] = [];
  const tokenUses: UiTokenUse[] = [];
  const i18nUses: UiI18nUse[] = [];
  const sourceMap: UiSourceMapEntry[] = [];

  for (const field of artifact.fields) {
    nodes.push(nodeForField(artifact, field));
    sourceMap.push({ nodeId: field.nodeId, source: field.source });
    appendTokenUses(tokenUses, field);
    appendI18nUse(i18nUses, field.nodeId, field.text);

    if (field.action != null) {
      actions.push({
        id: field.action.id,
        command: field.action.command,
        keybindings: field.action.keybindings,
        label: field.text,
        targetNodeId: field.nodeId,
      });
      appendI18nUse(i18nUses, field.action.id, field.text, 'action');
    }

    if (field.binding != null) {
      bindings.push({
        id: field.binding.id,
        targetNodeId: field.nodeId,
        targetProperty: field.binding.targetProperty,
        source: field.binding.source,
        when: field.binding.when,
      });
    }
  }

  return {
    irVersion: UI_SCENE_IR_VERSION,
    id: artifact.id,
    sourceHash: artifact.sourceHash,
    rootNodeId: artifact.rootNodeId,
    nodes,
    bindings,
    actions,
    tokenUses,
    i18nUses,
    sourceMap,
    targetProfiles: artifact.targetProfiles,
    portability: { level: 'portable' },
  };
}

function parseConstrainedGraphqlBijouBlock(source: string): ParsedGraphqlBijouBlock {
  const typeDirectiveTexts: string[] = [];
  const fields: ParsedField[] = [];
  let typeName: string | undefined;
  let insideType = false;
  let currentField: FieldDraft | undefined;

  for (const rawLine of source.replace(/\r\n?/g, '\n').split('\n')) {
    const trimmed = stripGraphqlLineComment(rawLine).trim();
    if (trimmed.length === 0) {
      continue;
    }

    if (typeName == null) {
      const match = TYPE_PATTERN.exec(trimmed);
      if (match == null) {
        continue;
      }
      typeName = match[1]!;
      const rest = match[2] ?? '';
      typeDirectiveTexts.push(rest);
      insideType = rest.includes('{');
      continue;
    }

    if (!insideType) {
      typeDirectiveTexts.push(trimmed);
      insideType = trimmed.includes('{');
      continue;
    }

    if (trimmed.startsWith('}')) {
      if (currentField != null) {
        fields.push(fieldFromDraft(currentField));
        currentField = undefined;
      }
      break;
    }

    const fieldMatch = FIELD_PATTERN.exec(trimmed);
    if (fieldMatch != null) {
      if (currentField != null) {
        fields.push(fieldFromDraft(currentField));
      }
      currentField = {
        fieldName: fieldMatch[1]!,
        graphqlType: fieldMatch[2]!,
        directiveTexts: [fieldMatch[3] ?? ''],
      };
      continue;
    }

    if (trimmed.startsWith('@') && currentField != null) {
      currentField.directiveTexts.push(trimmed);
    }
  }

  if (typeName == null) {
    throw new Error('GraphQL Bijou block source must include a type definition.');
  }
  if (currentField != null) {
    fields.push(fieldFromDraft(currentField));
  }

  return {
    typeName,
    typeDirectives: parseDirectives(typeDirectiveTexts.join('\n')),
    fields,
  };
}

function fieldFromDraft(draft: FieldDraft): ParsedField {
  return {
    fieldName: draft.fieldName,
    graphqlType: draft.graphqlType,
    directives: parseDirectives(draft.directiveTexts.join('\n')),
  };
}

function parseDirectives(source: string): readonly ParsedDirective[] {
  const directives: ParsedDirective[] = [];
  for (const match of source.matchAll(DIRECTIVE_PATTERN)) {
    directives.push({
      name: match[1]!,
      args: parseDirectiveArgs(match[2] ?? ''),
    });
  }
  return directives;
}

function parseDirectiveArgs(source: string): Readonly<Record<string, DirectiveArgValue>> {
  const args: Record<string, DirectiveArgValue> = {};
  for (const match of source.matchAll(ARG_PATTERN)) {
    const key = match[1]!;
    const rawValue = match[2]!;
    args[key] = rawValue.startsWith('"') ? parseQuotedArg(rawValue) : Number(rawValue);
  }
  return args;
}

function parseQuotedArg(rawValue: string): string {
  try {
    return JSON.parse(rawValue) as string;
  } catch {
    throw new Error(`Invalid GraphQL Bijou block string argument: ${rawValue}`);
  }
}

function bijouBlockFieldFor(field: ParsedField, typeName: string, sourceName: string): BijouBlockField {
  const textDirective = requireDirective(field, 'bijouText');
  const i18nDirective = requireDirective(field, 'bijouI18n');
  const tokenDirective = directiveByName(field.directives, 'bijouToken');
  const actionDirective = directiveByName(field.directives, 'bijouAction');
  const bindingDirective = directiveByName(field.directives, 'bijouBind');
  const nodeId = requiredStringArg(textDirective, 'id', `@bijouText on ${field.fieldName} must include id:.`);
  return {
    fieldName: field.fieldName,
    nodeId,
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

function nodeForField(artifact: BijouBlockArtifact, field: BijouBlockField): UiNode {
  const node: UiNode = {
    id: field.nodeId,
    kind: 'text',
    component: artifact.component,
    parentId: artifact.rootNodeId,
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

function targetProfilesFor(directives: readonly ParsedDirective[]): readonly UiTargetProfile[] {
  const targetDirective = requireDirective(
    { fieldName: 'type', directives },
    'bijouTarget',
    'GraphQL Bijou block source must include @bijouTarget(kind:, cols:, rows:).',
  );
  const kind = requiredStringArg(targetDirective, 'kind', '@bijouTarget must include kind:.');
  if (kind !== 'bijou-terminal') {
    throw new Error(`Unsupported GraphQL Bijou block target kind: ${kind}`);
  }
  return [
    {
      kind,
      cols: requiredPositiveIntegerArg(targetDirective, 'cols', '@bijouTarget bijou-terminal must include positive cols:.'),
      rows: requiredPositiveIntegerArg(targetDirective, 'rows', '@bijouTarget bijou-terminal must include positive rows:.'),
    },
  ];
}

function layoutFor(directive: ParsedDirective): UiLayoutIntent {
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

function styleFor(directive: ParsedDirective): UiStyleRef {
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

function actionFor(directive: ParsedDirective): BijouBlockFieldAction {
  const id = requiredStringArg(directive, 'id', '@bijouAction must include id:.');
  const command = requiredStringArg(directive, 'command', '@bijouAction must include command:.');
  const key = optionalStringArg(directive, 'key');
  return {
    id,
    command,
    keybindings: key == null ? [] : [key],
  };
}

function bindingFor(directive: ParsedDirective): BijouBlockFieldBinding {
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

function requireDirective(
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

function directiveByName(directives: readonly ParsedDirective[], name: string): ParsedDirective | undefined {
  const matches = directives.filter((directive) => directive.name === name);
  if (matches.length > 1) {
    throw new Error(`GraphQL Bijou block source has duplicate @${name} directives.`);
  }
  return matches[0];
}

function requiredStringArg(directive: ParsedDirective, name: string, message: string): string {
  const value = optionalStringArg(directive, name);
  if (value == null) {
    throw new Error(message);
  }
  return value;
}

function optionalStringArg(directive: ParsedDirective, name: string): string | undefined {
  const value = directive.args[name];
  return typeof value === 'string' ? value : undefined;
}

function requiredPositiveIntegerArg(directive: ParsedDirective, name: string, message: string): number {
  const value = optionalIntegerArg(directive, name);
  if (value == null || value <= 0) {
    throw new Error(message);
  }
  return value;
}

function optionalIntegerArg(directive: ParsedDirective, name: string): number | undefined {
  const value = directive.args[name];
  return typeof value === 'number' && Number.isInteger(value) ? value : undefined;
}

function copyOptionalIntegerArg(
  directive: ParsedDirective,
  layout: { x?: number; y?: number; width?: number; height?: number },
  name: 'x' | 'y' | 'width' | 'height',
): void {
  const value = optionalIntegerArg(directive, name);
  if (value != null) {
    layout[name] = value;
  }
}

function appendTokenUses(tokenUses: UiTokenUse[], field: BijouBlockField): void {
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

function appendI18nUse(i18nUses: UiI18nUse[], id: string, text: UiTextRef, kind: 'node' | 'action' = 'node'): void {
  if (text.kind !== 'i18n') {
    return;
  }
  i18nUses.push(kind === 'node'
    ? { nodeId: id, key: text.key }
    : { actionId: id, key: text.key });
}

function assertUniqueBlockIdentities(fields: readonly BijouBlockField[], rootNodeId: string): void {
  assertUniqueValues(
    fields.map((field) => field.fieldName),
    'field name',
  );
  assertUniqueValues(
    [rootNodeId, ...fields.map((field) => field.nodeId)],
    'node id',
  );
  assertUniqueValues(
    fields.flatMap((field) => field.action == null ? [] : [field.action.id]),
    'action id',
  );
  assertUniqueValues(
    fields.flatMap((field) => field.binding == null ? [] : [field.binding.id]),
    'binding id',
  );
}

function assertUniqueValues(values: readonly string[], label: string): void {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) {
      throw new Error(`Duplicate GraphQL Bijou block ${label}: ${value}`);
    }
    seen.add(value);
  }
}

function normalizeSourceName(sourceName: string): string {
  const trimmed = sourceName.trim();
  if (trimmed.length === 0) {
    throw new Error('GraphQL Bijou block sourceName cannot be empty.');
  }
  if (trimmed.startsWith('/') || /^[A-Za-z]:[\\/]/.test(trimmed) || trimmed.includes('\0')) {
    throw new Error('GraphQL Bijou block sourceName must be a relative or logical name.');
  }
  return trimmed;
}

function stripGraphqlLineComment(line: string): string {
  let quoted = false;
  let escaped = false;
  for (let index = 0; index < line.length; index++) {
    const char = line[index]!;
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === '\\') {
      escaped = true;
      continue;
    }
    if (char === '"') {
      quoted = !quoted;
      continue;
    }
    if (!quoted && char === '#') {
      return line.slice(0, index);
    }
  }
  return line;
}
