import { describe, expect, it } from 'vitest';
import { CELL_STRIDE, packCell, packedCellsEqual, packedCellsEqualCross, packedStyleEqual, FLAG_BOLD } from './packed-cell.js';

describe('packed-cell encoding', () => {
  describe('packedCellsEqual', () => {
      it('detects identical cells', () => {
        const buf = new Uint8Array(CELL_STRIDE * 2);
        packCell(buf, 0, 65, 255, 0, 0, true, 0, 0, 0, false, FLAG_BOLD, 63);
        packCell(buf, 1, 65, 255, 0, 0, true, 0, 0, 0, false, FLAG_BOLD, 63);
        expect(packedCellsEqual(buf, 0, 1)).toBe(true);
      });
      it('detects different cells', () => {
        const buf = new Uint8Array(CELL_STRIDE * 2);
        packCell(buf, 0, 65, 255, 0, 0, true, 0, 0, 0, false, FLAG_BOLD, 63);
        packCell(buf, 1, 66, 255, 0, 0, true, 0, 0, 0, false, FLAG_BOLD, 63);
        expect(packedCellsEqual(buf, 0, 1)).toBe(false);
      });
    });

  describe('packedCellsEqualCross', () => {
      it('compares cells across two buffers', () => {
        const a = new Uint8Array(CELL_STRIDE);
        const b = new Uint8Array(CELL_STRIDE);
        packCell(a, 0, 65, 255, 0, 0, true, 0, 0, 0, false, 0, 63);
        packCell(b, 0, 65, 255, 0, 0, true, 0, 0, 0, false, 0, 63);
        expect(packedCellsEqualCross(a, 0, b, 0)).toBe(true);
      });
    });

  describe('packedStyleEqual', () => {
      it('matches cells with same style but different char', () => {
        const buf = new Uint8Array(CELL_STRIDE * 2);
        packCell(buf, 0, 65, 255, 0, 0, true, 0, 0, 0, false, FLAG_BOLD, 63);
        packCell(buf, 1, 66, 255, 0, 0, true, 0, 0, 0, false, FLAG_BOLD, 63);
        expect(packedStyleEqual(buf, 0, 1)).toBe(true);
      });
      it('rejects cells with different fg', () => {
        const buf = new Uint8Array(CELL_STRIDE * 2);
        packCell(buf, 0, 65, 255, 0, 0, true, 0, 0, 0, false, 0, 63);
        packCell(buf, 1, 65, 0, 255, 0, true, 0, 0, 0, false, 0, 63);
        expect(packedStyleEqual(buf, 0, 1)).toBe(false);
      });
    });
});
