import { hashUiSceneValue } from './ui-scene-ir.js';

import type { UiSceneLowerMode } from './ui-scene-ir.js';

import { BIJOU_BLOCK_ARTIFACT_VERSION } from './graphql-bijou-block.part01.js';

import type { BijouBlockArtifact, CompileGraphqlBijouBlockOptions } from './graphql-bijou-block.part01.js';

import { parseConstrainedGraphqlBijouBlock } from './graphql-bijou-block.part05.js';

import { bijouBlockFieldFor, groupsFor } from './graphql-bijou-block.part06.js';

import { targetProfilesFor } from './graphql-bijou-block.part07.js';

import { assertUniqueBlockIdentities, directiveByName, optionalStringArg } from './graphql-bijou-block.part08.js';

import { normalizeSourceName } from './graphql-bijou-block.part10.js';
export interface ParsedField {
  readonly fieldName: string;
  readonly graphqlType: string;
  readonly directives: readonly ParsedDirective[];
}
export interface FieldDraft {
  readonly fieldName: string;
  readonly graphqlType: string;
  readonly directiveTexts: string[];
}
export interface ParsedDirective {
  readonly name: string;
  readonly args: Readonly<Record<string, DirectiveArgValue>>;
}
export type DirectiveArgValue = string | number;
export const DEFAULT_SOURCE_NAME = 'inline.graphql';
export const DEBUG_LOWER_MODES: readonly UiSceneLowerMode[] = ['normal', 'node-ids', 'i18n-keys', 'token-refs'];
export const IDENTIFIER_PATTERN = '[A-Za-z_][A-Za-z0-9_]*';
export const FIELD_PATTERN = new RegExp(`^(${IDENTIFIER_PATTERN})\\s*:\\s*([A-Za-z0-9_!\\[\\]]+)(.*)$`);
export const TYPE_PATTERN = new RegExp(`^type\\s+(${IDENTIFIER_PATTERN})\\b(.*)$`);
export const DIRECTIVE_PATTERN = new RegExp(`@(${IDENTIFIER_PATTERN})\\s*\\(((?:[^()"\\\\]|"(?:[^"\\\\]|\\\\.)*")*)\\)`, 'g');
export const ARG_PATTERN = new RegExp(`(${IDENTIFIER_PATTERN})\\s*:\\s*("(?:[^"\\\\]|\\\\.)*"|-?\\d+)`, 'g');
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
