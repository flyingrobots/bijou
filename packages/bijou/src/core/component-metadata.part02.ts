import type { OutputMode } from './detect/tty.js';

import { EMPTY_LABEL } from './component-metadata.part01.js';

import type { ComponentMetadata, ComponentMetadataArg, ComponentMetadataInvariant, ComponentMetadataIssue, ComponentMetadataReport, ComponentMetadataVariant } from './component-metadata.part01.js';

import { at, joinLabels, pushDuplicateIssues, pushRequiredTextIssue } from './component-metadata.part03.js';
export function componentMetadataSummary(metadata: ComponentMetadata): string {
  return [
    `component metadata: ${metadata.packageName}/${metadata.componentName}`,
    `family=${metadata.family}`,
    `modes=${joinLabels(metadata.modes)}`,
    `args=${joinLabels((metadata.args ?? []).map((arg) => arg.name))}`,
    `variants=${joinLabels((metadata.variants ?? []).map((variant) => variant.id))}`,
    `invariants=${joinLabels((metadata.invariants ?? []).map((invariant) => invariant.id))}`,
    `examples=${joinLabels((metadata.examples ?? []).map((example) => example.id))}`,
    `source=${metadata.sourcePath ?? EMPTY_LABEL}`,
  ].join('\n');
}
export function componentMetadataReportText(report: ComponentMetadataReport): string {
  const status = report.passed ? 'passed' : 'failed';
  const component = report.componentName.trim() === '' ? EMPTY_LABEL : report.componentName.trim();
  const lines = [`component metadata: ${status} component=${component}`];

  if (report.issues.length === 0) {
    return lines.join('\n');
  }

  lines.push('issues:');
  for (const issue of report.issues) {
    lines.push(`- ${issue.severity} ${issue.kind} path=${issue.path}: ${issue.message}`);
  }

  return lines.join('\n');
}
export function pushModesIssues(
  issues: ComponentMetadataIssue[],
  modes: readonly OutputMode[],
): void {
  if (modes.length === 0) {
    issues.push({
      kind: 'empty-list',
      severity: 'error',
      path: 'modes',
      message: 'modes must include at least one output mode',
    });
    return;
  }

  pushDuplicateIssues(issues, modes, {
    label: 'mode',
    pathPrefix: 'modes',
    valuePath: '',
  });
}
export function pushArgsIssues(
  issues: ComponentMetadataIssue[],
  args: readonly ComponentMetadataArg[],
): void {
  args.forEach((arg, index) => {
    pushRequiredTextIssue(issues, at('args', index, 'name'), arg.name);
    pushRequiredTextIssue(issues, at('args', index, 'type'), arg.type);
  });
  pushDuplicateIssues(issues, args.map((arg) => arg.name), {
    label: 'arg name',
    pathPrefix: 'args',
    valuePath: 'name',
  });
}
export function pushVariantIssues(
  issues: ComponentMetadataIssue[],
  variants: readonly ComponentMetadataVariant[],
): void {
  variants.forEach((variant, index) => {
    pushRequiredTextIssue(issues, at('variants', index, 'id'), variant.id);
    pushRequiredTextIssue(issues, at('variants', index, 'label'), variant.label);
  });
  pushDuplicateIssues(issues, variants.map((variant) => variant.id), {
    label: 'variant id',
    pathPrefix: 'variants',
    valuePath: 'id',
  });
}
export function pushInvariantIssues(
  issues: ComponentMetadataIssue[],
  invariants: readonly ComponentMetadataInvariant[],
): void {
  invariants.forEach((invariant, index) => {
    pushRequiredTextIssue(issues, at('invariants', index, 'id'), invariant.id);
    pushRequiredTextIssue(issues, at('invariants', index, 'description'), invariant.description);
  });
  pushDuplicateIssues(issues, invariants.map((invariant) => invariant.id), {
    label: 'invariant id',
    pathPrefix: 'invariants',
    valuePath: 'id',
  });
}
