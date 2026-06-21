import { describe, expect, it } from 'vitest';

import {
  defineAppShellComposition,
} from './app-shell-composition.js';

import {
  defineBlock,
  validateBlockMetadata,
  validateBlockPackageManifest,
  type BlockRenderResult,
  type BlockMetadata,
} from './block-metadata.js';

import {
  blockRenderNode,
  renderBlockTree,
} from './block-tree-render.js';

import { createSurface } from '../ports/surface.js';

import {
  bindSchemaBlockInput,
  isSchemaBoundBlockDefinition,
} from './schema-block.js';

import { lintModeLowering } from './mode-lowering.js';

import {
  activityStreamBlock,
  appShellBlock,
  binaryDecisionBlock,
  brandEmphasisBlock,
  denseComparisonBlock,
  dividerBlock,
  explorationListBlock,
  explainabilityWalkthroughBlock,
  formattedDocumentBlock,
  framedGroupBlock,
  hierarchyBlock,
  inFlowStatusBlock,
  inlineStatusBlock,
  inspectorPanelBlock,
  inspectorPanelSchemaBlock,
  linkDestinationBlock,
  modeAwarePrimitiveBlock,
  multipleChoiceBlock,
  pathProgressBlock,
  peerNavigationBlock,
  progressIndicatorBlock,
  progressiveDisclosureBlock,
  readerSurfaceBlock,
  readerSurfaceSchemaBlock,
  shortcutCueBlock,
  singleChoiceBlock,
  standardBlockPackageManifest,
  standardBlocks,
  standardBlockStories,
  textEntryBlock,
  temporalDependencyBlock,
  transientOverlayBlock,
} from './standard-blocks.js';

export {
  activityStreamBlock,
  appShellBlock,
  binaryDecisionBlock,
  bindSchemaBlockInput,
  blockRenderNode,
  brandEmphasisBlock,
  createSurface,
  defineAppShellComposition,
  defineBlock,
  denseComparisonBlock,
  describe,
  dividerBlock,
  expect,
  explainabilityWalkthroughBlock,
  explorationListBlock,
  formattedDocumentBlock,
  framedGroupBlock,
  hierarchyBlock,
  inFlowStatusBlock,
  inlineStatusBlock,
  inspectorPanelBlock,
  inspectorPanelSchemaBlock,
  isSchemaBoundBlockDefinition,
  it,
  linkDestinationBlock,
  lintModeLowering,
  modeAwarePrimitiveBlock,
  multipleChoiceBlock,
  pathProgressBlock,
  peerNavigationBlock,
  progressIndicatorBlock,
  progressiveDisclosureBlock,
  readerSurfaceBlock,
  readerSurfaceSchemaBlock,
  renderBlockTree,
  shortcutCueBlock,
  singleChoiceBlock,
  standardBlockPackageManifest,
  standardBlocks,
  standardBlockStories,
  temporalDependencyBlock,
  textEntryBlock,
  transientOverlayBlock,
  validateBlockMetadata,
  validateBlockPackageManifest,
};

export type { BlockMetadata, BlockRenderResult };

export { findCell, isSurfaceOutput, spyMetadata, surfaceText } from './standard-blocks.test-support.part01.js';
