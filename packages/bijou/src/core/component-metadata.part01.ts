import type { OutputMode } from './detect/tty.js';

import type { ModeLoweringFact } from './mode-lowering.js';

import { componentMetadataReportText, pushArgsIssues, pushInvariantIssues, pushModesIssues, pushVariantIssues } from './component-metadata.part02.js';

import { pushExampleIssues, pushRequiredTextIssue } from './component-metadata.part03.js';
export interface ComponentMetadataDocs {
  readonly summary: string;
  readonly useWhen?: readonly string[];
  readonly avoidWhen?: readonly string[];
  readonly relatedDocs?: readonly string[];
}
export interface ComponentMetadataArg {
  readonly name: string;
  readonly type: string;
  readonly required?: boolean;
  readonly description?: string;
}
export interface ComponentMetadataVariant {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly facts?: readonly ModeLoweringFact[];
}
export interface ComponentMetadataInvariant {
  readonly id: string;
  readonly description: string;
  readonly facts?: readonly ModeLoweringFact[];
}
export interface ComponentMetadataExample {
  readonly id: string;
  readonly label: string;
  readonly path?: string;
  readonly command?: string;
}
export interface ComponentMetadata {
  readonly packageName: string;
  readonly componentName: string;
  readonly family: string;
  readonly modes: readonly OutputMode[];
  readonly docs: ComponentMetadataDocs;
  readonly sourcePath?: string;
  readonly args?: readonly ComponentMetadataArg[];
  readonly variants?: readonly ComponentMetadataVariant[];
  readonly invariants?: readonly ComponentMetadataInvariant[];
  readonly examples?: readonly ComponentMetadataExample[];
  readonly tags?: readonly string[];
}
export type ComponentMetadataIssueKind =
  | 'missing-required-field'
  | 'empty-list'
  | 'duplicate-id';
export type ComponentMetadataSeverity = 'error' | 'warning';
export interface ComponentMetadataIssue {
  readonly kind: ComponentMetadataIssueKind;
  readonly severity: ComponentMetadataSeverity;
  readonly path: string;
  readonly message: string;
}
export interface ComponentMetadataReport {
  readonly packageName: string;
  readonly componentName: string;
  readonly issues: readonly ComponentMetadataIssue[];
  readonly passed: boolean;
}
export const LIST_SEPARATOR = ',';
export const EMPTY_LABEL = '-';
export function defineComponentMetadata(metadata: ComponentMetadata): ComponentMetadata {
  const report = validateComponentMetadata(metadata);
  const hasError = report.issues.some((issue) => issue.severity === 'error');
  if (hasError) {
    throw new Error(componentMetadataReportText(report));
  }

  return metadata;
}
export function validateComponentMetadata(metadata: ComponentMetadata): ComponentMetadataReport {
  const issues: ComponentMetadataIssue[] = [];

  pushRequiredTextIssue(issues, 'packageName', metadata.packageName);
  pushRequiredTextIssue(issues, 'componentName', metadata.componentName);
  pushRequiredTextIssue(issues, 'family', metadata.family);
  pushRequiredTextIssue(issues, 'docs.summary', metadata.docs.summary);
  pushModesIssues(issues, metadata.modes);
  pushArgsIssues(issues, metadata.args ?? []);
  pushVariantIssues(issues, metadata.variants ?? []);
  pushInvariantIssues(issues, metadata.invariants ?? []);
  pushExampleIssues(issues, metadata.examples ?? []);

  return {
    packageName: metadata.packageName,
    componentName: metadata.componentName,
    issues,
    passed: issues.length === 0,
  };
}
