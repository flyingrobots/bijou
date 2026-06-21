import { describe, it, expect, expectTypeOf, afterEach, beforeEach, vi } from 'vitest';

import {
  BijouBootstrapError,
  createNodeContext,
  initDefaultContext,
  startApp,
  type StartAppOptions,
  _resetInitializedForTesting,
  _registerDefaultContextInitializerForTesting,
} from './index.js';

import { getDefaultContext, setDefaultContext, stringToSurface, type Surface, type Theme } from '@flyingrobots/bijou';

import { _resetDefaultContextForTesting, createTestContext } from '@flyingrobots/bijou/adapters/test';

import { run, type App, type RunOptions } from '@flyingrobots/bijou-tui';

export {
  _registerDefaultContextInitializerForTesting,
  _resetDefaultContextForTesting,
  _resetInitializedForTesting,
  afterEach,
  beforeEach,
  BijouBootstrapError,
  createNodeContext,
  createTestContext,
  describe,
  expect,
  expectTypeOf,
  getDefaultContext,
  initDefaultContext,
  it,
  run,
  setDefaultContext,
  startApp,
  stringToSurface,
  vi,
};

export type { App, RunOptions, StartAppOptions, Surface, Theme };

export {
  CUSTOM_ID_THEME_SET,
  DARK_THEME,
  LIGHT_THEME,
  TEST_THEME,
  TEST_THEME_SET,
  makeTheme,
  textSurface,
  withStdoutSize,
} from './index.test-support.part01.js';

export type { Opts } from './index.test-support.part01.js';

export { LEGACY_TEST_THEME, UNUSED_THEME } from './index.test-support.part02.js';
