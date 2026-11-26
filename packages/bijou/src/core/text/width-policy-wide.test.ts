import { describe, expect, it } from 'vitest';
import { graphemeClusterWidth, graphemeWidth } from './grapheme.js';
import { wrapToWidth } from './wrap.js';

// The cell widths Bijou layout relies on for the East Asian locales
// (flyingrobots/bijou#678). Each expected width is the UAX #11 class of the
// character: W or F is two cells, H or N one cell; the Ambiguous rule is the
// stated policy below.

describe('East Asian cell widths', () => {
  it('measures Han, kana, precomposed Hangul and fullwidth forms as two cells', () => {
    for (const wide of ['漢', '语', 'あ', 'ア', 'ー', '한', '힣', 'Ａ', '１', '，', '！', '。', '「']) {
      expect(graphemeClusterWidth(wide)).toBe(2);
    }
    // 日本語のテキスト: 8 W characters = 16 cells.
    expect(graphemeWidth('日本語のテキスト')).toBe(16);
  });

  it('measures halfwidth katakana as one cell each', () => {
    // U+FF61..U+FF9F are UAX #11 H (narrow): ｶﾀｶﾅ and the halfwidth ｰ and ﾞ.
    expect(graphemeWidth('ｶﾀｶﾅ')).toBe(4);
    expect(graphemeWidth('ｰ')).toBe(1);
    // ｶ followed by the halfwidth voiced mark ﾞ (U+FF9E) is one grapheme
    // cluster of two cells; grapheme-spacing-units.test.ts holds it
    // (flyingrobots/bijou#855).
  });

  it('gives combining marks no cell of their own', () => {
    // A + U+0300 is one grapheme; か + U+3099 (combining voiced mark) stays 2.
    expect(graphemeWidth('A' + String.fromCharCode(0x300))).toBe(1);
    expect(graphemeWidth('か' + String.fromCharCode(0x3099))).toBe(2);
  });
});

// Hangul written as conjoining jamo is two cells; grapheme-spacing-units.test.ts
// holds it (flyingrobots/bijou#854).

describe('East Asian Ambiguous width policy: narrow', () => {
  // Policy: characters of UAX #11 class A (Ambiguous) take ONE cell. This is
  // the behaviour of terminals outside CJK legacy locales, and box drawing,
  // the ellipsis and Greek and Cyrillic letters all depend on it: a terminal
  // configured to draw Ambiguous characters wide will misalign Bijou output.
  const AMBIGUOUS = ['±', '×', '°', '§', 'α', 'Ω', 'Д', 'ё', '─', '│', '┌', '…', '①', '※'];

  it('measures every listed Ambiguous character as one cell', () => {
    for (const ambiguous of AMBIGUOUS) {
      expect(graphemeClusterWidth(ambiguous)).toBe(1);
    }
    expect(graphemeWidth(AMBIGUOUS.join(''))).toBe(AMBIGUOUS.length);
  });

  it('wraps Ambiguous characters as one cell beside wide ones', () => {
    // ± α … = 3 cells + 漢 = 5 at width 5; 字 (2 more) moves down.
    expect(wrapToWidth('±α…漢字', 5)).toEqual(['±α…漢', '字']);
  });
});
