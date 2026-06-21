import type { BlockConfigOption, BlockExample } from './block-metadata.part01.js';

import { CONFIG_OPTION_KINDS } from './block-metadata.part02.js';

import type { BlockMetadataIssue } from './block-metadata.part02.js';

import { at, pushDuplicateStringIssues, pushRequiredTextIssue } from './block-metadata.part07.js';
export function pushConfigOptionIssues(
  issues: BlockMetadataIssue[],
  options: readonly BlockConfigOption[],
): void {
  options.forEach((option, index) => {
    const path = at('configOptions', index);
    pushRequiredTextIssue(issues, `${path}.id`, option.id);
    if (!CONFIG_OPTION_KINDS.includes(option.kind)) {
      issues.push({
        kind: 'invalid-value',
        severity: 'error',
        path: `${path}.kind`,
        message: `unsupported config option kind ${option.kind}`,
      });
    }
    if (option.kind === 'enum' && (option.values ?? []).length === 0) {
      issues.push({
        kind: 'empty-list',
        severity: 'error',
        path: `${path}.values`,
        message: 'enum config options must include values',
      });
    }
    pushDuplicateStringIssues(issues, option.values ?? [], {
      label: 'config enum value',
      pathPrefix: `${path}.values`,
    });
  });
  pushDuplicateStringIssues(issues, options.map((option) => option.id), {
    label: 'config option id',
    pathPrefix: 'configOptions',
    valuePath: 'id',
  });
}
export function pushExampleIssues(
  issues: BlockMetadataIssue[],
  examples: readonly BlockExample[],
): void {
  examples.forEach((example, index) => {
    pushRequiredTextIssue(issues, at('examples', index, 'id'), example.id);
    pushRequiredTextIssue(issues, at('examples', index, 'label'), example.label);
  });
  pushDuplicateStringIssues(issues, examples.map((example) => example.id), {
    label: 'example id',
    pathPrefix: 'examples',
    valuePath: 'id',
  });
}
export function pushSlotReferenceIssues(
  issues: BlockMetadataIssue[],
  pathPrefix: string,
  references: readonly string[],
  slotIds: ReadonlySet<string>,
): void {
  references.forEach((reference, index) => {
    const normalized = reference.trim();
    if (normalized === '') {
      const path = at(pathPrefix, index);
      issues.push({
        kind: 'missing-required-field',
        severity: 'error',
        path,
        message: `${path} is required`,
      });
      return;
    }

    if (!slotIds.has(normalized)) {
      issues.push({
        kind: 'unknown-reference',
        severity: 'error',
        path: at(pathPrefix, index),
        message: `unknown slot reference ${normalized}`,
      });
    }
  });
  pushDuplicateStringIssues(issues, references, {
    label: 'slot reference',
    pathPrefix,
  });
}
export interface DuplicateIssueOptions {
  readonly label: string;
  readonly pathPrefix: string;
  readonly valuePath?: string;
}
