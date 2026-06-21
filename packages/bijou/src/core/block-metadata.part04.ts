import type { BlockMetadata, BlockScale } from './block-metadata.part01.js';

import { BLOCK_SCALES, EMPTY_LABEL } from './block-metadata.part02.js';

import type { BlockMetadataIssue, BlockMetadataReport, BlockPackageManifest, BlockPackageManifestReport } from './block-metadata.part02.js';

import { factLabel, joinLabels } from './block-metadata.part07.js';
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
export function pushScaleIssue(issues: BlockMetadataIssue[], scale: BlockScale): void {
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
      message: `unsupported block scale ${scale}`,
    });
  }
}
