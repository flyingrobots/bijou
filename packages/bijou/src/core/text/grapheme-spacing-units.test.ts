import { describe, expect, it } from 'vitest';
import { graphemeClusterWidth, graphemeWidth, segmentGraphemes } from './grapheme.js';
import { wrapToWidth } from './wrap.js';
import { table } from '../components/table.js';
import { createTestContext } from '../../adapters/test/index.js';

// A grapheme cluster occupies the cells of its base plus a cell for every
// extender that is itself a spacing character. Expected widths are counted by
// hand on the UAX #11 grid: W and F are two cells, H and N one; combining
// marks, joiners, selectors and conjoining vowel and final jamo add none.

const fromCodes = (...codes: number[]): string => String.fromCodePoint(...codes);

describe('Hangul written as conjoining jamo (flyingrobots/bijou#854)', () => {
  // 한 as jamo: leading U+1112 (W) + vowel U+1161 + final U+11AB.
  const han = fromCodes(0x1112, 0x1161, 0x11ab);

  it('measures a leading + vowel + final jamo syllable as two cells', () => {
    expect(segmentGraphemes(han)).toEqual([han]);
    expect(graphemeWidth(han)).toBe(2);
  });

  it('measures leading + vowel and Old Hangul syllables as two cells', () => {
    expect(graphemeWidth(fromCodes(0x1100, 0x1161))).toBe(2);
    expect(graphemeWidth(fromCodes(0x1100, 0x1100, 0x1161))).toBe(2);
    // Jamo Extended-A leading U+A960 (W) + Extended-B vowel and final (N):
    // the Extended-B jamo add no cell inside the cluster.
    expect(graphemeWidth(fromCodes(0xa960, 0xd7b0, 0xd7cb))).toBe(2);
  });

  it('measures a lone leading jamo as two cells', () => {
    expect(graphemeClusterWidth(fromCodes(0x1100))).toBe(2);
    expect(graphemeClusterWidth(fromCodes(0x115f))).toBe(2);
    expect(graphemeClusterWidth(fromCodes(0xa960))).toBe(2);
    expect(graphemeClusterWidth(fromCodes(0xa97c))).toBe(2);
  });

  it('aligns a table row of jamo syllables with precomposed Hangul', () => {
    // 한국 (precomposed) = 4 cells; 한한 as jamo = 2 + 2 = 4 cells.
    const result = table({
      columns: [{ header: 'K' }],
      rows: [['한국'], [han + han]],
      ctx: createTestContext({ mode: 'interactive', noColor: true }),
    });
    expect(result.split('\n')).toEqual([
      '┌──────┐',
      '│ K    │',
      '├──────┤',
      '│ 한국 │',
      `│ ${han}${han} │`,
      '└──────┘',
    ]);
  });
});

describe('halfwidth katakana sound marks (flyingrobots/bijou#855)', () => {
  // U+FF9E and U+FF9F are UAX #11 H spacing characters that UAX #29 attaches
  // to the preceding letter (Grapheme_Extend): one cluster, two cells.
  it('keeps ｶﾞ one cluster and measures it as two cells', () => {
    expect(segmentGraphemes('ｶﾞ')).toEqual(['ｶﾞ']);
    expect(graphemeWidth('ｶﾞ')).toBe(2);
    expect(graphemeWidth('ﾊﾟ')).toBe(2);
    // ｶ ﾞ ｷ ﾞ = four one-cell characters.
    expect(graphemeWidth('ｶﾞｷﾞ')).toBe(4);
  });

  it('counts each attached halfwidth mark as its own cell', () => {
    // ｶ ﾞ ﾞ = 3 cells; 漢 ﾞ = 2 + 1 cells.
    expect(graphemeClusterWidth('ｶﾞﾞ')).toBe(3);
    expect(graphemeWidth('漢ﾞ')).toBe(3);
  });

  it('wraps ｶﾞｷﾞ at width 2 into two-cell lines', () => {
    expect(wrapToWidth('ｶﾞｷﾞ', 2)).toEqual(['ｶﾞ', 'ｷﾞ']);
  });
});
