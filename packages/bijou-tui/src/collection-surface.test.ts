import { describe, expect, it } from 'vitest';
import { collectionRowsSurface } from './collection-surface.js';

function surfaceRowText(width: number, elapsedMs: number): string {
  const surface = collectionRowsSurface(['abcdef'], {
    width,
    selectedRowIndex: 0,
    selectedRowOverflow: {
      mode: 'marquee',
      elapsedMs,
      stepMs: 220,
      startDelayMs: 0,
      endDelayMs: 0,
    },
  });

  let text = '';
  for (let x = 0; x < surface.width; x++) {
    text += surface.get(x, 0).char;
  }
  return text;
}

describe('collectionRowsSurface', () => {
  it('marquees selected rows forward and backward with stable gutter geometry', () => {
    expect(surfaceRowText(6, 0)).toBe(' abcd ');
    expect(surfaceRowText(6, 220)).toBe(' bcde ');
    expect(surfaceRowText(6, 440)).toBe(' cdef ');
    expect(surfaceRowText(6, 660)).toBe(' cdef ');
    expect(surfaceRowText(6, 880)).toBe(' bcde ');
  });
});
