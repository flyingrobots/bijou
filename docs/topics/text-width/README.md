# East Asian text width

This page is the reference for how Bijou measures East Asian text in terminal
cells, and how wrapping, truncation and tables use that measure. The
[test plan](./test-plan.md) lists the test that holds each statement.

## Cell widths

Bijou lays text out on a grid of terminal cells. `graphemeWidth()` and
`graphemeClusterWidth()` in `@flyingrobots/bijou` measure one grapheme cluster
at a time:

| Characters | UAX #11 class | Cells |
| --- | --- | --- |
| Han ideographs, hiragana, katakana, precomposed Hangul syllables | W | 2 |
| Fullwidth Latin and punctuation (`Ａ`, `，`, `！`), CJK punctuation (`。`, `「`) | F or W | 2 |
| Halfwidth katakana (`ｶ`, `ｰ`) | H | 1 |
| Combining marks (U+0301, U+3099) | not a cell of its own | 0 |
| Yi, Tangut, Khitan, Nushu and the kana supplements | W | 2 |
| Emoji-presentation symbols and pictographs (`⌚`, `☕`, `✅`, `😀`) | W | 2 |
| Text-presentation symbols (`🌡`, `🕳`, `🀀`) | N | 1, or 2 with U+FE0F |
| Regional indicators (each half of a flag) | N | 2, by Bijou policy |

## Where the widths come from

`isWideChar()` reads a range table generated from the Unicode Character
Database: every code point whose UAX #11 East_Asian_Width is W or F is two
cells, and every other code point is one. The only addition is the regional
indicators U+1F1E6..U+1F1FF, which UAX #11 classes N: Bijou counts them wide so
that a flag measures two cells.

- Unicode version: 18.0.0, the latest release. Supported Node.js versions ship
  different `Intl.Segmenter` data (ICU 76.1, Unicode 16.0, in Node 20.19 and
  22.12; Unicode 17.0 in the sealed Node 22 image), and between 16.0 and 18.0
  the W and F sets only gained newly assigned code points.
- Input: `scripts/unicode/ucd/18.0.0/EastAsianWidth.txt`, vendored with the
  Unicode License v3 in `scripts/unicode/ucd/UNICODE-LICENSE.txt`.
- Output: `packages/bijou/src/core/text/generated/east-asian-wide.ts`. Do not
  edit it. Regenerate it with `npm run unicode:wide-table`, and
  `npm run unicode:wide-table -- --check` reports drift.
- `npm run unicode:width-report` lists every code point and cluster whose width
  differs from the hand-written table this one replaced (JSON Lines;
  `--human` for Markdown tables).

## Ambiguous width policy: narrow

Characters of UAX #11 class A (East Asian Ambiguous), such as `±`, `°`, `α`,
`Д`, `…`, `①`, `㉈` and the box-drawing characters `─ │ ┌`, take **one** cell. This
is how terminals draw them outside CJK legacy locales. Table borders and the
truncation ellipsis depend on it: a terminal set to draw Ambiguous characters
wide will misalign Bijou output.

## Wrapping

`wrapToWidth()` breaks at a space when one fits, and otherwise between any two
grapheme clusters, so a spaceless Chinese paragraph wraps between ideographs. A
wide character that would need the last free cell and one more moves to the
next line; it is never split.

## Truncation

`constrain({ maxWidth })` in `interactive` and `static` modes clips a line that
is too wide and appends `…` (one cell). It never splits a wide character. In
`pipe` and `accessible` modes the content passes through unchanged.

## Tables

`table()` in `interactive` and `static` modes sizes each column by the widest
cell in cells and pads every cell to that width, so kana, Han and Hangul rows
align with narrow rows. A fixed-width cell with `overflow: 'truncate'` drops a
wide character that does not fit and pads the free cell with a space; with the
default wrapping, the wide character moves to the next line of the cell.

## Known defects

These cases do not yet follow the rules above. The repository has no
expected-failure test mechanism, so each case is recorded in its issue rather
than in the suite.

- `constrain()` leaves a truncated line one cell short instead of padding it
  when a wide character meets the edge: flyingrobots/bijou#851.
- At width 1, `wrapToWidth()` and wrapping table cells emit a two-cell
  character: flyingrobots/bijou#852.
- A line that starts with a space can wrap one cell too wide:
  flyingrobots/bijou#853.
- Hangul written as conjoining jamo measures one cell instead of two:
  flyingrobots/bijou#854.
- The halfwidth voiced marks `ﾞ` and `ﾟ` measure zero cells instead of one:
  flyingrobots/bijou#855.
