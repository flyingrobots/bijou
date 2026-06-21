import {
  afterEach,
  cellsWithoutBackground,
  colorHex,
  createDocsApp,
  createTestContext,
  describe,
  expectedLandingWakeColorAt,
  expect,
  FLYING_ROBOTS_LOGO_TEXT,
  FLYING_ROBOTS_TRANSPARENT_CELL,
  frameText,
  it,
  KEY_ESCAPE,
  oppositeHexColor,
  runScript,
  V7_DEFAULT_BACKGROUND,
  _resetDefaultContextForTesting,
} from './docs-preview.test-support.js';

import { must } from '@flyingrobots/bijou/adapters/test';

describe('docs preview app', () => {
  afterEach(() => { _resetDefaultContextForTesting(); });

  it('uses a foreground gradient across the Enter prompt letters', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 160, rows: 48, refreshRate: 60 } });
    const app = createDocsApp(ctx);

    const initial = await runScript(app, [], { ctx });
    const frame = must(initial.frames[0]);
    const lines = frameText(frame).split('\n');
    const promptY = lines.findIndex((line) => line.includes('Press [Enter]'));
    const promptX = promptY >= 0 ? must(lines[promptY]).indexOf('Press [Enter]') : -1;
    const prompt = 'Press [Enter]';
    const enterStart = prompt.indexOf('Enter');

    expect(promptY).toBeGreaterThanOrEqual(0);
    expect(promptX).toBeGreaterThanOrEqual(0);

    const enterColors = Array.from('Enter').map((_char, offset) => (
      colorHex(frame.get(promptX + enterStart + offset, promptY).fg)
    ));
    const bodyColor = colorHex(frame.get(promptX, promptY).fg);

    expect(new Set(enterColors).size).toBeGreaterThan(1);
    expect(enterColors).not.toContain(bodyColor);
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
    let wakeBackedLogoCell: { readonly x: number; readonly y: number } | undefined;

    expect(text).toContain('Quit?');
    expect(logoY).toBeGreaterThanOrEqual(0);
    expect(logoX).toBeGreaterThanOrEqual(0);
    for (let y = 0; y < logoLines.length; y++) {
      const logoLine = Array.from(logoLines[y] ?? '');
      for (let x = 0; x < logoLine.length; x++) {
        const char = logoLine[x];
        if (char === ' ' || char === FLYING_ROBOTS_TRANSPARENT_CELL) continue;
        const targetX = logoX + x;
        const targetY = logoY + y;
        if (expectedLandingWakeColorAt(targetX, targetY, frame.width, frame.height) !== V7_DEFAULT_BACKGROUND) {
          wakeBackedLogoCell = { x: targetX, y: targetY };
          break;
        }
      }
      if (wakeBackedLogoCell != null) break;
    }

    expect(wakeBackedLogoCell).toBeDefined();
    const wakeCell = must(wakeBackedLogoCell);
    const cell = frame.get(wakeCell.x, wakeCell.y);
    const wakeBackedBg = expectedLandingWakeColorAt(
      wakeCell.x,
      wakeCell.y,
      frame.width,
      frame.height,
    );
    expect(colorHex(cell.bg)).toBe(wakeBackedBg);
    expect(colorHex(cell.fg)).toBe(oppositeHexColor(wakeBackedBg));
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
