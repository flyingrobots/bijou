import { describe, expect, it } from 'vitest';
import * as fc from 'fast-check';
import { graphemeWidth, segmentGraphemes } from './grapheme.js';
import { wrapToWidth } from './wrap.js';

// Specification (flyingrobots/bijou#678): a spaceless Chinese paragraph wraps
// between ideographs, and no wrapped line is wider than the target width in
// terminal cells. Every Han ideograph below is UAX #11 W, two cells.

// Twenty distinct ideographs (40 cells), repeated ten times: 200 characters.
const TWENTY = '天地玄黄宇宙洪荒日月盈昃辰宿列张寒来暑往';
const PARAGRAPH = TWENTY.repeat(10);

// Expected lines derived by hand: a width of W cells holds floor(W / 2)
// ideographs, so the paragraph is cut into runs of that many characters.
function runsOf(size: number): string[] {
  const chars = segmentGraphemes(PARAGRAPH);
  const runs: string[] = [];
  for (let index = 0; index < chars.length; index += size) {
    runs.push(chars.slice(index, index + size).join(''));
  }
  return runs;
}

describe('wrapToWidth with a spaceless 200-character Chinese paragraph', () => {
  it('is 200 characters and 400 cells wide before wrapping', () => {
    expect(segmentGraphemes(PARAGRAPH)).toHaveLength(200);
    expect(graphemeWidth(PARAGRAPH)).toBe(400);
  });

  it('wraps at width 10 into forty lines of five ideographs', () => {
    const lines = wrapToWidth(PARAGRAPH, 10);
    expect(lines[0]).toBe('天地玄黄宇');
    expect(lines[1]).toBe('宙洪荒日月');
    expect(lines).toEqual(runsOf(5));
    expect(lines).toHaveLength(40);
  });

  it('wraps at odd width 11 into five ideographs per line, one cell unused', () => {
    // 5 ideographs = 10 cells; a sixth would need cells 11 and 12.
    const lines = wrapToWidth(PARAGRAPH, 11);
    expect(lines[0]).toBe('天地玄黄宇');
    expect(lines).toEqual(runsOf(5));
  });

  it('wraps at width 40 into ten copies of the twenty-ideograph run', () => {
    expect(wrapToWidth(PARAGRAPH, 40)).toEqual(Array<string>(10).fill(TWENTY));
  });

  it('wraps at width 80 into five lines of forty ideographs', () => {
    const lines = wrapToWidth(PARAGRAPH, 80);
    expect(lines).toEqual(Array<string>(5).fill(TWENTY + TWENTY));
  });
});

// Graphemes of every class the blocked locales use: ASCII, a space, Han,
// hiragana and katakana, halfwidth katakana (narrow), precomposed Hangul,
// fullwidth Latin and punctuation, and an Ambiguous character (narrow).
const ALPHABET = [
  'a', 'Z', '7', ' ', '漢', '字', 'の', 'テ', 'ｶ', 'ﾅ', '한', '국',
  'Ａ', '，', '。', '±',
];

// One known defect bounds this property, filed with its failing case and kept
// out of the suite because the repository has no expected-failure mechanism:
// width 1 cannot hold a wide character and wrapToWidth emits it anyway
// (flyingrobots/bijou#852). The generator therefore uses widths 2..120.
// Leading spaces are included: flyingrobots/bijou#853 is fixed.
describe('wrapToWidth property over mixed CJK and Latin text', () => {
  it('keeps every line within widths 2..120 and loses no grapheme', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom(...ALPHABET), { maxLength: 300 }),
        fc.integer({ min: 2, max: 120 }),
        (parts, width) => {
          const text = parts.join('');
          const lines = wrapToWidth(text, width);
          for (const line of lines) {
            expect(graphemeWidth(line)).toBeLessThanOrEqual(width);
          }
          // Wrapping may drop spaces at a break but never another grapheme.
          const kept = segmentGraphemes(lines.join('')).filter((g) => g !== ' ');
          expect(kept).toEqual(parts.filter((g) => g !== ' '));
        },
      ),
      { numRuns: 500 },
    );
  });
});
