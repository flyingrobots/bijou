import { describe, expect, it } from 'vitest';
import { constrain } from './constrain.js';
import { createTestContext } from '../../adapters/test/index.js';
import { graphemeWidth } from '../text/grapheme.js';

// Specification (flyingrobots/bijou#678): truncation never splits a wide
// character (UAX #11 W or F, two cells). constrain() replaces the clipped tail
// with the ellipsis "…", which is UAX #11 Ambiguous and one cell under Bijou's
// narrow Ambiguous policy, so the content budget is maxWidth - 1 cells.
// Expected values are counted by hand: narrow 1 cell, wide 2 cells.
//
// The case where a wide character meets the budget with exactly one cell left
// is a known defect, flyingrobots/bijou#851: the truncated line
// comes out one cell short instead of being padded. The repository has no
// expected-failure mechanism, so that case lives in the issue and the pull
// request description, not in this suite.

const MODES = ['interactive', 'static'] as const;

describe.each(MODES)('constrain truncation with wide characters (%s)', (mode) => {
  const ctx = createTestContext({ mode });

  it('leaves a mixed narrow/wide line that fits exactly unchanged', () => {
    // a b (2) + 漢 字 (4) + c d (2) = 8 cells at maxWidth 8.
    expect(constrain('ab漢字cd', { maxWidth: 8, ctx })).toBe('ab漢字cd');
    // ホーム (6) + ｶﾅ (2, halfwidth) = 8 cells at maxWidth 8.
    expect(constrain('ホームｶﾅ', { maxWidth: 8, ctx })).toBe('ホームｶﾅ');
  });

  it('truncates a line that overflows by one cell where the last character is wide', () => {
    // a b c 漢 字 = 7 cells, one over 6. Budget 5 holds a b c 漢 exactly,
    // then the one-cell ellipsis: abc漢… = 6 cells.
    expect(constrain('abc漢字', { maxWidth: 6, ctx })).toBe('abc漢…');
    // 설정을 = 6 cells over maxWidth 5: budget 4 holds 설정, then …: 5 cells.
    expect(constrain('설정을', { maxWidth: 5, ctx })).toBe('설정…');
  });

  it('truncates a line of only wide characters at an odd width', () => {
    // 漢字仮名 = 8 cells over maxWidth 5: budget 4 holds 漢字, then …: 5 cells.
    expect(constrain('漢字仮名', { maxWidth: 5, ctx })).toBe('漢字…');
    // ＡＢＣＤ (fullwidth Latin, F) = 8 cells over maxWidth 7: budget 6 → ＡＢＣ…
    expect(constrain('ＡＢＣＤ', { maxWidth: 7, ctx })).toBe('ＡＢＣ…');
  });

  it('keeps the ellipsis alone at width 1 rather than half a wide character', () => {
    // maxWidth 1 equals the ellipsis width: the ellipsis alone is 1 cell.
    expect(constrain('漢字', { maxWidth: 1, ctx })).toBe('…');
  });

  it('never returns a line wider than maxWidth', () => {
    const text = 'Bijou は日本語と한국어를 표시합니다';
    for (let maxWidth = 1; maxWidth <= 40; maxWidth++) {
      const result = constrain(text, { maxWidth, ctx });
      expect(graphemeWidth(result)).toBeLessThanOrEqual(maxWidth);
    }
  });
});
