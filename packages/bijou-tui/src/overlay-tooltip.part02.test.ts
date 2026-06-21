import { describe, it, expect } from 'vitest';
import { must, createTestContext } from '@flyingrobots/bijou/adapters/test';
import { stringToSurface, surfaceToString } from '@flyingrobots/bijou';
import { tooltip } from './overlay.js';
import { visibleLength, stripAnsi } from './viewport.js';

function expectSurfaceTextMatch(actualSurfaceText: string, expectedContent: string) {
  expect(
    stripAnsi(actualSurfaceText).split('\n').map((line) => line.trimEnd()),
  ).toEqual(
    stripAnsi(expectedContent).split('\n').map((line) => line.trimEnd()),
  );
}

describe('tooltip', () => {
  const base = { content: 'hint', screenWidth: 80, screenHeight: 24 };

  it('provides a surface that matches its rendered content', () => {
      const ctx = createTestContext();
      const result = tooltip({ ...base, row: 10, col: 40, ctx });
      expect(result.surface).toBeDefined();
      expectSurfaceTextMatch(surfaceToString(must(result.surface), ctx.style), result.content);
    });

  it('accepts structured surface content', () => {
      const ctx = createTestContext();
      const result = tooltip({
        content: stringToSurface('line1\nline2', 5, 2),
        row: 10,
        col: 40,
        screenWidth: 80,
        screenHeight: 24,
        ctx,
      });
      expect(stripAnsi(result.content)).toContain('line1');
      expect(stripAnsi(result.content)).toContain('line2');
      expectSurfaceTextMatch(surfaceToString(must(result.surface), ctx.style), result.content);
    });

  it('clips structured surface content to screen width', () => {
      const result = tooltip({
        content: stringToSurface('ABCDEFG', 7, 1),
        row: 10,
        col: 0,
        screenWidth: 6,
        screenHeight: 24,
        direction: 'right',
      });
      for (const line of result.content.split('\n')) {
        expect(visibleLength(stripAnsi(line))).toBeLessThanOrEqual(6);
      }
      expect(stripAnsi(result.content)).toContain('AB');
      expect(stripAnsi(result.content)).not.toContain('CDEFG');
    });
});
