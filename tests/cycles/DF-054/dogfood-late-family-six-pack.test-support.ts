import { describe, expect, it } from 'vitest';

import {
  bindSchemaBlockInput,
  brandEmphasisBlock,
  brandEmphasisSchemaBlock,
  denseComparisonBlock,
  denseComparisonSchemaBlock,
  explorationListBlock,
  explorationListSchemaBlock,
  hierarchyBlock,
  hierarchySchemaBlock,
  isSchemaBoundBlockDefinition,
  lintModeLowering,
  modeAwarePrimitiveBlock,
  modeAwarePrimitiveSchemaBlock,
  standardBlockPackageManifest,
  standardBlocks,
  temporalDependencyBlock,
  temporalDependencySchemaBlock,
  validateBlockMetadata,
} from '../../../packages/bijou/src/index.js';

import { readRepoFile } from '../repo.js';

export {
  bindSchemaBlockInput,
  brandEmphasisBlock,
  brandEmphasisSchemaBlock,
  denseComparisonBlock,
  denseComparisonSchemaBlock,
  describe,
  expect,
  explorationListBlock,
  explorationListSchemaBlock,
  hierarchyBlock,
  hierarchySchemaBlock,
  isSchemaBoundBlockDefinition,
  it,
  lintModeLowering,
  modeAwarePrimitiveBlock,
  modeAwarePrimitiveSchemaBlock,
  readRepoFile,
  standardBlockPackageManifest,
  standardBlocks,
  temporalDependencyBlock,
  temporalDependencySchemaBlock,
  validateBlockMetadata,
};

export { DESIGN_DOC, LATE_FAMILY_BLOCKS } from './dogfood-late-family-six-pack.test-support.part01.js';

export { LATE_FAMILY_SCHEMA_BLOCKS } from './dogfood-late-family-six-pack.test-support.part02.js';

export { commandPrefix, expectedNeedle, slotsFor, storyPrefix } from './dogfood-late-family-six-pack.test-support.part03.js';

export { primarySemanticSlot, primarySemanticValue, selectedFactValue } from './dogfood-late-family-six-pack.test-support.part04.js';
