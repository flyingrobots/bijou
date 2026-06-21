import { BLOCK_DEFINITION_BRAND } from './block-metadata.part01.js';

import type { BlockDefinition, BlockDefinitionInput, BlockMetadata } from './block-metadata.part01.js';

import type { BlockMetadataIssue, BlockMetadataReport, BlockPackageManifest, BlockPackageManifestReport } from './block-metadata.part02.js';

import { blockPackageManifestReportText, pushScaleIssue } from './block-metadata.part04.js';

import { pushModesIssues, pushSlotsIssues, pushVariantIssues } from './block-metadata.part05.js';

import { pushConfigOptionIssues, pushExampleIssues } from './block-metadata.part06.js';

import { pushDuplicateStringIssues, pushRequiredTextIssue } from './block-metadata.part07.js';
export function defineBlockPackage(manifest: BlockPackageManifest): BlockPackageManifest {
  const report = validateBlockPackageManifest(manifest);
  const hasError = report.issues.some((issue) => issue.severity === 'error');
  if (hasError) {
    throw new Error(blockPackageManifestReportText(report));
  }

  return manifest;
}
export interface BlockDefinitionBrandCarrier { readonly [BLOCK_DEFINITION_BRAND]?: true; }
export function brand<C, O>(b: BlockDefinitionInput<C, O> & BlockDefinitionBrandCarrier): asserts b is BlockDefinition<C, O> { Object.defineProperty(b, BLOCK_DEFINITION_BRAND, { value: true }); }
export function validateBlockMetadata(metadata: BlockMetadata): BlockMetadataReport {
  const issues: BlockMetadataIssue[] = [];
  const slots = metadata.slots;
  const variants = metadata.variants ?? [];
  const configOptions = metadata.configOptions ?? [];
  const examples = metadata.examples ?? [];

  pushRequiredTextIssue(issues, 'packageName', metadata.packageName);
  pushRequiredTextIssue(issues, 'blockName', metadata.blockName);
  pushRequiredTextIssue(issues, 'family', metadata.family);
  pushRequiredTextIssue(issues, 'docs.summary', metadata.docs.summary);
  pushScaleIssue(issues, metadata.scale);
  pushModesIssues(issues, metadata.modes);
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
