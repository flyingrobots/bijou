import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { BIJOU_DARK, BIJOU_LIGHT, colorHex, themeContrastRatio, type ColorRef, type Theme } from '@flyingrobots/bijou';
import { _resetDefaultContextForTesting } from '@flyingrobots/bijou/adapters/test';
import { parseKey } from '@flyingrobots/bijou-tui';

import {
  createScriptTestContext as createTestContext,
  runScriptDeterministic as runScript,
} from '../tests/helpers/scripted.js';
import {
  DOGFOOD_THEME_SAFE_PAIRS,
  createDocsApp,
  docsShellThemesForTesting,
  DOGFOOD_I18N_CATALOG,
  FRAME_I18N_CATALOG,
  stripMarkdownFrontmatter,
} from '../examples/docs/app.js';
import { resolveDogfoodDocsCoverage } from '../examples/docs/coverage.js';
import { createNodeDocsApp } from '../examples/docs/node-app.js';

import { COMPONENT_STORIES } from '../examples/docs/stories.js';
import {
  DOGFOOD_NON_INTERACTIVE_MESSAGE,
  DOGFOOD_TERMINAL_NOTICE,
  dogfoodTerminalReadiness,
} from '../examples/docs/terminal-guard.js';
import { pseudoLocalize } from '../packages/bijou-i18n-tools/src/index.js';
import { wrapPageMsg } from '../packages/bijou-tui/src/app-frame-types.js';
import { QUIT } from '../packages/bijou-tui/src/types.js';
import { normalizeViewOutput } from '../packages/bijou-tui/src/view-output.js';
import { BIJOU_VERSION, FLYING_ROBOTS_LOGO_TEXT, FLYING_ROBOTS_TRANSPARENT_CELL, KEY_BACKTICK, KEY_CTRL_P, KEY_DOWN, KEY_ENTER, KEY_ESCAPE, KEY_F10, KEY_F2, KEY_LEFT, KEY_NEXT_TAB, KEY_RIGHT, KEY_TAB, KEY_UP, TOKEN_DOCTRINE_PATH, V7_DEFAULT_BACKGROUND, V7_RASTER_TITLE_GLYPHS, assertContrast, assertReadableDogfoodTheme, frameText, keyMsg, oppositeHexColor, serializeFrame } from './docs-preview.test-support.part01.js';
import { bijouSvgOverlayMetrics, expectedBijouLogoYOffset, expectedBijouSvgOverlay, expectedLandingWakeColorAt, expectedStackedWakeChar, stackedWakeRowCount, titleBackgroundGlyphCount } from './docs-preview.test-support.part02.js';
import { activeDocsPageModel, cellsWithoutBackground, docsPageModel, matchingBijouSvgOverlayGlyphCount, withLocaleValues } from './docs-preview.test-support.part03.js';
export {
  activeDocsPageModel,
  afterEach,
  assertContrast,
  assertReadableDogfoodTheme,
  BIJOU_DARK,
  BIJOU_LIGHT,
  BIJOU_VERSION,
  bijouSvgOverlayMetrics,
  cellsWithoutBackground,
  colorHex,
  COMPONENT_STORIES,
  createDocsApp,
  createNodeDocsApp,
  createTestContext,
  describe,
  docsPageModel,
  docsShellThemesForTesting,
  DOGFOOD_I18N_CATALOG,
  DOGFOOD_NON_INTERACTIVE_MESSAGE,
  DOGFOOD_TERMINAL_NOTICE,
  DOGFOOD_THEME_SAFE_PAIRS,
  dogfoodTerminalReadiness,
  execFileSync,
  expectedBijouLogoYOffset,
  expectedBijouSvgOverlay,
  expectedLandingWakeColorAt,
  expectedStackedWakeChar,
  expect,
  FLYING_ROBOTS_LOGO_TEXT,
  FLYING_ROBOTS_TRANSPARENT_CELL,
  FRAME_I18N_CATALOG,
  frameText,
  it,
  KEY_BACKTICK,
  KEY_CTRL_P,
  KEY_DOWN,
  KEY_ENTER,
  KEY_ESCAPE,
  KEY_F10,
  KEY_F2,
  KEY_LEFT,
  KEY_NEXT_TAB,
  KEY_RIGHT,
  KEY_TAB,
  KEY_UP,
  keyMsg,
  matchingBijouSvgOverlayGlyphCount,
  normalizeViewOutput,
  oppositeHexColor,
  parseKey,
  pseudoLocalize,
  QUIT,
  readFileSync,
  resolve,
  resolveDogfoodDocsCoverage,
  runScript,
  serializeFrame,
  stackedWakeRowCount,
  stripMarkdownFrontmatter,
  themeContrastRatio,
  titleBackgroundGlyphCount,
  TOKEN_DOCTRINE_PATH,
  V7_DEFAULT_BACKGROUND,
  V7_RASTER_TITLE_GLYPHS,
  withLocaleValues,
  wrapPageMsg,
  _resetDefaultContextForTesting,
};
export type {
  ColorRef,
  Theme,
};
