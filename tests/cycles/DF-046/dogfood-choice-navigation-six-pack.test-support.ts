import { describe, expect, it } from 'vitest';

import { must } from '@flyingrobots/bijou/adapters/test';

import {
  binaryDecisionBlock,
  binaryDecisionSchemaBlock,
  bindSchemaBlockInput,
  isSchemaBoundBlockDefinition,
  lintModeLowering,
  multipleChoiceBlock,
  multipleChoiceSchemaBlock,
  pathProgressBlock,
  pathProgressSchemaBlock,
  peerNavigationBlock,
  peerNavigationSchemaBlock,
  progressiveDisclosureBlock,
  progressiveDisclosureSchemaBlock,
  singleChoiceBlock,
  singleChoiceSchemaBlock,
  standardBlockPackageManifest,
  standardBlocks,
  validateBlockMetadata,
} from '../../../packages/bijou/src/index.js';

import { readRepoFile } from '../repo.js';

export {
  binaryDecisionBlock,
  binaryDecisionSchemaBlock,
  bindSchemaBlockInput,
  describe,
  expect,
  isSchemaBoundBlockDefinition,
  it,
  lintModeLowering,
  multipleChoiceBlock,
  multipleChoiceSchemaBlock,
  must,
  pathProgressBlock,
  pathProgressSchemaBlock,
  peerNavigationBlock,
  peerNavigationSchemaBlock,
  progressiveDisclosureBlock,
  progressiveDisclosureSchemaBlock,
  readRepoFile,
  singleChoiceBlock,
  singleChoiceSchemaBlock,
  standardBlockPackageManifest,
  standardBlocks,
  validateBlockMetadata,
};

export { CHOICE_NAVIGATION_BLOCKS, DESIGN_DOC } from './dogfood-choice-navigation-six-pack.test-support.part01.js';

export { CHOICE_NAVIGATION_SCHEMA_BLOCKS } from './dogfood-choice-navigation-six-pack.test-support.part02.js';

export { commandPrefix, expectedNeedle, slotsFor, storyPrefix } from './dogfood-choice-navigation-six-pack.test-support.part03.js';

export { primarySemanticSlot, primarySemanticValue, selectedFactValue } from './dogfood-choice-navigation-six-pack.test-support.part04.js';
