
import {
  afterEach,
  colorHex,
  createDocsApp,
  createTestContext,
  describe,
  expectedBijouLogoYOffset,
  expectedBijouSvgOverlay,
  expectedStackedWakeChar,
  expect,
  frameText,
  it,
  matchingBijouSvgOverlayGlyphCount,
  bijouSvgOverlayMetrics,
  runScript,
  serializeFrame,
  stackedWakeRowCount,
  titleBackgroundGlyphCount,
  V7_DEFAULT_BACKGROUND,
  V7_RASTER_TITLE_GLYPHS,
  _resetDefaultContextForTesting,
} from './docs-preview.test-support.js';

import { must } from '@flyingrobots/bijou/adapters/test';

describe('docs preview app', () => {
afterEach(() => { _resetDefaultContextForTesting(); });

it('renders a stacked sine-wave V7 title wake with the Bijou SVG overlay', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40, refreshRate: 60 } });
    const app = createDocsApp(ctx);

    const initial = await runScript(app, [], { ctx });
    const pulsed = await runScript(app, [{ pulse: { dt: 0.35 } }], { ctx });

    const initialText = frameText(must(initial.frames[0]));
    const pulsedText = frameText(must(pulsed.frames[pulsed.frames.length - 1]));

    expect(titleBackgroundGlyphCount(initialText)).toBeGreaterThan(1000);
    expect(titleBackgroundGlyphCount(pulsedText)).toBeGreaterThan(1000);
    expect(stackedWakeRowCount(must(initial.frames[0]))).toBeGreaterThan(12);
    expect(stackedWakeRowCount(must(pulsed.frames[pulsed.frames.length - 1]))).toBeGreaterThan(12);
    const overlay = matchingBijouSvgOverlayGlyphCount(must(initial.frames[0]), 0);
    expect(overlay.expected).toBeGreaterThan(450);
    expect(overlay.matched).toBeGreaterThan(Math.floor(overlay.expected * 0.85));
    const metrics = bijouSvgOverlayMetrics(initial.frames[0]?.width, initial.frames[0]?.height);
    let sameColorWakeCells = 0;
    for (let y = 0; y < initial.frames[0]?.height; y++) {
      for (let x = 0; x < initial.frames[0]?.width; x++) {
        if (
          x >= metrics.left
          && x < metrics.left + metrics.columns
          && y >= metrics.top
          && y < metrics.top + metrics.rows
        ) {
          continue;
        }
        const cell = initial.frames[0]?.get(x, y);
        if (!V7_RASTER_TITLE_GLYPHS.has(cell.char)) continue;
        if (colorHex(cell.bg) === V7_DEFAULT_BACKGROUND) continue;
        if (colorHex(cell.fg) !== colorHex(cell.bg)) continue;
        sameColorWakeCells++;
      }
    }
    expect(sameColorWakeCells).toBeGreaterThan(400);
    expect(serializeFrame(must(initial.frames[0]))).not.toEqual(serializeFrame(must(pulsed.frames[pulsed.frames.length - 1])));
  });
});

describe('docs preview app', () => {
afterEach(() => { _resetDefaultContextForTesting(); });

it('uses the Bijou SVG as a transparent-background title mask', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40, refreshRate: 60 } });
    const app = createDocsApp(ctx);

    const initial = await runScript(app, [], { ctx });
    const frame = must(initial.frames[0]);
    const overlay = expectedBijouSvgOverlay(frame.width, frame.height);
    const paintedPathCell = { x: overlay.left, y: overlay.top };
    const transparentMaskCell = { x: overlay.left + 15, y: overlay.top };

    expect(overlay.mask.get(0, 0).char).toBe('▓');
    expect(overlay.mask.get(15, 0).char).toBe(' ');
    expect(frame.get(paintedPathCell.x, paintedPathCell.y).char).toBe(overlay.mask.get(0, 0).char);
    expect(frame.get(transparentMaskCell.x, transparentMaskCell.y).char).toBe(
      expectedStackedWakeChar(transparentMaskCell.x, transparentMaskCell.y, frame.width),
    );
    expect(colorHex(frame.get(paintedPathCell.x, paintedPathCell.y).fg)).not.toBeNull();
    expect(colorHex(frame.get(transparentMaskCell.x, transparentMaskCell.y).fg)).not.toBeNull();
  });
});

describe('docs preview app', () => {
afterEach(() => { _resetDefaultContextForTesting(); });

it('animates the Bijou SVG title mask with staggered row and fill waves', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40, refreshRate: 60 } });
    const app = createDocsApp(ctx);
    const pulseMs = 352;

    const initial = await runScript(app, [], { ctx });
    const pulsed = await runScript(app, [{ pulse: { dt: pulseMs / 1000 } }], { ctx });
    const initialFrame = must(initial.frames[0]);
    const pulsedFrame = must(pulsed.frames.at(-1));
    const overlay = expectedBijouSvgOverlay(initialFrame.width, initialFrame.height);
    const sampleX = 0;
    const sampleY = 0;
    const expectedChar = overlay.mask.get(sampleX, sampleY).char;
    const initialY = overlay.top + expectedBijouLogoYOffset(sampleX, overlay.mask.width, 0);
    const pulsedY = overlay.top + expectedBijouLogoYOffset(sampleX, overlay.mask.width, pulseMs);

    expect(expectedChar).not.toBe(' ');
    expect(initialY).not.toBe(pulsedY);
    expect(initialFrame.get(overlay.left + sampleX, initialY).char).toBe(expectedChar);
    expect(pulsedFrame.get(overlay.left + sampleX, pulsedY).char).toBe(expectedChar);
    expect(colorHex(initialFrame.get(overlay.left + sampleX, initialY).fg)).not.toBe(
      colorHex(pulsedFrame.get(overlay.left + sampleX, pulsedY).fg),
    );
  });
});
