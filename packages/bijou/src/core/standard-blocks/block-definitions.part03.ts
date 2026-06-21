import { defineBlock } from '../block-metadata.js';

import type { BlockDefinition } from '../block-metadata.js';

import { brandEmphasisMetadata, denseComparisonMetadata, explorationListMetadata, hierarchyMetadata, modeAwarePrimitiveMetadata, pathProgressMetadata, peerNavigationMetadata, progressiveDisclosureMetadata, temporalDependencyMetadata } from './metadata-standard.js';

import { brandEmphasisData, brandEmphasisSections, denseComparisonData, denseComparisonSections, explorationListData, explorationListSections, hierarchyData, hierarchySections, modeAwarePrimitiveData, modeAwarePrimitiveSections, pathProgressData, pathProgressSections, peerNavigationData, peerNavigationSections, progressiveDisclosureData, progressiveDisclosureSections, standardSectionCommands, temporalDependencyData, temporalDependencySections } from './sections.js';

import { renderStandardSectionBlock } from './render.js';
export const peerNavigationBlock: BlockDefinition = defineBlock({
  metadata: peerNavigationMetadata(),
  data: peerNavigationData,
  commands: standardSectionCommands('PeerNavigationBlock'),
  render: (input) => renderStandardSectionBlock(
    input,
    'PeerNavigationBlock',
    peerNavigationSections,
  ),
});
export const progressiveDisclosureBlock: BlockDefinition = defineBlock({
  metadata: progressiveDisclosureMetadata(),
  data: progressiveDisclosureData,
  commands: standardSectionCommands('ProgressiveDisclosureBlock'),
  render: (input) => renderStandardSectionBlock(
    input,
    'ProgressiveDisclosureBlock',
    progressiveDisclosureSections,
  ),
});
export const pathProgressBlock: BlockDefinition = defineBlock({
  metadata: pathProgressMetadata(),
  data: pathProgressData,
  commands: standardSectionCommands('PathProgressBlock'),
  render: (input) => renderStandardSectionBlock(
    input,
    'PathProgressBlock',
    pathProgressSections,
  ),
});
export const brandEmphasisBlock: BlockDefinition = defineBlock({
  metadata: brandEmphasisMetadata(),
  data: brandEmphasisData,
  commands: standardSectionCommands('BrandEmphasisBlock'),
  render: (input) => renderStandardSectionBlock(
    input,
    'BrandEmphasisBlock',
    brandEmphasisSections,
  ),
});
export const modeAwarePrimitiveBlock: BlockDefinition = defineBlock({
  metadata: modeAwarePrimitiveMetadata(),
  data: modeAwarePrimitiveData,
  commands: standardSectionCommands('ModeAwarePrimitiveBlock'),
  render: (input) => renderStandardSectionBlock(
    input,
    'ModeAwarePrimitiveBlock',
    modeAwarePrimitiveSections,
  ),
});
export const denseComparisonBlock: BlockDefinition = defineBlock({
  metadata: denseComparisonMetadata(),
  data: denseComparisonData,
  commands: standardSectionCommands('DenseComparisonBlock'),
  render: (input) => renderStandardSectionBlock(
    input,
    'DenseComparisonBlock',
    denseComparisonSections,
  ),
});
export const hierarchyBlock: BlockDefinition = defineBlock({
  metadata: hierarchyMetadata(),
  data: hierarchyData,
  commands: standardSectionCommands('HierarchyBlock'),
  render: (input) => renderStandardSectionBlock(
    input,
    'HierarchyBlock',
    hierarchySections,
  ),
});
export const explorationListBlock: BlockDefinition = defineBlock({
  metadata: explorationListMetadata(),
  data: explorationListData,
  commands: standardSectionCommands('ExplorationListBlock'),
  render: (input) => renderStandardSectionBlock(
    input,
    'ExplorationListBlock',
    explorationListSections,
  ),
});
export const temporalDependencyBlock: BlockDefinition = defineBlock({
  metadata: temporalDependencyMetadata(),
  data: temporalDependencyData,
  commands: standardSectionCommands('TemporalDependencyBlock'),
  render: (input) => renderStandardSectionBlock(
    input,
    'TemporalDependencyBlock',
    temporalDependencySections,
  ),
});
