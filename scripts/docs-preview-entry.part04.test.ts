import { BOOK_MODE_COLORS } from '../examples/docs/dogfood-book-palette.js';
import {
  afterEach,
  cellsWithoutBackground,
  colorHex,
  createDocsApp,
  createTestContext,
  describe,
  expect,
  FLYING_ROBOTS_LOGO_TEXT,
  FLYING_ROBOTS_TRANSPARENT_CELL,
  frameText,
  it,
  KEY_ESCAPE,
  oppositeHexColor,
  runScript,
  _resetDefaultContextForTesting,
} from './docs-preview.test-support.js';

import { must } from '@flyingrobots/bijou/adapters/test';
import { findRasterPrompt } from './docs-preview-prompt.test-support.js';

describe('docs preview app', () => {
  afterEach(() => { _resetDefaultContextForTesting(); });

  it('uses a foreground gradient across the raster Enter prompt', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 160, rows: 48, refreshRate: 60 } });
    const app = createDocsApp(ctx);

    const initial = await runScript(app, [], { ctx });
    const frame = must(initial.frames[0]);
    const prompt = must(findRasterPrompt(frame), 'composed raster prompt');
    const inkColors: (string | undefined)[] = [];
    for (let y = 0; y < prompt.height; y++) {
      for (let x = 0; x < prompt.width; x++) {
        const cell = frame.get(prompt.x + x, prompt.y + y);
        if (cell.char !== '\u2800' && cell.char !== ' ') inkColors.push(colorHex(cell.fg));
      }
    }
    expect(inkColors.length).toBeGreaterThan(10);
    expect(inkColors).not.toContain(undefined);
    expect(new Set(inkColors).size).toBeGreaterThan(1);
  });
});

describe('docs preview app', () => {
  afterEach(() => { _resetDefaultContextForTesting(); });

  it('keeps FlyingRobots logo backgrounds transparent when the landing quit modal dims the title', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 320, rows: 80, refreshRate: 60 } });
    const app = createDocsApp(ctx);

    const opened = await runScript(app, [{ key: KEY_ESCAPE }], { ctx });
    const frame = must(opened.frames.at(-1));
    const text = frameText(frame);
    const lines = text.split('\n');
    const logoLines = FLYING_ROBOTS_LOGO_TEXT.split(/\r?\n/);
    const [firstLogoLine = ''] = logoLines;
    const transparentOffset = firstLogoLine.indexOf(FLYING_ROBOTS_TRANSPARENT_CELL);
    const visiblePrefix = firstLogoLine.slice(0, transparentOffset);
    const logoY = lines.findIndex((line) => line.includes(visiblePrefix));
    const logoX = logoY >= 0 ? must(lines[logoY]).indexOf(visiblePrefix) : -1;
    expect(text).toContain('Quit?');
    expect(logoY).toBeGreaterThanOrEqual(0);
    expect(logoX).toBeGreaterThanOrEqual(0);
    const cell = frame.get(logoX, logoY);
    expect(colorHex(cell.bg)).toBe(BOOK_MODE_COLORS.dark.background);
    expect(colorHex(cell.fg)).toBe(oppositeHexColor(BOOK_MODE_COLORS.dark.background));
    expect(cell.modifiers ?? []).toContain('dim');

  });
});

describe('docs preview app', () => {
  afterEach(() => { _resetDefaultContextForTesting(); });

  it('keeps every landing title cell on a Bijou-owned background', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 200, rows: 60, refreshRate: 73 } });
    const app = createDocsApp(ctx);

    const initial = await runScript(app, [], { ctx });
    const frame = must(initial.frames[0]);

    expect(cellsWithoutBackground(frame)).toEqual([]);
  });
});
