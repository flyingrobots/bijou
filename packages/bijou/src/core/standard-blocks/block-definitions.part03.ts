import { defineBlock } from '../block-metadata.js';

import type { BlockDefinition } from '../block-metadata.js';

import { brandEmphasisMetadata, denseComparisonMetadata, explorationListMetadata, hierarchyMetadata, modeAwarePrimitiveMetadata, pathProgressMetadata, peerNavigationMetadata, progressiveDisclosureMetadata, temporalDependencyMetadata } from './metadata-standard.js';

import { brandEmphasisData, brandEmphasisSections, denseComparisonData, denseComparisonSections, explorationListData, explorationListSections, hierarchyData, hierarchySections, modeAwarePrimitiveData, modeAwarePrimitiveSections, pathProgressData, pathProgressSections, peerNavigationData, peerNavigationSections, progressiveDisclosureData, progressiveDisclosureSections, standardSectionCommands, temporalDependencyData, temporalDependencySections } from './sections.js';

import { renderStandardSectionBlock } from './render.js';
import { drawProgressiveDisclosure } from './draw-disclosure.js';
import { drawPathProgress } from './draw-path-progress.js';
import { drawPeerNavigation } from './draw-peer-navigation.js';
import { drawBrandEmphasis } from './draw-brand.js';
import { drawDenseComparison } from './draw-dense-comparison.js';
import { drawExplorationList } from './draw-exploration-list.js';
import { drawHierarchy } from './draw-hierarchy.js';
import { drawModeAwarePrimitive } from './draw-mode-aware-primitive.js';
import { drawTemporalDependency } from './draw-temporal-dependency.js';
export const peerNavigationBlock: BlockDefinition = defineBlock({
  metadata: peerNavigationMetadata(),
  data: peerNavigationData,
  commands: standardSectionCommands('PeerNavigationBlock'),
  render: (input) => renderStandardSectionBlock(
    input,
    'PeerNavigationBlock',
    peerNavigationSections,
    drawPeerNavigation,
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
    drawProgressiveDisclosure,
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
    drawPathProgress,
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
    drawBrandEmphasis,
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
    drawModeAwarePrimitive,
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
    drawDenseComparison,
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
    drawHierarchy,
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
    drawExplorationList,
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
    drawTemporalDependency,
  ),
});
