import { describe, it, expect } from 'vitest';
import { must, createTestContext } from '@flyingrobots/bijou/adapters/test';
import { stringToSurface, surfaceToString } from '@flyingrobots/bijou';
import { modal } from './overlay.js';
import { stripAnsi } from './viewport.js';

function expectSurfaceTextMatch(actualSurfaceText: string, expectedContent: string) {
  expect(
    stripAnsi(actualSurfaceText).split('\n').map((line) => line.trimEnd()),
  ).toEqual(
    stripAnsi(expectedContent).split('\n').map((line) => line.trimEnd()),
  );
}

describe('modal', () => {
  it('bgToken without ctx is ignored', () => {
      const plain = modal({ body: 'X', screenWidth: 40, screenHeight: 20 });
      const withToken = modal({
        body: 'X',
        screenWidth: 40,
        screenHeight: 20,
        bgToken: { hex: '#ffffff', bg: '#003366' },
      });
      expect(stripAnsi(withToken.content)).toBe(stripAnsi(plain.content));
    });

  it('bgToken with noColor is no-op', () => {
      const ctx = createTestContext({ mode: 'interactive', noColor: true });
      const noColorResult = modal({
        body: 'NoBg',
        screenWidth: 40,
        screenHeight: 20,
        bgToken: { hex: '#ffffff', bg: '#003366' },
        ctx,
      });
      const plain = modal({ body: 'NoBg', screenWidth: 40, screenHeight: 20 });
      expect(stripAnsi(noColorResult.content)).toBe(stripAnsi(plain.content));
    });

  it('provides a surface that matches its rendered content', () => {
      const ctx = createTestContext();
      const result = modal({ title: 'Title', body: 'Body', hint: 'Hint', screenWidth: 40, screenHeight: 20, ctx });
      expect(result.surface).toBeDefined();
      expectSurfaceTextMatch(surfaceToString(must(result.surface), ctx.style), result.content);
    });

  it('accepts structured surface body and hint content', () => {
      const ctx = createTestContext();
      const result = modal({
        title: 'Title',
        body: stringToSurface('line1\nline2', 5, 2),
        hint: stringToSurface('Press q', 7, 1),
        screenWidth: 40,
        screenHeight: 20,
        ctx,
      });
      expect(stripAnsi(result.content)).toContain('line1');
      expect(stripAnsi(result.content)).toContain('line2');
      expect(stripAnsi(result.content)).toContain('Press q');
      expectSurfaceTextMatch(surfaceToString(must(result.surface), ctx.style), result.content);
    });

  it('keeps background fill on modal text cells in the returned surface', () => {
      const ctx = createTestContext({ mode: 'interactive' });
      const result = modal({
        body: 'Filled',
        screenWidth: 40,
        screenHeight: 20,
        bgToken: { hex: '#ffffff', bg: '#003366' },
        ctx,
      });
      expect(result.surface).toBeDefined();
      expect(result.surface?.get(2, 1).char).toBe('F');
      expect(result.surface?.get(2, 1).bg).toBe('#003366');
    });
});
