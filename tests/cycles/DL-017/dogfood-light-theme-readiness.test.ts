import { afterEach, describe, expect, it } from 'vitest';
import { doctorTheme, type Surface } from '@flyingrobots/bijou';
import { must, _resetDefaultContextForTesting  } from '@flyingrobots/bijou/adapters/test';
import { parseKey } from '@flyingrobots/bijou-tui';
import { normalizeViewOutput } from '../../../packages/bijou-tui/src/view-output.js';
import { createScriptTestContext as createTestContext } from '../../helpers/scripted.js';
import {
  DOGFOOD_SHELL_THEMES,
  DOGFOOD_THEME_SAFE_PAIRS,
} from '../../../examples/docs/dogfood-shell-themes.js';
import { createDocsApp } from '../../../examples/docs/app.js';
import { runKeysDeterministically } from './dogfood-light-theme-readiness.test-support.js';

const DRAWER_BORDER_CHARS = new Set(['┌', '┐', '└', '┘', '│', '─']);
const KEY_F2 = parseKey('\x1bOQ');
const KEY_DOWN = parseKey('\x1b[B');
const KEY_ENTER = parseKey('\r');
const KEY_ESCAPE = parseKey('\x1b');
const KEY_CTRL_P = parseKey('\x10');
const KEY_Q = parseKey('q');
const MSG_CTRL_T = { type: 'key', key: 't', ctrl: true, alt: false, shift: false } as const;
const MSG_F10 = { type: 'key', key: 'f10', ctrl: false, alt: false, shift: false } as const;

describe('DL-017 DOGFOOD light theme readiness', () => {
  afterEach(() => { _resetDefaultContextForTesting(); });

  it('paints DOGFOOD light settings drawer chrome with explicit backgrounds', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 36 } });
    const app = createDocsApp(ctx, { initialRoute: 'docs' });

    const model = await runKeysDeterministically(app, [
      KEY_F2,
      KEY_DOWN,
      KEY_ENTER,
    ]);
    const frame = normalizeViewOutput(app.view(model), {
      width: ctx.runtime.columns,
      height: ctx.runtime.rows,
    }).surface;

    expect(model.docsModel.activeShellThemeId).toBe('dogfood:light');
    assertBorderCellsPaintBackground(
      frame,
      rightAnchoredDrawerBorderCells(frame),
      'settings drawer',
    );
  });

  it('paints DOGFOOD light quit modal chrome with explicit backgrounds', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 36 } });
    const app = createDocsApp(ctx, { initialRoute: 'docs' });

    const model = await runKeysDeterministically(app, [
      KEY_F2,
      KEY_DOWN,
      KEY_ENTER,
      KEY_ESCAPE,
      KEY_Q,
    ]);
    const frame = normalizeViewOutput(app.view(model), {
      width: ctx.runtime.columns,
      height: ctx.runtime.rows,
    }).surface;

    expect(model.docsModel.activeShellThemeId).toBe('dogfood:light');
    assertBorderCellsPaintBackground(
      frame,
      centeredModalBorderCells(frame, 'Quit?'),
      'quit modal',
    );
  });

  it('paints DOGFOOD light command palette menu chrome with explicit backgrounds', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 36 } });
    const app = createDocsApp(ctx, { initialRoute: 'docs' });

    const model = await runKeysDeterministically(app, [
      KEY_F2,
      KEY_DOWN,
      KEY_ENTER,
      KEY_ESCAPE,
      KEY_CTRL_P,
    ]);
    const frame = normalizeViewOutput(app.view(model), {
      width: ctx.runtime.columns,
      height: ctx.runtime.rows,
    }).surface;

    expect(model.docsModel.activeShellThemeId).toBe('dogfood:light');
    assertBorderCellsPaintBackground(
      frame,
      centeredModalBorderCells(frame, 'Command Palette'),
      'command palette',
    );
  });

  it('covers DOGFOOD light chrome tokens in safe-pair diagnostics', () => {
    const lightTheme = DOGFOOD_SHELL_THEMES[0]?.modes?.find((mode) => mode.id === 'light')?.theme;
    expect(lightTheme?.name).toBe('dogfood-light');

    const requiredChromePairs = [
      'border.primary -> surface.elevated.bg',
      'border.primary -> surface.overlay.bg',
      'border.muted -> surface.primary.bg',
      'border.muted -> surface.elevated.bg',
      'ui.scrollThumb -> surface.elevated.bg',
      'ui.scrollTrack -> surface.elevated.bg',
      'ui.focusGutter -> ui.focusGutter.bg',
    ];
    const chromePairs = new Set(
      DOGFOOD_THEME_SAFE_PAIRS
        .filter((pair) => pair.kind === 'chrome')
        .map((pair) => `${pair.foreground} -> ${pair.background}`),
    );

    for (const pair of requiredChromePairs) {
      expect(chromePairs).toContain(pair);
    }

    const report = doctorTheme(must(lightTheme), { contrastPairs: DOGFOOD_THEME_SAFE_PAIRS });
    expect(report.issues.filter((issue) => issue.kind === 'low-contrast')).toEqual([]);
  });

  it('renders Theme Lab and Theme Inspector swatch text with readable light theme tokens', async () => {
    const lightTheme = DOGFOOD_SHELL_THEMES[0]?.modes?.find((mode) => mode.id === 'light')?.theme;
    expect(lightTheme?.name).toBe('dogfood-light');
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 180, rows: 56 } });
    const app = createDocsApp(ctx, { initialRoute: 'docs', initialPageId: 'themes' });

    const [initialModel] = app.init();
    const [lightModel] = app.update(MSG_CTRL_T, initialModel);
    const labFrame = normalizeViewOutput(app.view(lightModel), {
      width: ctx.runtime.columns,
      height: ctx.runtime.rows,
    }).surface;
    assertTokenTextColors(
      labFrame,
      'semantic.success',
      must(lightTheme).surface.primary.hex,
      must(lightTheme).surface.muted.hex,
      'Theme Lab',
    );

    const [inspectorModel] = app.update(MSG_F10, lightModel);
    const inspectorFrame = normalizeViewOutput(app.view(inspectorModel), {
      width: ctx.runtime.columns,
      height: ctx.runtime.rows,
    }).surface;
    assertTokenTextColors(
      inspectorFrame,
      'semantic.success',
      must(lightTheme).surface.primary.hex,
      must(lightTheme).surface.muted.hex,
      'Theme Inspector',
    );
  });
});

function rightAnchoredDrawerBorderCells(surface: Surface): readonly [number, number][] {
  const startCol = Math.floor(surface.width * 0.55);
  const cells: [number, number][] = [];
  for (let y = 0; y < surface.height; y += 1) {
    for (let x = startCol; x < surface.width; x += 1) {
      if (DRAWER_BORDER_CHARS.has(surface.get(x, y).char)) {
        cells.push([x, y]);
      }
    }
  }
  expect(cells.length).toBeGreaterThan(0);
  return cells;
}

function centeredModalBorderCells(surface: Surface, title: string): readonly [number, number][] {
  const modalTitleRow = firstBorderRowContaining(surface, title);
  const topRow = findNearestBorderRow(surface, modalTitleRow, -1);
  const bottomRow = findNearestBorderRow(surface, modalTitleRow, 1);
  const startCol = firstTopBorderCol(surface, 0, topRow);
  const endCol = lastTopBorderCol(surface, topRow);

  const cells: [number, number][] = [];
  for (let y = topRow; y <= bottomRow; y += 1) {
    for (let x = startCol; x <= endCol; x += 1) {
      if (DRAWER_BORDER_CHARS.has(surface.get(x, y).char)) {
        cells.push([x, y]);
      }
    }
  }
  expect(cells.length).toBeGreaterThan(0);
  return cells;
}

function assertBorderCellsPaintBackground(
  surface: Surface,
  cells: readonly [number, number][],
  label: string,
): void {
  const unpainted = cells.filter(([x, y]) => {
    const cell = surface.get(x, y);
    return cell.bg == null && cell.bgRGB == null;
  });

  expect(unpainted, `${label} border cells without background`).toEqual([]);
}

function assertTokenTextColors(
  surface: Surface,
  tokenLabel: string,
  expectedLabelFg: string,
  expectedValueFg: string,
  surfaceLabel: string,
): void {
  const labelCell = firstTextCell(surface, tokenLabel);
  expect(labelCell.cell.fg, `${surfaceLabel} ${tokenLabel} label foreground`).toBe(expectedLabelFg);

  const tokenValue = firstHexTokenCellAfter(surface, labelCell.y, labelCell.x + tokenLabel.length);
  expect(tokenValue.cell.fg, `${surfaceLabel} ${tokenLabel} value foreground`).toBe(expectedValueFg);
}

function firstTextCell(
  surface: Surface,
  text: string,
): { readonly x: number; readonly y: number; readonly cell: ReturnType<Surface['get']> } {
  for (let y = 0; y < surface.height; y += 1) {
    const line = Array.from({ length: surface.width }, (_, x) => surface.get(x, y).char).join('');
    const x = line.indexOf(text);
    if (x !== -1) {
      return { x, y, cell: surface.get(x, y) };
    }
  }
  throw new Error(`No row containing "${text}".`);
}

function firstHexTokenCellAfter(
  surface: Surface,
  y: number,
  startX: number,
): { readonly x: number; readonly y: number; readonly cell: ReturnType<Surface['get']> } {
  for (let x = Math.max(0, startX); x < surface.width; x += 1) {
    const cell = surface.get(x, y);
    if (cell.char === '#') {
      return { x, y, cell };
    }
  }
  throw new Error(`No hex token cell found on row ${y} after column ${startX}.`);
}

function firstTopBorderCol(surface: Surface, start: number, row = 0): number {
  for (let x = start; x < surface.width; x += 1) {
    if (surface.get(x, row).char === '┌') return x;
  }
  throw new Error(`No top-left border found from column ${start} on row ${row}.`);
}

function lastTopBorderCol(surface: Surface, row: number): number {
  for (let x = surface.width - 1; x >= 0; x -= 1) {
    if (surface.get(x, row).char === '┐') return x;
  }
  throw new Error(`No top-right border found on row ${row}.`);
}

function firstBorderRowContaining(surface: Surface, text: string): number {
  for (let y = 0; y < surface.height; y += 1) {
    const line = Array.from({ length: surface.width }, (_, x) => surface.get(x, y).char).join('');
    if (line.includes(text)) return y;
  }
  throw new Error(`No row containing "${text}".`);
}

function findNearestBorderRow(surface: Surface, startRow: number, step: -1 | 1): number {
  for (let y = startRow; y >= 0 && y < surface.height; y += step) {
    const expected = step === -1 ? '┌' : '└';
    if (Array.from({ length: surface.width }, (_, x) => surface.get(x, y).char).includes(expected)) {
      return y;
    }
  }
  throw new Error(`No modal border row found from ${startRow}.`);
}
