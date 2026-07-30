import { describe, expect, it } from 'vitest';
import { createSurface } from './surface.js';

describe('Surface.blit', () => {
  it('preserves source alignment when clipping a negative source origin', () => {
    const source = createSurface(4, 1);
    source.setRow(0, [
      { char: 'A' },
      { char: 'B' },
      { char: 'C' },
      { char: 'D' },
    ]);
    const target = createSurface(4, 1, { char: '.', empty: false });

    target.blit(source, 0, 0, -2, 0, 4, 1);

    expect(target.getRow(0).map((cell) => cell.char)).toEqual([
      '.',
      '.',
      'A',
      'B',
    ]);
  });
});
