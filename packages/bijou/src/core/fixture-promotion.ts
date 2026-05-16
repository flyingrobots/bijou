import type { ComponentMetadata } from './component-metadata.js';
import type { StoryCaptureMatrix } from './story-capture.js';

export type FixturePromotionArtifactKind =
  | 'fixture'
  | 'docs'
  | 'story'
  | 'example'
  | 'mcp';

export interface FixturePromotionArtifact {
  readonly kind: FixturePromotionArtifactKind;
  readonly path: string;
  readonly label?: string;
}

export interface FixturePromotionRecordOptions {
  readonly id: string;
  readonly from: FixturePromotionArtifact;
  readonly to: FixturePromotionArtifact;
  readonly metadata?: ComponentMetadata;
  readonly matrix?: StoryCaptureMatrix;
  readonly tags?: readonly string[];
  readonly notes?: readonly string[];
}

export interface ReverseFixturePromotionOptions {
  readonly id?: string;
}

export interface FixturePromotionRecord {
  readonly id: string;
  readonly from: FixturePromotionArtifact;
  readonly to: FixturePromotionArtifact;
  readonly metadata?: ComponentMetadata;
  readonly matrix?: StoryCaptureMatrix;
  readonly tags: readonly string[];
  readonly notes: readonly string[];
}

const LIST_SEPARATOR = ',';
const EMPTY_LABEL = '-';

export function createFixturePromotionRecord(
  options: FixturePromotionRecordOptions,
): FixturePromotionRecord {
  return {
    id: options.id,
    from: options.from,
    to: options.to,
    metadata: options.metadata,
    matrix: options.matrix,
    tags: normalizeTags(options.tags ?? []),
    notes: options.notes ?? [],
  };
}

export function reverseFixturePromotionRecord(
  record: FixturePromotionRecord,
  options: ReverseFixturePromotionOptions = {},
): FixturePromotionRecord {
  return {
    id: options.id ?? `${record.id}:reversed`,
    from: record.to,
    to: record.from,
    metadata: record.metadata,
    matrix: record.matrix,
    tags: record.tags,
    notes: record.notes,
  };
}

export function fixturePromotionText(record: FixturePromotionRecord): string {
  const lines = [
    `fixture promotion: ${record.id}`,
    `from=${artifactText(record.from)}`,
    `to=${artifactText(record.to)}`,
    `component=${componentText(record.metadata)}`,
    `matrix=${record.matrix?.storyId ?? EMPTY_LABEL}`,
    `tags=${joinLabels(record.tags)}`,
  ];

  if (record.notes.length === 0) {
    return lines.join('\n');
  }

  lines.push('notes:');
  for (const note of record.notes) {
    lines.push(`- ${note}`);
  }

  return lines.join('\n');
}

function artifactText(artifact: FixturePromotionArtifact): string {
  const label = artifact.label === undefined ? '' : ` (${artifact.label})`;
  return `${artifact.kind} ${artifact.path}${label}`;
}

function componentText(metadata: ComponentMetadata | undefined): string {
  if (metadata === undefined) {
    return EMPTY_LABEL;
  }

  return `${metadata.packageName}/${metadata.componentName}`;
}

function normalizeTags(tags: readonly string[]): readonly string[] {
  const normalizedTags = tags
    .map((tag) => tag.trim())
    .filter((tag) => tag !== '');
  return [...new Set(normalizedTags)].sort();
}

function joinLabels(values: readonly string[]): string {
  return values.length === 0 ? EMPTY_LABEL : values.join(LIST_SEPARATOR);
}
