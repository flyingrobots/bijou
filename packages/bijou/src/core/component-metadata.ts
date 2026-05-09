import type { OutputMode } from './detect/tty.js';
import type { ModeLoweringFact } from './mode-lowering.js';

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

const LIST_SEPARATOR = ',';
const EMPTY_LABEL = '-';

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

function pushModesIssues(
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

function pushArgsIssues(
  issues: ComponentMetadataIssue[],
  args: readonly ComponentMetadataArg[],
): void {
  args.forEach((arg, index) => {
    pushRequiredTextIssue(issues, `args[${index}].name`, arg.name);
    pushRequiredTextIssue(issues, `args[${index}].type`, arg.type);
  });
  pushDuplicateIssues(issues, args.map((arg) => arg.name), {
    label: 'arg name',
    pathPrefix: 'args',
    valuePath: 'name',
  });
}

function pushVariantIssues(
  issues: ComponentMetadataIssue[],
  variants: readonly ComponentMetadataVariant[],
): void {
  variants.forEach((variant, index) => {
    pushRequiredTextIssue(issues, `variants[${index}].id`, variant.id);
    pushRequiredTextIssue(issues, `variants[${index}].label`, variant.label);
  });
  pushDuplicateIssues(issues, variants.map((variant) => variant.id), {
    label: 'variant id',
    pathPrefix: 'variants',
    valuePath: 'id',
  });
}

function pushInvariantIssues(
  issues: ComponentMetadataIssue[],
  invariants: readonly ComponentMetadataInvariant[],
): void {
  invariants.forEach((invariant, index) => {
    pushRequiredTextIssue(issues, `invariants[${index}].id`, invariant.id);
    pushRequiredTextIssue(issues, `invariants[${index}].description`, invariant.description);
  });
  pushDuplicateIssues(issues, invariants.map((invariant) => invariant.id), {
    label: 'invariant id',
    pathPrefix: 'invariants',
    valuePath: 'id',
  });
}

function pushExampleIssues(
  issues: ComponentMetadataIssue[],
  examples: readonly ComponentMetadataExample[],
): void {
  examples.forEach((example, index) => {
    pushRequiredTextIssue(issues, `examples[${index}].id`, example.id);
    pushRequiredTextIssue(issues, `examples[${index}].label`, example.label);
  });
  pushDuplicateIssues(issues, examples.map((example) => example.id), {
    label: 'example id',
    pathPrefix: 'examples',
    valuePath: 'id',
  });
}

interface DuplicateIssueOptions {
  readonly label: string;
  readonly pathPrefix: string;
  readonly valuePath: string;
}

function pushDuplicateIssues(
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
      path: indexedPath(options.pathPrefix, index, options.valuePath),
      message: `duplicate ${options.label} ${normalized}`,
    });
  });
}

function pushRequiredTextIssue(
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

function indexedPath(pathPrefix: string, index: number, valuePath: string): string {
  if (valuePath === '') {
    return `${pathPrefix}[${index}]`;
  }

  return `${pathPrefix}[${index}].${valuePath}`;
}

function joinLabels(values: readonly string[]): string {
  return values.length === 0 ? EMPTY_LABEL : values.join(LIST_SEPARATOR);
}
