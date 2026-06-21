import type { ModeLoweringFact } from './mode-lowering.js';

import { EMPTY_LABEL, LIST_SEPARATOR } from './block-metadata.part02.js';

import type { BlockMetadataIssue } from './block-metadata.part02.js';

import type { DuplicateIssueOptions } from './block-metadata.part06.js';
export function pushDuplicateStringIssues(
  issues: BlockMetadataIssue[],
  values: readonly string[],
  options: DuplicateIssueOptions,
): void {
  const seenValues = new Set<string>();
  const reportedValues = new Set<string>();
  values.forEach((value, index) => {
    const normalized = value.trim();
    if (normalized === '') {
      return;
    }

    if (!seenValues.has(normalized)) {
      seenValues.add(normalized);
      return;
    }

    if (reportedValues.has(normalized)) {
      return;
    }

    reportedValues.add(normalized);
    issues.push({
      kind: 'duplicate-id',
      severity: 'error',
      path: at(options.pathPrefix, index, options.valuePath ?? ''),
      message: `duplicate ${options.label} ${normalized}`,
    });
  });
}
export function pushRequiredTextIssue(
  issues: BlockMetadataIssue[],
  path: string,
  value: string,
): void {
  if (value.trim() !== '') {
    return;
  }

  issues.push({
    kind: 'missing-required-field',
    severity: 'error',
    path,
    message: `${path} is required`,
  });
}
export function factLabel(fact: ModeLoweringFact): string {
  return fact.value === undefined
    ? `${fact.kind}:${fact.key}`
    : `${fact.kind}:${fact.key}=${String(fact.value)}`;
}
export function at(prefix: string, index: number, suffix = ''): string {
  const path = `${prefix}[${String(index)}]`;
  return suffix === '' ? path : `${path}.${suffix}`;
}
export function joinLabels(values: readonly string[]): string {
  return values.length === 0 ? EMPTY_LABEL : values.join(LIST_SEPARATOR);
}
