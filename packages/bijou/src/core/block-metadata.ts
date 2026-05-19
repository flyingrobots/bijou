import type { OutputMode } from './detect/tty.js';
import type { ModeLoweringFact } from './mode-lowering.js';
import {
  isCommandIntent,
  isViewDataContract,
  type CommandIntent,
  type ViewDataContract,
} from './binding.js';

export type BlockScale =
  | 'app'
  | 'section'
  | 'panel'
  | 'control'
  | 'item'
  | 'data'
  | 'diagnostic';

export type BlockConfigOptionKind =
  | 'boolean'
  | 'enum'
  | 'number'
  | 'string'
  | 'adapter';

export interface BlockMetadataDocs {
  readonly summary: string;
  readonly useWhen?: readonly string[];
  readonly avoidWhen?: readonly string[];
  readonly relatedDocs?: readonly string[];
}

export interface BlockSlot {
  readonly id: string;
  readonly label?: string;
  readonly required?: boolean;
  readonly description?: string;
}

export interface BlockVariantMetadata {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly requiredSlots?: readonly string[];
  readonly optionalSlots?: readonly string[];
  readonly facts?: readonly ModeLoweringFact[];
}

export interface BlockConfigOption {
  readonly id: string;
  readonly label?: string;
  readonly kind: BlockConfigOptionKind;
  readonly required?: boolean;
  readonly description?: string;
  readonly values?: readonly string[];
}

export interface BlockExample {
  readonly id: string;
  readonly label: string;
  readonly path?: string;
  readonly command?: string;
}

export interface BlockMetadata {
  readonly packageName: string;
  readonly blockName: string;
  readonly family: string;
  readonly scale: BlockScale;
  readonly modes: readonly OutputMode[];
  readonly docs: BlockMetadataDocs;
  readonly sourcePath?: string;
  readonly slots: readonly BlockSlot[];
  readonly variants?: readonly BlockVariantMetadata[];
  readonly configOptions?: readonly BlockConfigOption[];
  readonly composedComponents?: readonly string[];
  readonly semanticFacts?: readonly ModeLoweringFact[];
  readonly storyIds?: readonly string[];
  readonly examples?: readonly BlockExample[];
  readonly tags?: readonly string[];
}

export interface BlockRenderInput<Config = unknown> {
  readonly config?: Config;
  readonly slots?: Readonly<Record<string, unknown>>;
  readonly mode?: OutputMode;
}

export interface BlockRenderResult<Output = unknown> {
  readonly output: Output;
  readonly facts?: readonly ModeLoweringFact[];
}

export interface BlockDefinition<Config = unknown, Output = unknown> {
  readonly metadata: BlockMetadata;
  readonly data?: ViewDataContract;
  readonly commands?: readonly CommandIntent[];
  readonly render: (input: BlockRenderInput<Config>) => BlockRenderResult<Output>;
}

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

const CONFIG_OPTION_KINDS: readonly BlockConfigOptionKind[] = [
  'boolean',
  'enum',
  'number',
  'string',
  'adapter',
];
const BLOCK_SCALES: readonly BlockScale[] = [
  'app',
  'section',
  'panel',
  'control',
  'item',
  'data',
  'diagnostic',
];
const OUTPUT_MODES: readonly OutputMode[] = [
  'interactive',
  'static',
  'pipe',
  'accessible',
];
const LIST_SEPARATOR = ',';
const EMPTY_LABEL = '-';

export function defineBlock<Config = unknown, Output = unknown>(
  definition: BlockDefinition<Config, Output>,
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
      throw new Error(`block definition: command at index ${index} must be created by commandIntent()`);
    }
  });

  return Object.freeze({
    ...definition,
    ...(definition.commands === undefined ? {} : { commands: Object.freeze([...commands]) }),
  });
}

export function defineBlockPackage(manifest: BlockPackageManifest): BlockPackageManifest {
  const report = validateBlockPackageManifest(manifest);
  const hasError = report.issues.some((issue) => issue.severity === 'error');
  if (hasError) {
    throw new Error(blockPackageManifestReportText(report));
  }

  return manifest;
}

export function validateBlockMetadata(metadata: BlockMetadata): BlockMetadataReport {
  const issues: BlockMetadataIssue[] = [];
  const slots = metadata.slots ?? [];
  const variants = metadata.variants ?? [];
  const configOptions = metadata.configOptions ?? [];
  const examples = metadata.examples ?? [];

  pushRequiredTextIssue(issues, 'packageName', metadata.packageName);
  pushRequiredTextIssue(issues, 'blockName', metadata.blockName);
  pushRequiredTextIssue(issues, 'family', metadata.family);
  pushRequiredTextIssue(issues, 'docs.summary', metadata.docs?.summary ?? '');
  pushScaleIssue(issues, metadata.scale);
  pushModesIssues(issues, metadata.modes ?? []);
  pushSlotsIssues(issues, slots);
  pushVariantIssues(issues, variants, slots);
  pushConfigOptionIssues(issues, configOptions);
  pushExampleIssues(issues, examples);
  pushDuplicateStringIssues(issues, metadata.composedComponents ?? [], {
    label: 'composed component',
    pathPrefix: 'composedComponents',
  });
  pushDuplicateStringIssues(issues, metadata.storyIds ?? [], {
    label: 'story id',
    pathPrefix: 'storyIds',
  });
  pushDuplicateStringIssues(issues, metadata.tags ?? [], {
    label: 'tag',
    pathPrefix: 'tags',
  });

  return {
    packageName: metadata.packageName,
    blockName: metadata.blockName,
    issues,
    passed: issues.length === 0,
  };
}

export function validateBlockPackageManifest(
  manifest: BlockPackageManifest,
): BlockPackageManifestReport {
  const issues: BlockMetadataIssue[] = [];

  pushRequiredTextIssue(issues, 'packageName', manifest.packageName);
  pushRequiredTextIssue(issues, 'version', manifest.version);
  pushRequiredTextIssue(issues, 'bijouPeerRange', manifest.bijouPeerRange);
  if (manifest.blocks.length === 0) {
    issues.push({
      kind: 'empty-list',
      severity: 'error',
      path: 'blocks',
      message: 'blocks must include at least one block id',
    });
  }
  pushDuplicateStringIssues(issues, manifest.blocks, {
    label: 'block id',
    pathPrefix: 'blocks',
  });
  pushDuplicateStringIssues(issues, manifest.docs ?? [], {
    label: 'doc path',
    pathPrefix: 'docs',
  });
  pushDuplicateStringIssues(issues, manifest.tags ?? [], {
    label: 'tag',
    pathPrefix: 'tags',
  });

  return {
    packageName: manifest.packageName,
    issues,
    passed: issues.length === 0,
  };
}

export function blockMetadataSummary(metadata: BlockMetadata): string {
  return [
    `block metadata: ${metadata.packageName}/${metadata.blockName}`,
    `family=${metadata.family}`,
    `scale=${metadata.scale}`,
    `modes=${joinLabels(metadata.modes)}`,
    `slots=${joinLabels(metadata.slots.map((slot) => slot.id))}`,
    `requiredSlots=${joinLabels(metadata.slots.filter((slot) => slot.required !== false).map((slot) => slot.id))}`,
    `variants=${joinLabels((metadata.variants ?? []).map((variant) => variant.id))}`,
    `config=${joinLabels((metadata.configOptions ?? []).map((option) => option.id))}`,
    `components=${joinLabels(metadata.composedComponents ?? [])}`,
    `facts=${joinLabels((metadata.semanticFacts ?? []).map(factLabel))}`,
    `stories=${joinLabels(metadata.storyIds ?? [])}`,
    `source=${metadata.sourcePath ?? EMPTY_LABEL}`,
  ].join('\n');
}

export function blockPackageManifestSummary(manifest: BlockPackageManifest): string {
  return [
    `block package: ${manifest.packageName}@${manifest.version}`,
    `bijouPeerRange=${manifest.bijouPeerRange}`,
    `blocks=${joinLabels(manifest.blocks)}`,
    `docs=${joinLabels(manifest.docs ?? [])}`,
    `tags=${joinLabels(manifest.tags ?? [])}`,
  ].join('\n');
}

export function blockMetadataReportText(report: BlockMetadataReport): string {
  const status = report.passed ? 'passed' : 'failed';
  const block = report.blockName.trim() === '' ? EMPTY_LABEL : report.blockName.trim();
  const lines = [`block metadata: ${status} block=${block}`];

  if (report.issues.length === 0) {
    return lines.join('\n');
  }

  lines.push('issues:');
  for (const issue of report.issues) {
    lines.push(`- ${issue.severity} ${issue.kind} path=${issue.path}: ${issue.message}`);
  }

  return lines.join('\n');
}

export function blockPackageManifestReportText(report: BlockPackageManifestReport): string {
  const status = report.passed ? 'passed' : 'failed';
  const packageName = report.packageName.trim() === '' ? EMPTY_LABEL : report.packageName.trim();
  const lines = [`block package manifest: ${status} package=${packageName}`];

  if (report.issues.length === 0) {
    return lines.join('\n');
  }

  lines.push('issues:');
  for (const issue of report.issues) {
    lines.push(`- ${issue.severity} ${issue.kind} path=${issue.path}: ${issue.message}`);
  }

  return lines.join('\n');
}

function pushScaleIssue(issues: BlockMetadataIssue[], scale: BlockScale): void {
  if (typeof scale !== 'string' || scale.trim() === '') {
    issues.push({
      kind: 'missing-required-field',
      severity: 'error',
      path: 'scale',
      message: 'scale is required',
    });
    return;
  }

  if (!BLOCK_SCALES.includes(scale)) {
    issues.push({
      kind: 'invalid-value',
      severity: 'error',
      path: 'scale',
      message: `unsupported block scale ${String(scale)}`,
    });
  }
}

function pushModesIssues(
  issues: BlockMetadataIssue[],
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

  modes.forEach((mode, index) => {
    if (OUTPUT_MODES.includes(mode)) {
      return;
    }

    issues.push({
      kind: 'invalid-value',
      severity: 'error',
      path: `modes[${index}]`,
      message: `unsupported output mode ${String(mode)}`,
    });
  });
  pushDuplicateStringIssues(issues, modes, {
    label: 'mode',
    pathPrefix: 'modes',
  });
}

function pushSlotsIssues(
  issues: BlockMetadataIssue[],
  slots: readonly BlockSlot[],
): void {
  if (slots.length === 0) {
    issues.push({
      kind: 'empty-list',
      severity: 'error',
      path: 'slots',
      message: 'slots must include at least one slot',
    });
    return;
  }

  slots.forEach((slot, index) => {
    pushRequiredTextIssue(issues, `slots[${index}].id`, slot.id);
  });
  pushDuplicateStringIssues(issues, slots.map((slot) => slot.id), {
    label: 'slot id',
    pathPrefix: 'slots',
    valuePath: 'id',
  });
}

function pushVariantIssues(
  issues: BlockMetadataIssue[],
  variants: readonly BlockVariantMetadata[],
  slots: readonly BlockSlot[],
): void {
  const slotIds = new Set(slots.map((slot) => slot.id).filter((id) => id.trim() !== ''));
  variants.forEach((variant, index) => {
    pushRequiredTextIssue(issues, `variants[${index}].id`, variant.id);
    pushRequiredTextIssue(issues, `variants[${index}].label`, variant.label);
    pushSlotReferenceIssues(issues, `variants[${index}].requiredSlots`, variant.requiredSlots ?? [], slotIds);
    pushSlotReferenceIssues(issues, `variants[${index}].optionalSlots`, variant.optionalSlots ?? [], slotIds);
  });
  pushDuplicateStringIssues(issues, variants.map((variant) => variant.id), {
    label: 'variant id',
    pathPrefix: 'variants',
    valuePath: 'id',
  });
}

function pushConfigOptionIssues(
  issues: BlockMetadataIssue[],
  options: readonly BlockConfigOption[],
): void {
  options.forEach((option, index) => {
    pushRequiredTextIssue(issues, `configOptions[${index}].id`, option.id);
    if (!CONFIG_OPTION_KINDS.includes(option.kind)) {
      issues.push({
        kind: 'invalid-value',
        severity: 'error',
        path: `configOptions[${index}].kind`,
        message: `unsupported config option kind ${String(option.kind)}`,
      });
    }
    if (option.kind === 'enum' && (option.values ?? []).length === 0) {
      issues.push({
        kind: 'empty-list',
        severity: 'error',
        path: `configOptions[${index}].values`,
        message: 'enum config options must include values',
      });
    }
    pushDuplicateStringIssues(issues, option.values ?? [], {
      label: 'config enum value',
      pathPrefix: `configOptions[${index}].values`,
    });
  });
  pushDuplicateStringIssues(issues, options.map((option) => option.id), {
    label: 'config option id',
    pathPrefix: 'configOptions',
    valuePath: 'id',
  });
}

function pushExampleIssues(
  issues: BlockMetadataIssue[],
  examples: readonly BlockExample[],
): void {
  examples.forEach((example, index) => {
    pushRequiredTextIssue(issues, `examples[${index}].id`, example.id);
    pushRequiredTextIssue(issues, `examples[${index}].label`, example.label);
  });
  pushDuplicateStringIssues(issues, examples.map((example) => example.id), {
    label: 'example id',
    pathPrefix: 'examples',
    valuePath: 'id',
  });
}

function pushSlotReferenceIssues(
  issues: BlockMetadataIssue[],
  pathPrefix: string,
  references: readonly string[],
  slotIds: ReadonlySet<string>,
): void {
  references.forEach((reference, index) => {
    const normalized = reference.trim();
    if (normalized === '') {
      issues.push({
        kind: 'missing-required-field',
        severity: 'error',
        path: `${pathPrefix}[${index}]`,
        message: `${pathPrefix}[${index}] is required`,
      });
      return;
    }

    if (!slotIds.has(normalized)) {
      issues.push({
        kind: 'unknown-reference',
        severity: 'error',
        path: `${pathPrefix}[${index}]`,
        message: `unknown slot reference ${normalized}`,
      });
    }
  });
  pushDuplicateStringIssues(issues, references, {
    label: 'slot reference',
    pathPrefix,
  });
}

interface DuplicateIssueOptions {
  readonly label: string;
  readonly pathPrefix: string;
  readonly valuePath?: string;
}

function pushDuplicateStringIssues(
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
      path: indexedPath(options.pathPrefix, index, options.valuePath ?? ''),
      message: `duplicate ${options.label} ${normalized}`,
    });
  });
}

function pushRequiredTextIssue(
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

function factLabel(fact: ModeLoweringFact): string {
  return fact.value === undefined
    ? `${fact.kind}:${fact.key}`
    : `${fact.kind}:${fact.key}=${String(fact.value)}`;
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
