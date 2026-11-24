import { describe, expect, it } from 'vitest';
import { table } from './table.js';
import { createTestContext } from '../../adapters/test/index.js';
import { graphemeWidth } from '../text/grapheme.js';

// Specification (flyingrobots/bijou#678): table columns align by terminal
// cell width. Kana, Han and precomposed Hangul (UAX #11 W) take two cells,
// halfwidth katakana (H) and the box-drawing border (Ambiguous, narrow by
// policy) take one. Every row of a column has the same cell width, so every
// rendered line of a table has the same cell width.
//
// Expected lines are written by hand. Natural column widths are the widest
// cell: Key = "Key" (3), Label = ホーム (6), N = "N" (1). Each cell is padded
// with spaces to that width, framed by one space on each side and │.
//
// Hangul written as conjoining jamo misaligns a column (known defect
// flyingrobots/bijou#854); it is kept out of this suite because the repository
// has no expected-failure mechanism.

const MODES = ['interactive', 'static'] as const;

describe.each(MODES)('table alignment with kana and Hangul (%s)', (mode) => {
  const ctx = createTestContext({ mode, noColor: true });

  it('aligns kana, Hangul and halfwidth katakana rows by cell width', () => {
    const result = table({
      columns: [{ header: 'Key' }, { header: 'Label' }, { header: 'N' }],
      rows: [
        ['ja', 'ホーム', '1'],
        ['ko', '설정', '2'],
        ['hw', 'ﾎｰﾑ', '3'],
      ],
      ctx,
    });
    expect(result.split('\n')).toEqual([
      '┌─────┬────────┬───┐',
      '│ Key │ Label  │ N │',
      '├─────┼────────┼───┤',
      '│ ja  │ ホーム │ 1 │',
      '│ ko  │ 설정   │ 2 │',
      '│ hw  │ ﾎｰﾑ    │ 3 │',
      '└─────┴────────┴───┘',
    ]);
  });

  it('aligns wide headers over narrow cells', () => {
    // 名前 (4) is wider than "ab" (2); 値 (2) is wider than "x" (1).
    const result = table({
      columns: [{ header: '名前' }, { header: '値' }],
      rows: [['ab', 'x'], ['한국', 'ｶﾅ']],
      ctx,
    });
    expect(result.split('\n')).toEqual([
      '┌──────┬────┐',
      '│ 名前 │ 値 │',
      '├──────┼────┤',
      '│ ab   │ x  │',
      '│ 한국 │ ｶﾅ │',
      '└──────┴────┘',
    ]);
  });

  it('right-aligns and centres wide cells by cell width', () => {
    // Column width 6 (ホーム). 설정 (4) right-aligned gets 2 leading spaces;
    // centred, 1 space on each side.
    const result = table({
      columns: [
        { header: 'R', align: 'right' },
        { header: 'C', align: 'center' },
      ],
      rows: [['ホーム', 'ホーム'], ['설정', '설정']],
      ctx,
    });
    const lines = result.split('\n');
    expect(lines[3]).toBe('│ ホーム │ ホーム │');
    expect(lines[4]).toBe('│   설정 │  설정  │');
    for (const line of lines) expect(graphemeWidth(line)).toBe(19);
  });
});
