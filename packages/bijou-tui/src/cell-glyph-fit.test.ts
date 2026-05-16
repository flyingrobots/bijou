import { describe, expect, it } from 'vitest';
import {
  CELL_GLYPH_ASCII_DENSITY_RAMP,
  fitCellGlyph,
  type CellGlyphCandidate,
} from './cell-glyph-fit.js';

describe('fitCellGlyph()', () => {
  it('chooses a full block for full coverage', () => {
    expect(fitCellGlyph([1, 1, 1, 1, 1, 1, 1, 1])).toBe('█');
  });

  it('chooses an upper-half block for top-half coverage', () => {
    expect(fitCellGlyph([1, 1, 1, 1, 0, 0, 0, 0])).toBe('▀');
  });

  it('chooses a diagonal glyph for diagonal coverage', () => {
    expect(fitCellGlyph([0, 1, 0, 1, 1, 0, 1, 0])).toBe('╱');
  });

  it('honors exact custom candidate matches', () => {
    const candidates: readonly CellGlyphCandidate[] = [
      { char: 'A', coverage: [1, 0, 1, 0, 1, 0, 1, 0] },
      { char: 'B', coverage: [0, 1, 0, 1, 0, 1, 0, 1] },
    ];

    expect(fitCellGlyph([0, 1, 0, 1, 0, 1, 0, 1], { candidates })).toBe('B');
  });

  it('uses only the ASCII density ramp in ascii mode', () => {
    const glyph = fitCellGlyph([1, 1, 1, 0, 0, 0, 0, 0], { mode: 'ascii' });

    expect(CELL_GLYPH_ASCII_DENSITY_RAMP).toContain(glyph);
    expect(glyph.charCodeAt(0)).toBeLessThan(128);
  });
});
