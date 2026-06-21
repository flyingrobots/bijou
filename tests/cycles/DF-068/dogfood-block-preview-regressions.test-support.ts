import { afterEach, describe, expect, it } from 'vitest';

import {
  standardBlocks,
  stripAnsi,
  surfaceToString,
} from '@flyingrobots/bijou';

import { chalkStyle } from '@flyingrobots/bijou-node';

import {
  must,
  _resetDefaultContextForTesting,
} from '@flyingrobots/bijou/adapters/test';

import {
  createScriptTestContext as createTestContext,
  runScriptDeterministic as runScript,
} from '../../helpers/scripted.js';

import { createDocsApp } from '../../../examples/docs/app.js';

import {
  counterDemoBlockConfig,
  counterDemoBlockSurface,
  createCounterDemoModel,
} from '../../../examples/docs/counter-block-demo.js';

export {
  _resetDefaultContextForTesting,
  afterEach,
  chalkStyle,
  counterDemoBlockConfig,
  counterDemoBlockSurface,
  createCounterDemoModel,
  createDocsApp,
  createTestContext,
  describe,
  expect,
  it,
  must,
  runScript,
  standardBlocks,
  stripAnsi,
  surfaceToString,
};

export {
  PREVIEW_SURFACE_SAMPLE_BLOCK_NAMES,
  blockPreviewGuideId,
  colorHex,
  frameText,
  renderBlocksGuide,
  renderBlocksGuideWithRealAnsi,
  rowsFor,
} from './dogfood-block-preview-regressions.test-support.part01.js';

export type { FrameCell, FrameLike } from './dogfood-block-preview-regressions.test-support.part01.js';

export {
  expectBoxTitleRowCloses,
  findCharBefore,
  findTextStart,
  rowContaining,
  standardBlockNamed,
  textBefore,
} from './dogfood-block-preview-regressions.test-support.part02.js';
