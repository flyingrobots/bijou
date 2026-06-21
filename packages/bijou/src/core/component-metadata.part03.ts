import { EMPTY_LABEL, LIST_SEPARATOR } from './component-metadata.part01.js';

import type { ComponentMetadataExample, ComponentMetadataIssue } from './component-metadata.part01.js';
export function pushExampleIssues(
  issues: ComponentMetadataIssue[],
  examples: readonly ComponentMetadataExample[],
): void {
  examples.forEach((example, index) => {
    pushRequiredTextIssue(issues, at('examples', index, 'id'), example.id);
    pushRequiredTextIssue(issues, at('examples', index, 'label'), example.label);
  });
  pushDuplicateIssues(issues, examples.map((example) => example.id), {
    label: 'example id',
    pathPrefix: 'examples',
    valuePath: 'id',
  });
}
export interface DuplicateIssueOptions {
  readonly label: string;
  readonly pathPrefix: string;
  readonly valuePath: string;
}
export function pushDuplicateIssues(
  issues: ComponentMetadataIssue[],
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
      path: at(options.pathPrefix, index, options.valuePath),
      message: `duplicate ${options.label} ${normalized}`,
    });
  });
}
export function pushRequiredTextIssue(
  issues: ComponentMetadataIssue[],
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
export function at(prefix: string, index: number, suffix: string): string {
  const path = `${prefix}[${String(index)}]`;
  return suffix === '' ? path : `${path}.${suffix}`;
}
export function joinLabels(values: readonly string[]): string {
  return values.length === 0 ? EMPTY_LABEL : values.join(LIST_SEPARATOR);
}
