import { describe, expect, it } from 'vitest';
import { graphemeWidth } from './grapheme.js';
import { wrapToWidth } from './wrap.js';

// flyingrobots/bijou#853. Cells are counted by hand on the UAX #11 grid:
// a, b, é, the tab, the space and NBSP are one cell; 。 and 漢 字 are two.
//
// The only way a whitespace break leaves an over-wide remainder is a one-cell
// whitespace with nothing visible before it on the line: the remainder is the
// run that filled the width minus that one cell, plus the two-cell grapheme
// that overflowed, so it is one cell too wide.

function widths(lines: readonly string[]): number[] {
  return lines.map((line) => graphemeWidth(line));
}

describe('wrapToWidth with a leading one-cell whitespace before a wide grapheme', () => {
  it('moves the wide grapheme to the next line (the reported case)', () => {
    // a a a = 3 cells; 。 would be cells 4 and 5 of a 4-cell line.
    const lines = wrapToWidth(' aaa。', 4);
    expect(lines).toEqual(['aaa', '。']);
    expect(widths(lines)).toEqual([3, 2]);
  });

  it('holds at every width from 2 to 5 with a full narrow run', () => {
    expect(wrapToWidth(' a。', 2)).toEqual(['a', '。']);
    expect(wrapToWidth(' aa。', 3)).toEqual(['aa', '。']);
    expect(wrapToWidth(' aaaa。', 5)).toEqual(['aaaa', '。']);
  });

  it('holds when the run that fills the line is itself wide', () => {
    // 漢 字 = 4 cells; a third ideograph needs cells 5 and 6 of 5.
    expect(wrapToWidth(' 漢字漢', 5)).toEqual(['漢字', '漢']);
    // 漢 = 2 cells; 字 needs cells 3 and 4 of 3.
    expect(wrapToWidth(' 漢字', 3)).toEqual(['漢', '字']);
  });

  it('holds when a wide character follows the narrow run', () => {
    // a a a = 3; 漢 would end at cell 5 of 4. 漢 字 = 4 cells fits.
    expect(wrapToWidth(' aaa漢字', 4)).toEqual(['aaa', '漢字']);
  });

  it('keeps wrapping the text after the moved grapheme', () => {
    // 。 b b = 4 cells, then the last b.
    expect(wrapToWidth(' aaa。bbb', 4)).toEqual(['aaa', '。bb', 'b']);
  });

  it('holds for a leading tab and a leading no-break space', () => {
    // wrapToWidth breaks at any \s grapheme; tab and NBSP are one cell here.
    expect(wrapToWidth('\taaa。', 4)).toEqual(['aaa', '。']);
    expect(wrapToWidth(' aaa。', 4)).toEqual(['aaa', '。']);
  });

  it('holds for combining sequences before the wide grapheme', () => {
    // e + U+0301 is one grapheme of one cell.
    const decomposed = 'é';
    const text = ` ${decomposed.repeat(3)}。`;
    expect(wrapToWidth(text, 4)).toEqual([decomposed.repeat(3), '。']);
  });

  it('carries ANSI style onto the moved wide grapheme', () => {
    const text = ' \x1b[31maaa。\x1b[0m';
    expect(wrapToWidth(text, 4)).toEqual([
      '\x1b[31maaa\x1b[0m',
      '\x1b[31m。\x1b[0m',
    ]);
  });
});

describe('wrapToWidth outputs that already fit stay as they were', () => {
  it('keeps inputs that never overflowed byte-identical', () => {
    // Two-cell ideographic space: the remainder is one cell narrower.
    expect(wrapToWidth('　aaa。', 4)).toEqual(['aaa', '。']);
    // A narrow overflow leaves the remainder at exactly the width.
    expect(wrapToWidth(' aaaaa', 4)).toEqual(['aaaa', 'a']);
    // A visible cell before the break leaves room for the wide grapheme.
    expect(wrapToWidth('b aaa。', 4)).toEqual(['b', 'aaa', '。']);
    expect(wrapToWidth('b aa。', 4)).toEqual(['b', 'aa。']);
    expect(wrapToWidth('aaa。', 4)).toEqual(['aaa', '。']);
    expect(wrapToWidth(' 。', 2)).toEqual(['。']);
  });

  it('keeps the existing whitespace-only line for two or more leading spaces', () => {
    // Current behaviour, unchanged by this fix: the spaces before the last
    // break are emitted as their own line, and every line fits.
    expect(wrapToWidth('  aa。', 4)).toEqual([' ', 'aa。']);
    expect(wrapToWidth('   a。', 4)).toEqual(['  ', 'a。']);
    expect(wrapToWidth('     。', 4)).toEqual(['    ', '。']);
  });
});
