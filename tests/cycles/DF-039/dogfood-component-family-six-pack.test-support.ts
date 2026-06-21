import { describe, expect, it } from 'vitest';

import {
  bindSchemaBlockInput,
  dividerBlock,
  dividerSchemaBlock,
  explainabilityWalkthroughBlock,
  explainabilityWalkthroughSchemaBlock,
  formattedDocumentBlock,
  formattedDocumentSchemaBlock,
  framedGroupBlock,
  framedGroupSchemaBlock,
  isSchemaBoundBlockDefinition,
  linkDestinationBlock,
  linkDestinationSchemaBlock,
  lintModeLowering,
  standardBlockPackageManifest,
  standardBlocks,
  textEntryBlock,
  textEntrySchemaBlock,
  validateBlockMetadata,
} from '../../../packages/bijou/src/index.js';

import { readRepoFile } from '../repo.js';

export {
  bindSchemaBlockInput,
  describe,
  dividerBlock,
  dividerSchemaBlock,
  expect,
  explainabilityWalkthroughBlock,
  explainabilityWalkthroughSchemaBlock,
  formattedDocumentBlock,
  formattedDocumentSchemaBlock,
  framedGroupBlock,
  framedGroupSchemaBlock,
  isSchemaBoundBlockDefinition,
  it,
  linkDestinationBlock,
  linkDestinationSchemaBlock,
  lintModeLowering,
  readRepoFile,
  standardBlockPackageManifest,
  standardBlocks,
  textEntryBlock,
  textEntrySchemaBlock,
  validateBlockMetadata,
};

export { COMPONENT_FAMILY_BLOCKS, DESIGN_DOC } from './dogfood-component-family-six-pack.test-support.part01.js';

export { COMPONENT_FAMILY_SCHEMA_BLOCKS } from './dogfood-component-family-six-pack.test-support.part02.js';

export { commandPrefix, expectedNeedle, slotsFor, storyPrefix } from './dogfood-component-family-six-pack.test-support.part03.js';

export { primarySemanticSlot, primarySemanticValue } from './dogfood-component-family-six-pack.test-support.part04.js';
