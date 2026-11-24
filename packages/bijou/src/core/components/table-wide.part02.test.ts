import { describe, expect, it } from 'vitest';
import { table } from './table.js';
import { createTestContext } from '../../adapters/test/index.js';
import type { OverflowBehavior } from './types.js';

// Specification (flyingrobots/bijou#678): a table cell of fixed width never
// holds half a wide character (UAX #11 W or F, two cells). When only one cell
// remains, a truncated cell pads that cell with a space and a wrapped cell
// moves the wide character to the next line, so every row of the column keeps
// the same cell width. Expected cell texts are counted by hand and include the
// padding to the column width.
//
// A wrapping width-1 column emits a two-cell character (known defect
// flyingrobots/bijou#852), so only the truncating width-1 case is here.

const MODES = ['interactive', 'static'] as const;

function cellLines(
  mode: (typeof MODES)[number],
  width: number,
  value: string,
  overflow: OverflowBehavior,
): string[] {
  const ctx = createTestContext({ mode, noColor: true });
  const lines = table({
    columns: [{ header: 'T', width }],
    rows: [[value]],
    overflow,
    ctx,
  }).split('\n');
  // Drop top border, header, separator and bottom border; strip the frame.
  return lines.slice(3, -1).map((line) => line.slice(2, -2));
}

describe.each(MODES)('table cells with wide characters (%s)', (mode) => {
  it('keeps a mixed narrow/wide cell that fits exactly', () => {
    // a b (2) + 漢 字 (4) = 6 cells in a 6-cell column.
    expect(cellLines(mode, 6, 'ab漢字', 'truncate')).toEqual(['ab漢字']);
    expect(cellLines(mode, 6, 'ab漢字', 'wrap')).toEqual(['ab漢字']);
  });

  it('handles a cell that overflows by one cell where the last character is wide', () => {
    // a b c (3) + 漢 (2) = 5 cells in a 4-cell column: 漢 would need cells 4-5.
    // Truncated: "abc" + 1 space of padding. Wrapped: 漢 moves to line 2,
    // padded with 2 spaces to 4 cells.
    expect(cellLines(mode, 4, 'abc漢', 'truncate')).toEqual(['abc ']);
    expect(cellLines(mode, 4, 'abc漢', 'wrap')).toEqual(['abc ', '漢  ']);
  });

  it('keeps a wide character that ends exactly at the column edge', () => {
    // a b (2) + 漢 (2) = 4 cells, the wide character fills cells 3-4.
    expect(cellLines(mode, 4, 'ab漢字', 'truncate')).toEqual(['ab漢']);
    expect(cellLines(mode, 4, 'ab漢字', 'wrap')).toEqual(['ab漢', '字  ']);
  });

  it('pads an odd-width column of only wide characters', () => {
    // 5 cells hold two wide characters (4) and one space of padding.
    expect(cellLines(mode, 5, '漢字仮名', 'truncate')).toEqual(['漢字 ']);
    expect(cellLines(mode, 5, '漢字仮名', 'wrap')).toEqual(['漢字 ', '仮名 ']);
    // Hangul and kana mixed: 한국 / 日本 / かな at width 5.
    expect(cellLines(mode, 5, '한국日本かな', 'wrap')).toEqual([
      '한국 ',
      '日本 ',
      'かな ',
    ]);
  });

  it('wraps by grapheme the same way when wrap is "grapheme"', () => {
    const ctx = createTestContext({ mode, noColor: true });
    const lines = table({
      columns: [{ header: 'T', width: 5 }],
      rows: [['ab漢字cd']],
      wrap: 'grapheme',
      ctx,
    }).split('\n');
    // a b 漢 = 4 cells; 字 would need cells 5-6, so it moves: ab漢 + 1 pad,
    // then 字 c d = 4 cells + 1 pad.
    expect(lines.slice(3, -1)).toEqual(['│ ab漢  │', '│ 字cd  │']);
  });

  it('pads a width-1 column instead of placing half a wide character', () => {
    // Truncated to one cell, 漢 cannot fit: the cell is one space.
    expect(cellLines(mode, 1, '漢字', 'truncate')).toEqual([' ']);
  });
});
