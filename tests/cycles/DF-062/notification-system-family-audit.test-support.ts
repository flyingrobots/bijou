import { afterEach, describe, expect, it } from 'vitest';

import {
  stripAnsi,
  stringToSurface,
  surfaceToString,
  type OutputMode,
} from '@flyingrobots/bijou';

import { must, _resetDefaultContextForTesting, createTestContext } from '@flyingrobots/bijou/adapters/test';

import {
  createStoryProfileContext,
  storyPreviewSurface,
} from '../../../examples/_stories/protocol.js';

import { COMPONENT_STORIES } from '../../../examples/docs/stories.js';

import {
  createFramedApp,
  createNotificationState,
  dismissNotification,
  notify,
  pushNotification,
  renderNotificationHistory,
  renderNotificationStack,
  tickNotifications,
  isFrameScopedMsg,
  type Cmd,
  type FramePage,
  type FramedAppMsg,
} from '../../../packages/bijou-tui/src/index.js';

import { normalizeViewOutput } from '../../../packages/bijou-tui/src/view-output.js';

import { isCmdCleanup } from '../../../packages/bijou-tui/src/types.js';

import { readRepoFile } from '../repo.js';

export {
  _resetDefaultContextForTesting,
  afterEach,
  COMPONENT_STORIES,
  createFramedApp,
  createNotificationState,
  createStoryProfileContext,
  createTestContext,
  describe,
  dismissNotification,
  expect,
  isCmdCleanup,
  isFrameScopedMsg,
  it,
  must,
  normalizeViewOutput,
  notify,
  pushNotification,
  readRepoFile,
  renderNotificationHistory,
  renderNotificationStack,
  storyPreviewSurface,
  stringToSurface,
  stripAnsi,
  surfaceToString,
  tickNotifications,
};

export type { Cmd, FramedAppMsg, FramePage, OutputMode };

export {
  BOX_DRAWING_RE,
  CONSTRAINED_MODES,
  NOTIFICATION_STORIES,
  VISUAL_MODES,
  getStory,
  mustFrameMsg,
  renderNotificationVariantText,
  runFrameCommand,
} from './notification-system-family-audit.test-support.part01.js';

export type { SaveModel, SaveMsg } from './notification-system-family-audit.test-support.part01.js';

export { makeNotificationPage } from './notification-system-family-audit.test-support.part02.js';
