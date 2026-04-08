import { describe, expect, it } from 'vitest';
import {
  CELL_STRIDE,
  encodeModifiers,
  decodeModifiers,
  parseHex,
  toHex,
  encodeOpacity,
  decodeOpacity,
  encodeChar,
  decodeChar,
  packCell,
  packedCellsEqual,
  packedCellsEqualCross,
  packedStyleEqual,
  FLAG_BOLD,
  FLAG_DIM,
  FLAG_STRIKETHROUGH,
  FLAG_INVERSE,
  FLAG_EMPTY,
  SIDE_TABLE_THRESHOLD,
  OFF_FG_R,
  OFF_ALPHA,
  FLAG_FG_SET,
  FLAG_BG_SET,
  OPACITY_MASK,
} from './packed-cell.js';

describe('packed-cell encoding', () => {
  describe('encodeModifiers / decodeModifiers', () => {
    it('round-trips empty modifiers', () => {
      expect(encodeModifiers(undefined)).toBe(0);
      expect(encodeModifiers([])).toBe(0);
      expect(decodeModifiers(0)).toBeUndefined();
    });

    it('round-trips bold', () => {
      const flags = encodeModifiers(['bold']);
      expect(flags & FLAG_BOLD).toBeTruthy();
      expect(decodeModifiers(flags)).toEqual(['bold']);
    });

    it('round-trips multiple modifiers', () => {
      const flags = encodeModifiers(['bold', 'dim', 'strikethrough', 'inverse']);
      const decoded = decodeModifiers(flags)!;
      expect(decoded).toContain('bold');
      expect(decoded).toContain('dim');
      expect(decoded).toContain('strikethrough');
      expect(decoded).toContain('inverse');
      expect(decoded).toHaveLength(4);
    });

    it('round-trips underline variants', () => {
      expect(decodeModifiers(encodeModifiers(['underline']))).toEqual(['underline']);
      expect(decodeModifiers(encodeModifiers(['curly-underline']))).toEqual(['curly-underline']);
      expect(decodeModifiers(encodeModifiers(['dotted-underline']))).toEqual(['dotted-underline']);
      expect(decodeModifiers(encodeModifiers(['dashed-underline']))).toEqual(['dashed-underline']);
    });

    it('round-trips bold + underline together', () => {
      const flags = encodeModifiers(['bold', 'curly-underline']);
      const decoded = decodeModifiers(flags)!;
      expect(decoded).toContain('bold');
      expect(decoded).toContain('curly-underline');
      expect(decoded).toHaveLength(2);
    });
  });

  describe('parseHex / toHex', () => {
    it('round-trips a hex color', () => {
      const [r, g, b] = parseHex('#ff8800')!;
      expect([r, g, b]).toEqual([255, 136, 0]);
      expect(toHex(r, g, b)).toBe('#ff8800');
    });

    it('round-trips black', () => {
      expect(parseHex('#000000')).toEqual([0, 0, 0]);
      expect(toHex(0, 0, 0)).toBe('#000000');
    });

    it('round-trips white', () => {
      expect(parseHex('#ffffff')).toEqual([255, 255, 255]);
      expect(toHex(255, 255, 255)).toBe('#ffffff');
    });

    it('rejects invalid hex', () => {
      expect(parseHex('red')).toBeUndefined();
      expect(parseHex('#fff')).toBeUndefined();
      expect(parseHex('')).toBeUndefined();
    });
  });

  describe('encodeOpacity / decodeOpacity', () => {
    it('encodes full opacity as 63', () => {
      expect(encodeOpacity(1)).toBe(63);
      expect(encodeOpacity(undefined)).toBe(63);
    });

    it('encodes zero opacity as 0', () => {
      expect(encodeOpacity(0)).toBe(0);
    });

    it('round-trips mid opacity with quantization', () => {
      const encoded = encodeOpacity(0.5);
      const decoded = decodeOpacity(encoded);
      expect(decoded).toBeCloseTo(0.5, 1);
    });

    it('decodes 63 as 1', () => {
      expect(decodeOpacity(63)).toBe(1);
    });
  });

  describe('encodeChar / decodeChar', () => {
    it('encodes BMP characters directly', () => {
      const sideTable: string[] = [];
      expect(encodeChar('A', sideTable)).toBe(65);
      expect(sideTable).toHaveLength(0);
    });

    it('encodes empty string as space', () => {
      expect(encodeChar('', [])).toBe(0x20);
    });

    it('encodes box-drawing characters in BMP', () => {
      const sideTable: string[] = [];
      const code = encodeChar('┌', sideTable);
      expect(code).toBe(0x250C);
      expect(decodeChar(code, sideTable)).toBe('┌');
      expect(sideTable).toHaveLength(0);
    });

    it('encodes emoji via side table', () => {
      const sideTable: string[] = [];
      const code = encodeChar('🎉', sideTable);
      expect(code).toBeGreaterThanOrEqual(SIDE_TABLE_THRESHOLD);
      expect(sideTable).toHaveLength(1);
      expect(decodeChar(code, sideTable)).toBe('🎉');
    });

    it('deduplicates side-table entries', () => {
      const sideTable: string[] = [];
      const code1 = encodeChar('🎉', sideTable);
      const code2 = encodeChar('🎉', sideTable);
      expect(code1).toBe(code2);
      expect(sideTable).toHaveLength(1);
    });

    it('handles multi-codepoint grapheme clusters', () => {
      const sideTable: string[] = [];
      const family = '👨‍👩‍👧‍👦';
      const code = encodeChar(family, sideTable);
      expect(code).toBeGreaterThanOrEqual(SIDE_TABLE_THRESHOLD);
      expect(decodeChar(code, sideTable)).toBe(family);
    });
  });

  describe('packCell', () => {
    it('packs a fully specified cell', () => {
      const buf = new Uint8Array(CELL_STRIDE);
      packCell(buf, 0, 65, 255, 136, 0, true, 0, 0, 0, true, FLAG_BOLD, 63);

      // char = 'A' = 65 = 0x0041
      expect(buf[0]).toBe(0x41);
      expect(buf[1]).toBe(0x00);
      // fg
      expect(buf[2]).toBe(255);
      expect(buf[3]).toBe(136);
      expect(buf[4]).toBe(0);
      // bg
      expect(buf[5]).toBe(0);
      expect(buf[6]).toBe(0);
      expect(buf[7]).toBe(0);
      // flags
      expect(buf[8]).toBe(FLAG_BOLD);
      // alpha: opacity=63, fg_set=1, bg_set=1
      expect(buf[9]! & OPACITY_MASK).toBe(63);
      expect(buf[9]! & FLAG_FG_SET).toBeTruthy();
      expect(buf[9]! & FLAG_BG_SET).toBeTruthy();
    });

    it('packs a cell with no fg/bg', () => {
      const buf = new Uint8Array(CELL_STRIDE);
      packCell(buf, 0, 0x20, 0, 0, 0, false, 0, 0, 0, false, 0, 63);

      expect(buf[OFF_ALPHA]! & FLAG_FG_SET).toBe(0);
      expect(buf[OFF_ALPHA]! & FLAG_BG_SET).toBe(0);
    });
  });

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
