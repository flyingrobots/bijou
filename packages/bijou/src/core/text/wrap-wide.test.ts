import { describe, expect, it } from 'vitest';
import { graphemeWidth } from './grapheme.js';
import { wrapToWidth } from './wrap.js';

// Specification (flyingrobots/bijou#678): a terminal cell grid in which East
// Asian Wide and Fullwidth characters (UAX #11 W and F) take two cells and
// every other grapheme here takes one. A wrapped line never exceeds the target
// width in cells, and a wide character is never split: when only one cell
// remains, the wide character moves to the next line. Text with no spaces
// hard-wraps between graphemes. Every expected value below was counted by hand
// as N narrow cells + 2 cells per wide character.

function cells(lines: readonly string[]): number[] {
  return lines.map((line) => graphemeWidth(line));
}

describe('wrapToWidth with East Asian wide characters', () => {
  it('keeps a mixed narrow/wide line that fits exactly on one line', () => {
    // a b (2) + 漢 字 (4) + c d (2) = 8 cells at width 8.
    expect(wrapToWidth('ab漢字cd', 8)).toEqual(['ab漢字cd']);
    // ｶ ﾀ ｶ ﾅ are halfwidth katakana (UAX #11 H, one cell each): 4 + 漢 2 = 6.
    expect(wrapToWidth('ｶﾀｶﾅ漢', 6)).toEqual(['ｶﾀｶﾅ漢']);
  });

  it('moves the last wide character when the line overflows by one cell', () => {
    // a b c (3) + 漢 (2) + 字 (2) = 7 cells, one more than 6: 字 moves down.
    expect(wrapToWidth('abc漢字', 6)).toEqual(['abc漢', '字']);
    // 日本語の (8) + テ (2) = 10 at width 9: テ moves down.
    expect(wrapToWidth('日本語のテ', 9)).toEqual(['日本語の', 'テ']);
  });

  it('never splits a wide character that meets the boundary with one cell left', () => {
    // a b c d e = 5 cells; 漢 needs 2 but only 1 of 6 remains, so it moves.
    expect(wrapToWidth('abcde漢', 6)).toEqual(['abcde', '漢']);
    // ｶﾀｶﾅ = 4 narrow cells; 漢 needs 2 but only 1 of 5 remains.
    expect(wrapToWidth('ｶﾀｶﾅ漢', 5)).toEqual(['ｶﾀｶﾅ', '漢']);
    // 한국 = 4 cells, ending exactly at width 4; 어 starts the next line.
    expect(wrapToWidth('한국어', 4)).toEqual(['한국', '어']);
  });

  it('fills an odd width with whole wide characters and leaves one cell empty', () => {
    // Width 5 holds two wide characters (4 cells); the fifth cell stays empty.
    expect(wrapToWidth('漢字仮名한국', 5)).toEqual(['漢字', '仮名', '한국']);
    // Fullwidth Latin Ａ Ｂ Ｃ and fullwidth punctuation ， ！ are F: two cells.
    expect(wrapToWidth('ＡＢＣ，！', 3)).toEqual(['Ａ', 'Ｂ', 'Ｃ', '，', '！']);
    // 。 (U+3002) is W: 中文。 = 6 cells, width 5 keeps 中文 and moves 。.
    expect(wrapToWidth('中文。', 5)).toEqual(['中文', '。']);
  });

  it('counts emoji between ideographs as two cells, as graphemeWidth documents', () => {
    // 中 (2) + 😀 (2, U+1F600 is in the documented emoji range) = 4; 文 moves.
    expect(wrapToWidth('中😀文', 5)).toEqual(['中😀', '文']);
  });

  it('gives combining marks no cell of their own', () => {
    // e + U+0301 is one grapheme of one cell: é (1) + 漢 (2) = 3 at width 3.
    expect(wrapToWidth('é漢字', 3)).toEqual(['é漢', '字']);
  });

  it('breaks at a space before falling back to grapheme breaks', () => {
    // "ab " then 漢字漢 (6) would make 9 > 8: break at the space.
    expect(wrapToWidth('ab 漢字漢', 8)).toEqual(['ab', '漢字漢']);
  });

  it('never exceeds the width on a mixed Latin, kana and Hangul sentence', () => {
    const lines = wrapToWidth('Bijou は日本語と한국어를 표시합니다', 11);
    for (const width of cells(lines)) expect(width).toBeLessThanOrEqual(11);
  });
});
