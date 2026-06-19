import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  BIJOU_DARK,
  BIJOU_LIGHT,
  colorHex,
  doctorTheme,
  lerp3,
  themeContrastRatio,
  type ColorRef,
  type Theme,
} from '@flyingrobots/bijou';
import { _resetDefaultContextForTesting } from '@flyingrobots/bijou/adapters/test';
import { parseKey, rasterToGlyphSurface } from '@flyingrobots/bijou-tui';
import type { DocsPageModel, DocsRootModel, LocaleCatalog } from './docs-preview-model-types.js';
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
import { rasterizeSvgToRgba, svgViewBoxAspectRatio } from '../examples/docs/svg-raster.js';
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

const PKG: unknown = JSON.parse(
  readFileSync(resolve(import.meta.dirname, '..', 'packages', 'bijou', 'package.json'), 'utf8'),
);
const BIJOU_VERSION = (
  typeof PKG === 'object'
  && PKG !== null
  && 'version' in PKG
  && typeof PKG.version === 'string'
)
  ? PKG.version
  : '0.0.0';

const KEY_ENTER = '\r';
const KEY_UP = '\x1b[A';
const KEY_DOWN = '\x1b[B';
const KEY_LEFT = '\x1b[D';
const KEY_RIGHT = '\x1b[C';
const KEY_ESCAPE = '\x1b';
const KEY_F2 = '\x1bOQ';
const KEY_TAB = '\t';
const KEY_CTRL_P = '\x10';
const KEY_F10 = '\x1b[21~';
const KEY_NEXT_TAB = ']';
const KEY_BACKTICK = '`';
const V7_RASTER_TITLE_GLYPHS = new Set(['░', '▒', '▓', '█']);
const V7_TITLE_CELL_ASPECT_RATIO = 0.5;
const V7_BIJOU_SVG_TEXT = readFileSync(resolve(import.meta.dirname, '..', 'assets', 'Bijou.svg'), 'utf8');
const FLYING_ROBOTS_LOGO_TEXT = readFileSync(resolve(import.meta.dirname, '..', 'assets', 'flyingrobotslogo.txt'), 'utf8').trimEnd();
const FLYING_ROBOTS_TRANSPARENT_CELL = '\u2800';
const V7_DEFAULT_BACKGROUND = '#18172b';
const V7_DEFAULT_WAVE_GRADIENT = ['#2f3f66', '#5f87c8', '#f2c96b'] as const;
const V7_LANDING_COLOR_RAMP_SIZE = 256;
const V7_LANDING_WAKE_CHARS = ['█', '▓', '▒', '░', ' '] as const;
const V7_LANDING_WAKE_WAVES = [
  { seeds: [0.15, 0.13, 0.37], amps: [10, 8, 5], scale: 0.9 },
  { seeds: [0.12, 0.14, 0.27], amps: [3, 6, 5], scale: 0.8 },
  { seeds: [0.089, 0.023, 0.217], amps: [2, 4, 2], scale: 0.3 },
  { seeds: [0.167, 0.054, 0.147], amps: [4, 6, 7], scale: 0.4 },
] as const;
const TOKEN_DOCTRINE_PATH = resolve(import.meta.dirname, '..', 'docs', 'design-system', 'theme-tokens.md');

function assertContrast(
  theme: Theme,
  foreground: string,
  background: string,
  label: string,
  minRatio = 4.5,
): void {
  const ratio = themeContrastRatio(foreground, background);
  if (ratio == null) throw new Error(`Missing contrast: ${theme.name} ${label}`);
  expect(ratio, `${theme.name} ${label}`).toBeGreaterThanOrEqual(minRatio);
}

function assertReadableDogfoodTheme(theme: Theme): void {
  const surfaceBackgrounds = Object.entries(theme.surface).map(([name, token]) => {
    if (token.bg == null) throw new Error(`Missing ${theme.name} surface.${name}.bg`);
    assertContrast(theme, token.hex, token.bg, `surface.${name} text on fill`);
    return token.bg;
  });

  expect(new Set(surfaceBackgrounds).size, `${theme.name} surface backgrounds`).toBeGreaterThanOrEqual(4);

  const report = doctorTheme(theme, { contrastPairs: DOGFOOD_THEME_SAFE_PAIRS });
  expect(report.issues, `${theme.name} safe pairs`).toEqual([]);
}
const V7_BIJOU_LOGO_LETTER_COUNT = 5;
const V7_BIJOU_LOGO_WAVE_AMPLITUDE_ROWS = 1.35;

function keyMsg(key: string, options: { ctrl?: boolean; alt?: boolean; shift?: boolean } = {}) {
  return {
    type: 'key' as const,
    key,
    ctrl: options.ctrl ?? false,
    alt: options.alt ?? false,
    shift: options.shift ?? false,
  };
}

function serializeFrame(frame: { width: number; height: number; get(x: number, y: number): { char?: string; fg?: ColorRef; bg?: ColorRef } }) {
  const cells: string[] = [];
  for (let y = 0; y < frame.height; y++) {
    for (let x = 0; x < frame.width; x++) {
      const cell = frame.get(x, y);
      cells.push(`${cell.char ?? ' '}|${colorHex(cell.fg) ?? ''}|${colorHex(cell.bg) ?? ''}`);
    }
  }
  return cells.join('\n');
}

function frameText(frame: { width: number; height: number; get(x: number, y: number): { char?: string } }) {
  let text = '';
  for (let y = 0; y < frame.height; y++) {
    for (let x = 0; x < frame.width; x++) {
      text += frame.get(x, y).char ?? ' ';
    }
    text += '\n';
  }
  return text;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace(/^#/, '');
  return [
    parseInt(normalized.slice(0, 2), 16),
    parseInt(normalized.slice(2, 4), 16),
    parseInt(normalized.slice(4, 6), 16),
  ];
}

function rgbHex(r: number, g: number, b: number): string {
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function oppositeHexColor(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbHex(255 - r, 255 - g, 255 - b);
}

function sampleDefaultWaveRamp(t: number): string {
  const index = Math.max(0, Math.min(
    V7_LANDING_COLOR_RAMP_SIZE - 1,
    Math.round(clamp01(t) * (V7_LANDING_COLOR_RAMP_SIZE - 1)),
  ));
  const stops = V7_DEFAULT_WAVE_GRADIENT.map((color, stopIndex) => ({
    pos: stopIndex / (V7_DEFAULT_WAVE_GRADIENT.length - 1),
    color: hexToRgb(color),
  }));
  return rgbHex(...lerp3(stops, index / (V7_LANDING_COLOR_RAMP_SIZE - 1)));
}

function expectedLandingWakeColorAt(x: number, y: number, width: number, height: number): string {
  const tile = width * height <= 14_000 ? 1 : width * height <= 28_000 ? 2 : 3;
  const tileX = Math.floor(x / tile) * tile;
  const tileY = Math.floor(y / tile) * tile;
  const sampleX = Math.min(width - 1, tileX + Math.floor(tile / 2));
  const sampleY = Math.min(height - 1, tileY + Math.floor(tile / 2));
  const widthDenominator = width - 1 || 1;
  const heightDenominator = height - 1 || 1;
  const u = sampleX / widthDenominator;
  const v = sampleY / heightDenominator;
  const layer = landingWakeLayer(sampleX, sampleY, width, 0, Math.max(0.35, Math.min(1.4, width / 120)));
  const char = V7_LANDING_WAKE_CHARS[layer] ?? ' ';
  if (char === ' ') return V7_DEFAULT_BACKGROUND;
  const colorT = clamp01(
    0.1
    + (layer * 0.16)
    + (u * 0.26)
    + (0.18 * (0.5 + (Math.sin(v * 5.2) * 0.5)))
    + (0.06 * Math.sin(sampleX * 0.035)),
  );
  return sampleDefaultWaveRamp(colorT);
}

function titleBackgroundGlyphCount(text: string): number {
  return Array.from(text).filter((char) => V7_RASTER_TITLE_GLYPHS.has(char)).length;
}

function stackedWakeRowCount(frame: {
  width: number;
  height: number;
  get(x: number, y: number): { char?: string };
}): number {
  let rows = 0;
  const maxY = Math.max(1, Math.floor(frame.height * 0.58));

  for (let y = 1; y < maxY; y++) {
    let line = '';
    for (let x = 0; x < frame.width; x++) {
      line += frame.get(x, y).char ?? ' ';
    }

    const full = line.indexOf('█');
    const dark = full < 0 ? -1 : line.indexOf('▓', full + 1);
    const mid = dark < 0 ? -1 : line.indexOf('▒', dark + 1);
    const light = mid < 0 ? -1 : line.indexOf('░', mid + 1);
    if (full >= 0 && dark > full && mid > dark && light > mid) {
      rows++;
    }
  }

  return rows;
}

function bijouSvgOverlayMetrics(width: number, height: number) {
  const aspectRatio = svgViewBoxAspectRatio(V7_BIJOU_SVG_TEXT);
  const maxColumns = Math.max(1, width - 4);
  const targetColumns = Math.max(20, Math.min(maxColumns, Math.floor(width * 0.84)));
  const maxRows = Math.max(3, Math.floor(height * 0.32));
  const rows = Math.max(
    3,
    Math.min(maxRows, Math.round((targetColumns * V7_TITLE_CELL_ASPECT_RATIO) / aspectRatio)),
  );
  const columns = Math.max(
    12,
    Math.min(maxColumns, Math.round((rows * aspectRatio) / V7_TITLE_CELL_ASPECT_RATIO)),
  );
  const centerY = Math.floor(height * 0.29);
  const topLimit = Math.max(0, height - rows - 2);

  return {
    columns,
    rows,
    left: Math.max(0, Math.floor((width - columns) / 2)),
    top: Math.max(1, Math.min(topLimit, centerY - Math.floor(rows / 2))),
  };
}

function expectedBijouSvgOverlay(width: number, height: number) {
  const metrics = bijouSvgOverlayMetrics(width, height);
  const frame = rasterizeSvgToRgba(V7_BIJOU_SVG_TEXT, {
    width: Math.max(1, metrics.columns * 2),
    height: Math.max(1, metrics.rows * 4),
  });
  const mask = rasterToGlyphSurface(frame, {
    columns: metrics.columns,
    rows: metrics.rows,
    fit: 'stretch',
    renderer: {
      kind: 'charset',
      chars: ' ░▒▓█',
      order: 'light-to-dark',
    },
  });

  return { ...metrics, mask };
}

function expectedStackedWakeChar(x: number, y: number, width: number): string {
  const amplitudeScale = Math.max(0.35, Math.min(1.4, width / 120));
  const layer = landingWakeLayer(x, y, width, 0, amplitudeScale);
  return V7_LANDING_WAKE_CHARS[layer] ?? ' ';
}

function expectedBijouLogoLetterIndex(x: number, width: number): number {
  const letterWidth = Math.max(1, width / V7_BIJOU_LOGO_LETTER_COUNT);
  return Math.max(0, Math.min(V7_BIJOU_LOGO_LETTER_COUNT - 1, Math.floor(x / letterWidth)));
}

function expectedBijouLogoYOffset(x: number, width: number, timeMs: number): number {
  const letterIndex = expectedBijouLogoLetterIndex(x, width);
  return Math.round(Math.sin((timeMs * 0.004) + (letterIndex * 0.82)) * V7_BIJOU_LOGO_WAVE_AMPLITUDE_ROWS);
}

function landingWakeLayer(
  x: number,
  y: number,
  width: number,
  time: number,
  amplitudeScale: number,
): number {
  let edge = width / 4;
  const edges: number[] = [];

  for (const spec of V7_LANDING_WAKE_WAVES) {
    edge += stackedWakeWave(time, y, spec.seeds, spec.amps) * spec.scale * amplitudeScale;
    edges.push(edge);
  }

  for (let index = edges.length - 1; index >= 0; index--) {
    const edge = edges[index];
    if (edge !== undefined && x > edge) return index + 1;
  }

  return 0;
}

function stackedWakeWave(
  time: number,
  y: number,
  seeds: readonly [number, number, number],
  amps: readonly [number, number, number],
): number {
  return (
    ((Math.sin(time + (y * seeds[0])) + 1) * amps[0])
    + ((Math.sin(time + (y * seeds[1])) + 1) * amps[1])
    + (Math.sin(time + (y * seeds[2])) * amps[2])
  );
}

function matchingBijouSvgOverlayGlyphCount(frame: {
  width: number;
  height: number;
  get(x: number, y: number): { char?: string; fg?: ColorRef };
}, timeMs: number): { readonly expected: number; readonly matched: number } {
  const overlay = expectedBijouSvgOverlay(frame.width, frame.height);
  let expected = 0;
  let matched = 0;

  for (let y = 0; y < overlay.mask.height; y++) {
    for (let x = 0; x < overlay.mask.width; x++) {
      const expectedChar = overlay.mask.get(x, y).char;
      if (expectedChar === ' ') continue;
      expected++;

      const actual = frame.get(overlay.left + x, overlay.top + y + expectedBijouLogoYOffset(x, overlay.mask.width, timeMs));
      if (actual.char === expectedChar && colorHex(actual.fg) != null) {
        matched++;
      }
    }
  }

  return { expected, matched };
}

function cellsWithoutBackground(frame: {
  width: number;
  height: number;
  get(x: number, y: number): { bg?: ColorRef; bgRGB?: readonly [number, number, number] };
}) {
  const missing: string[] = [];
  for (let y = 0; y < frame.height; y++) {
    for (let x = 0; x < frame.width; x++) {
      const cell = frame.get(x, y);
      if (cell.bg == null && cell.bgRGB == null) {
        missing.push(`${String(x)},${String(y)}`);
      }
    }
  }
  return missing;
}

function docsPageModel(model: DocsRootModel, pageId: string): DocsPageModel {
  const pageModel = model.docsModel.pageModels[pageId];
  if (pageModel == null) throw new Error(`Missing docs page: ${pageId}`);
  return pageModel;
}

function activeDocsPageModel(model: DocsRootModel): DocsPageModel {
  return docsPageModel(model, model.docsModel.activePageId);
}

function withLocaleValues(
  catalog: LocaleCatalog,
  locale: string,
  translate: (value: string, key: string) => string,
): LocaleCatalog {
  return {
    namespace: catalog.namespace,
    entries: catalog.entries.map((entry) => {
      const source = entry.values[entry.sourceLocale];
      return {
        ...entry,
        values: {
          ...entry.values,
          ...(typeof source === 'string'
            ? { [locale]: translate(source, entry.key.id) }
            : {}),
        },
      };
    }),
  };
}

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
