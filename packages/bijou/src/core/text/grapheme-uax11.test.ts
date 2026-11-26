import { describe, expect, it } from 'vitest';
import { graphemeClusterWidth, graphemeWidth, isWideChar } from './grapheme.js';

// flyingrobots/bijou#860: the wide table follows UAX #11 (EastAsianWidth.txt
// 18.0.0). W and F are two cells; A, N, Na and H are one cell.
const hex = (cp: number): string => `U+${cp.toString(16).toUpperCase()}`;
const width = (cp: number): number => graphemeClusterWidth(String.fromCodePoint(cp));

describe('UAX #11 Wide and Fullwidth code points measure two cells', () => {
  it.each([
    ['U+231A watch', 0x231a],
    ['U+2615 hot beverage', 0x2615],
    ['U+2648 Aries', 0x2648],
    ['U+267F wheelchair symbol', 0x267f],
    ['U+2705 check mark button', 0x2705],
    ['U+2B50 white medium star', 0x2b50],
    ['U+A000 Yi syllable it', 0xa000],
    ['U+A4C6 Yi radical ke', 0xa4c6],
    ['U+16FE0 Tangut iteration mark', 0x16fe0],
    ['U+17000 Tangut ideograph', 0x17000],
    ['U+18B00 Khitan small script character', 0x18b00],
    ['U+1B000 katakana letter archaic e', 0x1b000],
    ['U+1B170 Nushu character', 0x1b170],
    ['U+1F004 mahjong tile red dragon', 0x1f004],
    ['U+1F201 squared katakana koko', 0x1f201],
    ['U+1F6D1 octagonal sign', 0x1f6d1],
  ])('%s is wide', (_label, cp) => {
    expect(isWideChar(cp), hex(cp)).toBe(true);
    expect(width(cp), hex(cp)).toBe(2);
  });

  it('keeps a row of watch emoji two cells apiece', () => {
    expect(graphemeWidth('⌚⌛☔☕')).toBe(8);
  });
});

describe('code points that are not UAX #11 Wide or Fullwidth measure one cell', () => {
  it('measures the Ambiguous circled numbers U+3248..U+324F as one cell (narrow policy)', () => {
    for (let cp = 0x3248; cp <= 0x324f; cp += 1) {
      expect(isWideChar(cp), hex(cp)).toBe(false);
      expect(width(cp), hex(cp)).toBe(1);
    }
  });

  it.each([
    ['U+303F ideographic half fill space (N)', 0x303f],
    ['U+1F000 mahjong tile east wind (N)', 0x1f000],
    ['U+1F321 thermometer (N, text presentation)', 0x1f321],
    ['U+1F336 hot pepper (N, text presentation)', 0x1f336],
    ['U+1F57D right hand telephone receiver (N)', 0x1f57d],
  ])('%s is narrow', (_label, cp) => {
    expect(isWideChar(cp), hex(cp)).toBe(false);
    expect(width(cp), hex(cp)).toBe(1);
  });

  it('still measures a text-presentation emoji with VS16 as two cells', () => {
    expect(graphemeClusterWidth('\u{1F321}\uFE0F')).toBe(2);
    expect(graphemeClusterWidth('\u{1F336}\uFE0F')).toBe(2);
  });
});

describe('emoji rules the table does not change', () => {
  it('keeps regional indicators wide so a flag is two cells', () => {
    expect(isWideChar(0x1f1e6)).toBe(true);
    expect(isWideChar(0x1f1ff)).toBe(true);
    expect(graphemeClusterWidth('🇯🇵')).toBe(2);
  });

  it('keeps ZWJ, skin-tone and keycap sequences two cells', () => {
    expect(graphemeClusterWidth('👩‍💻')).toBe(2);
    expect(graphemeClusterWidth('👍🏽')).toBe(2);
    expect(graphemeClusterWidth('1️⃣')).toBe(2);
  });
});
