import { defineSchemaBlock } from '../schema-block.js';

import type { SchemaBoundBlockDefinition } from '../schema-block.js';

import type { BinaryDecisionSchemaData, BrandEmphasisSchemaData, DenseComparisonSchemaData, ExplorationListSchemaData, HierarchySchemaData, ModeAwarePrimitiveSchemaData, PathProgressSchemaData, PeerNavigationSchemaData, ProgressiveDisclosureSchemaData } from './types.js';

import { binaryDecisionBlock, brandEmphasisBlock, denseComparisonBlock, explorationListBlock, hierarchyBlock, modeAwarePrimitiveBlock, pathProgressBlock, peerNavigationBlock, progressiveDisclosureBlock } from './block-definitions.js';

import { binaryDecisionSchemaAdapter, brandEmphasisSchemaAdapter, denseComparisonSchemaAdapter, explorationListSchemaAdapter, hierarchySchemaAdapter, modeAwarePrimitiveSchemaAdapter, pathProgressSchemaAdapter, peerNavigationSchemaAdapter, progressiveDisclosureSchemaAdapter } from './schema-adapters.js';

import { bindStandardSectionSchemaData } from './schema-helpers.js';

import { binaryDecisionSections, brandEmphasisSections, denseComparisonSections, explorationListSections, hierarchySections, modeAwarePrimitiveSections, pathProgressSections, peerNavigationSections, progressiveDisclosureSections } from './sections.js';
export const binaryDecisionSchemaBlock: SchemaBoundBlockDefinition<BinaryDecisionSchemaData> =
  defineSchemaBlock({
    block: binaryDecisionBlock,
    schema: binaryDecisionSchemaAdapter,
    bind: (decision) => bindStandardSectionSchemaData(
      'BinaryDecisionBlock',
      decision as Readonly<Record<string, unknown>>,
      binaryDecisionSections,
    ),
  });
export const peerNavigationSchemaBlock: SchemaBoundBlockDefinition<PeerNavigationSchemaData> =
  defineSchemaBlock({
    block: peerNavigationBlock,
    schema: peerNavigationSchemaAdapter,
    bind: (peers) => bindStandardSectionSchemaData(
      'PeerNavigationBlock',
      peers as Readonly<Record<string, unknown>>,
      peerNavigationSections,
    ),
  });
export const progressiveDisclosureSchemaBlock:
  SchemaBoundBlockDefinition<ProgressiveDisclosureSchemaData> =
  defineSchemaBlock({
    block: progressiveDisclosureBlock,
    schema: progressiveDisclosureSchemaAdapter,
    bind: (disclosure) => bindStandardSectionSchemaData(
      'ProgressiveDisclosureBlock',
      disclosure as Readonly<Record<string, unknown>>,
      progressiveDisclosureSections,
    ),
  });
export const pathProgressSchemaBlock: SchemaBoundBlockDefinition<PathProgressSchemaData> =
  defineSchemaBlock({
    block: pathProgressBlock,
    schema: pathProgressSchemaAdapter,
    bind: (path) => bindStandardSectionSchemaData(
      'PathProgressBlock',
      path as Readonly<Record<string, unknown>>,
      pathProgressSections,
    ),
  });
export const brandEmphasisSchemaBlock: SchemaBoundBlockDefinition<BrandEmphasisSchemaData> =
  defineSchemaBlock({
    block: brandEmphasisBlock,
    schema: brandEmphasisSchemaAdapter,
    bind: (brand) => bindStandardSectionSchemaData(
      'BrandEmphasisBlock',
      brand as Readonly<Record<string, unknown>>,
      brandEmphasisSections,
    ),
  });
export const modeAwarePrimitiveSchemaBlock:
  SchemaBoundBlockDefinition<ModeAwarePrimitiveSchemaData> =
  defineSchemaBlock({
    block: modeAwarePrimitiveBlock,
    schema: modeAwarePrimitiveSchemaAdapter,
    bind: (primitive) => bindStandardSectionSchemaData(
      'ModeAwarePrimitiveBlock',
      primitive as Readonly<Record<string, unknown>>,
      modeAwarePrimitiveSections,
    ),
  });
export const denseComparisonSchemaBlock: SchemaBoundBlockDefinition<DenseComparisonSchemaData> =
  defineSchemaBlock({
    block: denseComparisonBlock,
    schema: denseComparisonSchemaAdapter,
    bind: (comparison) => bindStandardSectionSchemaData(
      'DenseComparisonBlock',
      comparison as Readonly<Record<string, unknown>>,
      denseComparisonSections,
    ),
  });
export const hierarchySchemaBlock: SchemaBoundBlockDefinition<HierarchySchemaData> =
  defineSchemaBlock({
    block: hierarchyBlock,
    schema: hierarchySchemaAdapter,
    bind: (hierarchy) => bindStandardSectionSchemaData(
      'HierarchyBlock',
      hierarchy as Readonly<Record<string, unknown>>,
      hierarchySections,
    ),
  });
export const explorationListSchemaBlock: SchemaBoundBlockDefinition<ExplorationListSchemaData> =
  defineSchemaBlock({
    block: explorationListBlock,
    schema: explorationListSchemaAdapter,
    bind: (list) => bindStandardSectionSchemaData(
      'ExplorationListBlock',
      list as Readonly<Record<string, unknown>>,
      explorationListSections,
    ),
  });
