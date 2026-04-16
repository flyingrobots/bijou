import { describe, expect, it } from 'vitest';
import { createSurface, perfOverlaySurface, stripAnsi, surfaceToString, type Surface } from '@flyingrobots/bijou';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { debugOverlay } from './debug-overlay.js';

const PERF_STATS = {
  fps: 60,
  frameTimeMs: 16.7,
  frameTimeHistory: [15.8, 16.1, 16.7, 16.4, 17.0],
  width: 80,
  height: 24,
} as const;

function expectOverlayAt(
  background: Surface,
  overlay: Surface,
  result: Surface,
  row: number,
  col: number,
): void {
  for (let y = 0; y < result.height; y++) {
    for (let x = 0; x < result.width; x++) {
      const overlayCell = x >= col && x < col + overlay.width && y >= row && y < row + overlay.height
        ? overlay.get(x - col, y - row)
        : null;
      const expected = overlayCell && !overlayCell.empty ? overlayCell : background.get(x, y);
      expect(result.get(x, y)).toEqual(expected);
    }
  }
}

describe('debugOverlay', () => {
  it('anchors the perf panel in the top-left corner when requested', () => {
    const ctx = createTestContext();
    const background = createSurface(48, 14, { char: '.', empty: false });
    const overlay = perfOverlaySurface(PERF_STATS, { ctx });
    const result = debugOverlay(background, PERF_STATS, { anchor: 'top-left', margin: 0, ctx });

    expectOverlayAt(background, overlay, result, 0, 0);
    expect(stripAnsi(surfaceToString(result, ctx.style))).toContain('Perf');
  });

  it('anchors the perf panel in the top-right corner by default', () => {
    const ctx = createTestContext();
    const background = createSurface(48, 18, { char: '.', empty: false });
    const overlay = perfOverlaySurface(PERF_STATS, { ctx });
    const expectedRow = 1;
    const expectedCol = background.width - overlay.width - 1;
    const result = debugOverlay(background, PERF_STATS, { ctx });

    expectOverlayAt(background, overlay, result, expectedRow, expectedCol);
    expect(stripAnsi(surfaceToString(result, ctx.style))).toContain('Perf');
  });

  it('can dim the background while preserving a custom overlay title', () => {
    const ctx = createTestContext();
    const background = createSurface(40, 12, { char: 'A', empty: false });

    const result = debugOverlay(background, PERF_STATS, {
      anchor: 'top-left',
      margin: 0,
      title: 'Debug',
      dimBackground: true,
      ctx,
    });

    expect(stripAnsi(surfaceToString(result, ctx.style))).toContain('Debug');
    expect(result.get(result.width - 1, result.height - 1).modifiers).toContain('dim');
  });
});
