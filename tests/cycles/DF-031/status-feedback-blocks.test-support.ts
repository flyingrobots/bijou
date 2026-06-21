import { describe, expect, it } from 'vitest';

import {
  activityStreamBlock,
  activityStreamSchemaBlock,
  bindSchemaBlockInput,
  inFlowStatusBlock,
  inFlowStatusSchemaBlock,
  inlineStatusBlock,
  inlineStatusSchemaBlock,
  isSchemaBoundBlockDefinition,
  lintModeLowering,
  progressIndicatorBlock,
  progressIndicatorSchemaBlock,
  shortcutCueBlock,
  shortcutCueSchemaBlock,
  standardBlockPackageManifest,
  standardBlocks,
  transientOverlayBlock,
  transientOverlaySchemaBlock,
  validateBlockMetadata,
} from '../../../packages/bijou/src/index.js';

export {
  activityStreamBlock,
  activityStreamSchemaBlock,
  bindSchemaBlockInput,
  describe,
  expect,
  inFlowStatusBlock,
  inFlowStatusSchemaBlock,
  inlineStatusBlock,
  inlineStatusSchemaBlock,
  isSchemaBoundBlockDefinition,
  it,
  lintModeLowering,
  progressIndicatorBlock,
  progressIndicatorSchemaBlock,
  shortcutCueBlock,
  shortcutCueSchemaBlock,
  standardBlockPackageManifest,
  standardBlocks,
  transientOverlayBlock,
  transientOverlaySchemaBlock,
  validateBlockMetadata,
};

export { STATUS_FEEDBACK_BLOCKS } from './status-feedback-blocks.test-support.part01.js';

export { STATUS_FEEDBACK_SCHEMA_BLOCKS } from './status-feedback-blocks.test-support.part02.js';

export {
  commandPrefix,
  expectedNeedle,
  primarySemanticSlot,
  primarySemanticValue,
  slotsFor,
  storyPrefix,
} from './status-feedback-blocks.test-support.part03.js';
