import { describe, it, expect } from 'vitest';
import { must, createTestContext } from '@flyingrobots/bijou/adapters/test';
import { surfaceToString } from '@flyingrobots/bijou';
import { toast } from './overlay.js';
import { stripAnsi } from './viewport.js';

function expectSurfaceTextMatch(actualSurfaceText: string, expectedContent: string) {
  expect(
    stripAnsi(actualSurfaceText).split('\n').map((line) => line.trimEnd()),
  ).toEqual(
    stripAnsi(expectedContent).split('\n').map((line) => line.trimEnd()),
  );
}

describe('toast', () => {
  it('provides a surface that matches its rendered content', () => {
      const ctx = createTestContext();
      const result = toast({ message: 'saved', variant: 'success', screenWidth: 80, screenHeight: 24, ctx });
      expect(result.surface).toBeDefined();
      expectSurfaceTextMatch(surfaceToString(must(result.surface), ctx.style), result.content);
    });

  it('applies semantic styling directly to toast text cells', () => {
      const ctx = createTestContext({ mode: 'interactive' });
      const result = toast({
        message: 'Boom',
        variant: 'error',
        screenWidth: 80,
        screenHeight: 24,
        ctx,
      });
      expect(result.surface).toBeDefined();
      expect(must(result.surface).get(2, 1).fg).toBe(ctx.semantic('error').hex);
    });
});
