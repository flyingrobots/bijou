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
| Halfwidth sound marks `ﾞ` and `ﾟ`, attached to the letter before them (`ｶﾞ`) | H | 1 each, so `ｶﾞ` is 2 |
| Hangul written as conjoining jamo (`U+1112 U+1161 U+11AB`), and a lone leading jamo | leading jamo W, vowel and final jamo N | 2 |
| Combining marks (U+0301, U+3099) | not a cell of its own | 0 |
| Emoji in the ranges `isWideChar()` documents | W | 2 |

## Ambiguous width policy: narrow

Characters of UAX #11 class A (East Asian Ambiguous), such as `±`, `°`, `α`,
`Д`, `…`, `①` and the box-drawing characters `─ │ ┌`, take **one** cell. This
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
