import type { OutputMode } from './detect/tty.js';

import { isCommandIntent, isViewDataContract } from './binding.js';

import { BLOCK_DEFINITION_BRAND } from './block-metadata.part01.js';

import type { BlockConfigOptionKind, BlockDefinition, BlockDefinitionInput, BlockScale } from './block-metadata.part01.js';

import { brand, validateBlockMetadata } from './block-metadata.part03.js';

import type { BlockDefinitionBrandCarrier } from './block-metadata.part03.js';

import { blockMetadataReportText } from './block-metadata.part04.js';
export interface BlockPackageManifest {
  readonly packageName: string;
  readonly version: string;
  readonly bijouPeerRange: string;
  readonly blocks: readonly string[];
  readonly docs?: readonly string[];
  readonly tags?: readonly string[];
}
export type BlockMetadataIssueKind =
  | 'missing-required-field'
  | 'empty-list'
  | 'duplicate-id'
  | 'unknown-reference'
  | 'invalid-value';
export type BlockMetadataSeverity = 'error' | 'warning';
export interface BlockMetadataIssue {
  readonly kind: BlockMetadataIssueKind;
  readonly severity: BlockMetadataSeverity;
  readonly path: string;
  readonly message: string;
}
export interface BlockMetadataReport {
  readonly packageName: string;
  readonly blockName: string;
  readonly issues: readonly BlockMetadataIssue[];
  readonly passed: boolean;
}
export interface BlockPackageManifestReport {
  readonly packageName: string;
  readonly issues: readonly BlockMetadataIssue[];
  readonly passed: boolean;
}
export const CONFIG_OPTION_KINDS: readonly BlockConfigOptionKind[] = [
  'boolean',
  'enum',
  'number',
  'string',
  'adapter',
];
export const BLOCK_SCALES: readonly BlockScale[] = [
  'app',
  'section',
  'panel',
  'control',
  'inline',
  'item',
  'data',
  'diagnostic',
  'overlay',
  'workspace',
];
export const OUTPUT_MODES: readonly OutputMode[] = [
  'interactive',
  'static',
  'pipe',
  'accessible',
];
export const LIST_SEPARATOR = ',';
export const EMPTY_LABEL = '-';
export function defineBlock<Config = unknown, Output = unknown>(
  definition: BlockDefinitionInput<Config, Output>,
): BlockDefinition<Config, Output> {
  const report = validateBlockMetadata(definition.metadata);
  const hasError = report.issues.some((issue) => issue.severity === 'error');
  if (hasError) {
    throw new Error(blockMetadataReportText(report));
  }

  if (definition.data !== undefined && !isViewDataContract(definition.data)) {
    throw new Error('block definition: data must be created by defineViewData()');
  }

  const commands = definition.commands ?? [];
  commands.forEach((command, index) => {
    if (!isCommandIntent(command)) {
      throw new Error(`block definition: command at index ${String(index)} must be created by commandIntent()`);
    }
  });

  const block = {
    ...definition,
    ...(definition.commands === undefined ? {} : { commands: Object.freeze([...commands]) }),
  };

  brand(block);
  return Object.freeze(block);
}
export function isBlockDefinition(value: unknown): value is BlockDefinition {
  return Boolean(
    value
      && typeof value === 'object'
      && (value as BlockDefinitionBrandCarrier)[BLOCK_DEFINITION_BRAND] === true,
  );
}
