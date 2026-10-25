import { bareBookLandingBackground } from './docs-preview-noise.test-support.js';
import { BOOK_MODE_COLORS } from '../examples/docs/dogfood-book-palette.js';
import {
  afterEach,
  colorHex,
  createDocsApp,
  createTestContext,
  describe,
  expect,
  FLYING_ROBOTS_LOGO_TEXT,
  FLYING_ROBOTS_TRANSPARENT_CELL,
  frameText,
  it,
  oppositeHexColor,
  runScript,
  _resetDefaultContextForTesting,
} from './docs-preview.test-support.js';

import { must } from '@flyingrobots/bijou/adapters/test';

describe('docs preview app', () => {
  afterEach(() => { _resetDefaultContextForTesting(); });

  it('uses the checked-in FlyingRobots logo asset on roomy landing screens', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 320, rows: 80, refreshRate: 60 } });
    const app = createDocsApp(ctx);

    const initial = await runScript(app, [], { ctx });
    const frame = must(initial.frames[0]);
    const text = frameText(frame);
    const lines = text.split('\n');
    const logoLines = FLYING_ROBOTS_LOGO_TEXT.split(/\r?\n/);
    const [firstLogoLine = ''] = logoLines;
    const transparentOffset = firstLogoLine.indexOf(FLYING_ROBOTS_TRANSPARENT_CELL);
    const visiblePrefix = firstLogoLine.slice(0, transparentOffset);
    const logoY = lines.findIndex((line) => line.includes(visiblePrefix));
    const logoX = logoY >= 0 ? must(lines[logoY]).indexOf(visiblePrefix) : -1;
    const background = bareBookLandingBackground(frame.width, frame.height);

    expect(transparentOffset).toBeGreaterThan(0);
    expect(visiblePrefix.length).toBeGreaterThan(8);
    expect(logoY).toBeGreaterThanOrEqual(0);
    expect(logoX).toBeGreaterThanOrEqual(0);
    for (let y = 0; y < logoLines.length; y++) {
      const logoLine = Array.from(logoLines[y] ?? '');
      for (let x = 0; x < logoLine.length; x++) {
        const char = logoLine[x];
        if (char === ' ' || char === FLYING_ROBOTS_TRANSPARENT_CELL) continue;
        const cell = frame.get(logoX + x, logoY + y);
        expect(cell.char).toBe(char);
        expect(colorHex(cell.bg)).toBe(BOOK_MODE_COLORS.dark.background);
        expect(colorHex(cell.fg)).toBe(oppositeHexColor(BOOK_MODE_COLORS.dark.background));
      }
    }
    const hole = frame.get(logoX + transparentOffset, logoY);
    const underlying = background.get(logoX + transparentOffset, logoY);
    expect(hole.char).toBe(underlying.char);
    expect(colorHex(hole.fg)).toBe(colorHex(underlying.fg));
    expect(colorHex(hole.bg)).toBe(colorHex(underlying.bg));
    expect(hole.modifiers ?? []).not.toContain('bold');
    expect(text).not.toContain('8""""');
  });
});

describe('docs preview app', () => {
  afterEach(() => { _resetDefaultContextForTesting(); });

  it('fades the FlyingRobots logo after the first three seconds', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 320, rows: 80, refreshRate: 60 } });
    const app = createDocsApp(ctx);
    const logoLines = FLYING_ROBOTS_LOGO_TEXT.split(/\r?\n/);
    const [firstLogoLine = ''] = logoLines;
    const visiblePrefix = firstLogoLine.slice(0, firstLogoLine.indexOf(FLYING_ROBOTS_TRANSPARENT_CELL));

    const initial = await runScript(app, [], { ctx });
    const faded = await runScript(app, [{ pulse: { dt: 4.2 } }], { ctx });

    expect(visiblePrefix.length).toBeGreaterThan(8);
    expect(frameText(must(initial.frames[0]))).toContain(visiblePrefix);
    expect(frameText(must(faded.frames.at(-1)))).not.toContain(visiblePrefix);
  });
});
