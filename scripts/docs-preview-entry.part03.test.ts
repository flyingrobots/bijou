
import {
  afterEach,
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
  oppositeHexColor,
  runScript,
  V7_DEFAULT_BACKGROUND,
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
    let wakeBackedLogoCell: { readonly x: number; readonly y: number } | undefined;
    let backgroundBackedLogoCell: { readonly x: number; readonly y: number } | undefined;

    expect(transparentOffset).toBeGreaterThan(0);
    expect(visiblePrefix.length).toBeGreaterThan(8);
    expect(logoY).toBeGreaterThanOrEqual(0);
    expect(logoX).toBeGreaterThanOrEqual(0);
    for (let y = 0; y < logoLines.length; y++) {
      const logoLine = Array.from(logoLines[y] ?? '');
      for (let x = 0; x < logoLine.length; x++) {
        const char = logoLine[x];
        if (char === ' ' || char === FLYING_ROBOTS_TRANSPARENT_CELL) continue;
        const targetX = logoX + x;
        const targetY = logoY + y;
        const bg = expectedLandingWakeColorAt(targetX, targetY, frame.width, frame.height);
        if (bg !== V7_DEFAULT_BACKGROUND) {
          wakeBackedLogoCell = { x: targetX, y: targetY };
        } else {
          backgroundBackedLogoCell = { x: targetX, y: targetY };
        }
        if (wakeBackedLogoCell != null && backgroundBackedLogoCell != null) {
          break;
        }
      }
      if (wakeBackedLogoCell != null && backgroundBackedLogoCell != null) break;
    }
    expect(wakeBackedLogoCell).toBeDefined();
    const wakeCell = must(wakeBackedLogoCell);
    const wakeBackedBg = expectedLandingWakeColorAt(
      wakeCell.x,
      wakeCell.y,
      frame.width,
      frame.height,
    );
    expect(colorHex(frame.get(wakeCell.x, wakeCell.y).bg)).toBe(wakeBackedBg);
    expect(colorHex(frame.get(wakeCell.x, wakeCell.y).fg)).toBe(
      oppositeHexColor(wakeBackedBg),
    );
    expect(backgroundBackedLogoCell).toBeDefined();
    const backgroundCell = must(backgroundBackedLogoCell);
    expect(colorHex(frame.get(backgroundCell.x, backgroundCell.y).bg)).toBe(V7_DEFAULT_BACKGROUND);
    expect(colorHex(frame.get(backgroundCell.x, backgroundCell.y).fg)).toBe(
      oppositeHexColor(V7_DEFAULT_BACKGROUND),
    );
    expect(frame.get(logoX + transparentOffset, logoY).char).not.toBe(FLYING_ROBOTS_TRANSPARENT_CELL);
    expect(frame.get(logoX + transparentOffset, logoY).modifiers ?? []).not.toContain('bold');
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
