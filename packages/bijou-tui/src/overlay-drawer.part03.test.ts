import { describe, it, expect } from 'vitest';
import { must, createTestContext } from '@flyingrobots/bijou/adapters/test';
import { stringToSurface, surfaceToString } from '@flyingrobots/bijou';
import { drawer } from './overlay.js';
import { stripAnsi } from './viewport.js';

function expectSurfaceTextMatch(actualSurfaceText: string, expectedContent: string) {
  expect(
    stripAnsi(actualSurfaceText).split('\n').map((line) => line.trimEnd()),
  ).toEqual(
    stripAnsi(expectedContent).split('\n').map((line) => line.trimEnd()),
  );
}

describe('drawer', () => {
  it('accepts structured surface content', () => {
      const ctx = createTestContext();
      const result = drawer({
        content: stringToSurface('first\nsecond', 6, 2),
        width: 20,
        screenWidth: 80,
        screenHeight: 6,
        ctx,
      });
      expect(stripAnsi(result.content)).toContain('first');
      expect(stripAnsi(result.content)).toContain('second');
      expectSurfaceTextMatch(surfaceToString(must(result.surface), ctx.style), result.content);
    });

  it('clips structured surface content to the drawer inner width', () => {
      const result = drawer({
        content: stringToSurface('ABCDEFG', 7, 1),
        width: 8,
        screenWidth: 80,
        screenHeight: 5,
      });
      expect(stripAnsi(result.content)).toContain('ABCD');
      expect(stripAnsi(result.content)).not.toContain('EFG');
    });

  it('keeps background fill on drawer text cells in the returned surface', () => {
      const ctx = createTestContext({ mode: 'interactive' });
      const result = drawer({
        content: 'panel',
        width: 20,
        screenWidth: 80,
        screenHeight: 5,
        bgToken: { hex: '#ffffff', bg: '#003366' },
        ctx,
      });
      expect(result.surface).toBeDefined();
      expect(must(result.surface).get(2, 1).char).toBe('p');
      expect(must(result.surface).get(2, 1).bg).toBe('#003366');
    });
});
