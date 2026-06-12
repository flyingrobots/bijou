import {
  UI_SCENE_IR_VERSION,
  hashUiSceneValue,
  lowerUiSceneToTerminalProof,
  type UiAction,
  type UiBinding,
  type UiI18nUse,
  type UiLayoutIntent,
  type UiNode,
  type UiSceneIr,
  type UiSceneLoweringOptions,
  type UiSceneLowerMode,
  type UiSourceMapEntry,
  type UiStyleRef,
  type UiTargetProfile,
  type UiTextRef,
  type UiTokenUse,
} from './ui-scene-ir.js';
import type { Surface } from '../ports/surface.js';

export const BIJOU_BLOCK_ARTIFACT_VERSION = 'bijou-block/1' as const;
export const GRAPHQL_BIJOU_BLOCK_DEBUG_SUMMARY_VERSION = 'graphql-bijou-block-debug/1' as const;
export type BijouBlockArtifactVersion = typeof BIJOU_BLOCK_ARTIFACT_VERSION;
export type GraphqlBijouBlockDebugSummaryVersion = typeof GRAPHQL_BIJOU_BLOCK_DEBUG_SUMMARY_VERSION;

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

export interface BijouBlockGroup {
  readonly id: string;
  readonly label?: string;
  readonly source: string;
  readonly layout: UiLayoutIntent;
}

export interface BijouBlockField {
  readonly fieldName: string;
  readonly nodeId: string;
  readonly groupId?: string;
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
  readonly groups: readonly BijouBlockGroup[];
  readonly fields: readonly BijouBlockField[];
  readonly targetProfiles: readonly UiTargetProfile[];
}

export interface GraphqlBijouBlockDebugGroupFact {
  readonly id: string;
  readonly label?: string;
  readonly source: string;
  readonly childNodeIds: readonly string[];
}

export interface GraphqlBijouBlockDebugFieldFact {
  readonly fieldName: string;
  readonly nodeId: string;
  readonly groupId?: string;
  readonly source: string;
  readonly i18nKey?: string;
  readonly tokenRefs: readonly string[];
  readonly actionId?: string;
  readonly bindingId?: string;
}

export interface GraphqlBijouBlockDebugLowerModeFact {
  readonly mode: UiSceneLowerMode;
  readonly surfaceHash: string;
  readonly rows: readonly string[];
}

export interface GraphqlBijouBlockDebugSummary {
  readonly summaryVersion: GraphqlBijouBlockDebugSummaryVersion;
  readonly artifactVersion: BijouBlockArtifactVersion;
  readonly artifactId: string;
  readonly artifactHash: string;
  readonly sceneHash: string;
  readonly summaryHash: string;
  readonly rootNodeId: string;
  readonly groups: readonly GraphqlBijouBlockDebugGroupFact[];
  readonly fields: readonly GraphqlBijouBlockDebugFieldFact[];
  readonly sourceMap: readonly UiSourceMapEntry[];
  readonly i18nKeys: readonly string[];
  readonly tokenRefs: readonly string[];
  readonly actionIds: readonly string[];
  readonly bindingIds: readonly string[];
  readonly lowerModes: readonly GraphqlBijouBlockDebugLowerModeFact[];
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
const DEBUG_LOWER_MODES: readonly UiSceneLowerMode[] = ['normal', 'node-ids', 'i18n-keys', 'token-refs'];
const IDENTIFIER_PATTERN = '[A-Za-z_][A-Za-z0-9_]*';
const FIELD_PATTERN = new RegExp(`^(${IDENTIFIER_PATTERN})\\s*:\\s*([A-Za-z0-9_!\\[\\]]+)(.*)$`);
const TYPE_PATTERN = new RegExp(`^type\\s+(${IDENTIFIER_PATTERN})\\b(.*)$`);
const DIRECTIVE_PATTERN = new RegExp(`@(${IDENTIFIER_PATTERN})\\s*\\(((?:[^()"\\\\]|"(?:[^"\\\\]|\\\\.)*")*)\\)`, 'g');
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
  const groups = groupsFor(parsed.typeDirectives, parsed.typeName, sourceName);
  const fields = parsed.fields.map((field) => bijouBlockFieldFor(field, parsed.typeName, sourceName));
  const rootNodeId = `${blockId}.root`;
  assertUniqueBlockIdentities(groups, fields, rootNodeId);
  const artifactBody = {
    artifactVersion: BIJOU_BLOCK_ARTIFACT_VERSION,
    id: blockId,
    component,
    sourceTypeName: parsed.typeName,
    sourceName,
    rootNodeId,
    groups,
    fields,
    targetProfiles,
  } satisfies Omit<BijouBlockArtifact, 'sourceHash'>;

  return {
    ...artifactBody,
    sourceHash: hashUiSceneValue(artifactBody),
  };
}

export function lowerBijouBlockToUiScene(artifact: BijouBlockArtifact): UiSceneIr {
  const groups = artifact.groups ?? [];
  assertUniqueBlockIdentities(groups, artifact.fields, artifact.rootNodeId);
  const nodes: UiNode[] = [
    {
      id: artifact.rootNodeId,
      kind: 'group',
      component: artifact.component,
      children: rootChildNodeIds(groups, artifact.fields),
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

  for (const group of groups) {
    nodes.push(nodeForGroup(artifact, group));
    sourceMap.push({ nodeId: group.id, source: group.source });
  }

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

export function createGraphqlBijouBlockDebugSummary(
  artifact: BijouBlockArtifact,
  options: UiSceneLoweringOptions = {},
): GraphqlBijouBlockDebugSummary {
  const scene = lowerBijouBlockToUiScene(artifact);
  const body = {
    summaryVersion: GRAPHQL_BIJOU_BLOCK_DEBUG_SUMMARY_VERSION,
    artifactVersion: artifact.artifactVersion,
    artifactId: artifact.id,
    artifactHash: hashUiSceneValue(artifact),
    sceneHash: hashUiSceneValue(scene),
    rootNodeId: artifact.rootNodeId,
    groups: debugGroupFacts(artifact),
    fields: artifact.fields.map(debugFieldFact),
    sourceMap: scene.sourceMap,
    i18nKeys: sortedUniqueStrings(scene.i18nUses.map((use) => use.key)),
    tokenRefs: sortedUniqueStrings(scene.tokenUses.map((use) => use.token)),
    actionIds: sortedUniqueStrings(scene.actions.map((action) => action.id)),
    bindingIds: sortedUniqueStrings(scene.bindings.map((binding) => binding.id)),
    lowerModes: DEBUG_LOWER_MODES.map((mode) => {
      const proof = lowerUiSceneToTerminalProof(scene, {
        ...options,
        lowerMode: mode,
      });
      return {
        mode,
        surfaceHash: proof.lowering.surfaceHash,
        rows: surfaceRows(proof.lowering.surface),
      };
    }),
  } satisfies Omit<GraphqlBijouBlockDebugSummary, 'summaryHash'>;

  return {
    ...body,
    summaryHash: hashUiSceneValue({ ...body, summaryHash: undefined }),
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

function groupsFor(
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

function rootChildNodeIds(
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

function nodeForGroup(artifact: BijouBlockArtifact, group: BijouBlockGroup): UiNode {
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

function metadataForGroup(group: BijouBlockGroup): Record<string, unknown> {
  const metadata: Record<string, unknown> = {
    graphqlGroup: group.id,
  };
  if (group.label != null) {
    metadata['label'] = group.label;
  }
  return metadata;
}

function nodeForField(artifact: BijouBlockArtifact, field: BijouBlockField): UiNode {
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

function directivesByName(directives: readonly ParsedDirective[], name: string): readonly ParsedDirective[] {
  return directives.filter((directive) => directive.name === name);
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

function assertUniqueBlockIdentities(
  groups: readonly BijouBlockGroup[],
  fields: readonly BijouBlockField[],
  rootNodeId: string,
): void {
  assertUniqueValues(
    fields.map((field) => field.fieldName),
    'field name',
  );
  assertUniqueValues(
    groups.map((group) => group.id),
    'group id',
  );
  assertUniqueValues(
    [rootNodeId, ...groups.map((group) => group.id), ...fields.map((field) => field.nodeId)],
    'node id',
  );
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

function debugGroupFacts(artifact: BijouBlockArtifact): readonly GraphqlBijouBlockDebugGroupFact[] {
  const groups = artifact.groups ?? [];
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

function debugFieldFact(field: BijouBlockField): GraphqlBijouBlockDebugFieldFact {
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

function styleTokenRefs(style: UiStyleRef | undefined): readonly string[] {
  return sortedUniqueStrings([
    style?.fg?.token,
    style?.bg?.token,
    style?.border?.token,
  ].filter((token): token is string => token != null));
}

function surfaceRows(surface: Surface): readonly string[] {
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

function sortedUniqueStrings(values: readonly string[]): readonly string[] {
  return [...new Set(values)].sort(compareCodeUnits);
}

function compareCodeUnits(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
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
  if (
    trimmed.startsWith('/')
    || trimmed.startsWith('\\\\')
    || trimmed.startsWith('//')
    || /^[A-Za-z]:[\\/]/.test(trimmed)
    || trimmed.includes('\0')
  ) {
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
