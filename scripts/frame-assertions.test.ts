import { describe, expect, it } from 'vitest';
import { createSurface } from '@flyingrobots/bijou';
import { plainStyle } from '@flyingrobots/bijou/adapters/test';
import {
  assertFrameWidth,
  cropSurfaceFrame,
  findFrameContainingAll,
  renderFrameText,
} from './frame-assertions.js';

describe('frame assertions helpers', () => {
  it('crops empty frame borders while preserving interior spacing', () => {
    const frame = createSurface(8, 5);
    frame.set(3, 1, { char: 'A', empty: false });
    frame.set(4, 1, { char: 'B', empty: false });
    frame.set(3, 2, { char: ' ', bg: '#112233', empty: false });

    const cropped = cropSurfaceFrame(frame, 1);

    expect(cropped.width).toBe(4);
    expect(cropped.height).toBe(4);
    expect(renderFrameText(cropped, plainStyle())).toContain('AB');
  });

  it('locates the first frame containing all requested snippets', () => {
    const index = findFrameContainingAll(
      ['home\nready', 'split\nready', 'quit\nopen'],
      ['split', 'ready'],
    );

    expect(index).toBe(1);
  });

  it('throws when a frame line does not match the expected width', () => {
    expect(() => assertFrameWidth('abcd\nabc', 4)).toThrow(/line 1/);
  });
});
