# Test plan: East Asian text width

This ledger lists each requirement of the [text width reference](./README.md)
and the test that holds it. Text tests are in `packages/bijou/src/core/text/`
and component tests in `packages/bijou/src/core/components/`, in the file named
in each group heading unless the Test cell names another file. Every expected
value is written by hand in the test, counted on the UAX #11 cell grid.
Origin: flyingrobots/bijou#678.

## Cell widths: `width-policy-wide.test.ts`

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| TW-01 | Han, kana, precomposed Hangul and fullwidth forms are two cells. | `measures Han, kana, precomposed Hangul and fullwidth forms as two cells` | Implemented |
| TW-02 | Halfwidth katakana are one cell. | `measures halfwidth katakana as one cell each` | Implemented |
| TW-03 | Combining marks take no cell. | `gives combining marks no cell of their own` | Implemented |
| TW-04 | East Asian Ambiguous characters are one cell. | `measures every listed Ambiguous character as one cell` | Implemented |
| TW-05 | Ambiguous characters wrap as one cell beside wide ones. | `wraps Ambiguous characters as one cell beside wide ones` | Implemented |
| TW-06 | Conjoining jamo syllables are two cells. | `grapheme-spacing-units.test.ts`: `measures a leading + vowel + final jamo syllable as two cells`, `measures leading + vowel and Old Hangul syllables as two cells`, `measures a lone leading jamo as two cells` | Implemented |
| TW-07 | Halfwidth voiced marks are one cell each. | `grapheme-spacing-units.test.ts`: `keeps ｶﾞ one cluster and measures it as two cells`, `counts each attached halfwidth mark as its own cell`, `wraps ｶﾞｷﾞ at width 2 into two-cell lines` | Implemented |

## UAX #11 table: `grapheme-uax11.test.ts` and `scripts/unicode/east-asian-wide-table.test.ts`

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| TW-40 | UAX #11 W and F code points outside the CJK blocks (watch, Yi, Tangut, Khitan, Nushu, kana supplements) are two cells. | `U+231A watch is wide` and the other 15 `<code point> <name> is wide` cases, `keeps a row of watch emoji two cells apiece` | Implemented |
| TW-41 | Ambiguous U+3248..U+324F are one cell. | `measures the Ambiguous circled numbers U+3248..U+324F as one cell (narrow policy)` | Implemented |
| TW-42 | Neutral emoji-block symbols are one cell, and two with U+FE0F. | `U+1F321 thermometer (N, text presentation) is narrow` and the other 4 `... is narrow` cases, `still measures a text-presentation emoji with VS16 as two cells` | Implemented |
| TW-43 | Flags, ZWJ, skin-tone and keycap sequences stay two cells. | `keeps regional indicators wide so a flag is two cells`, `keeps ZWJ, skin-tone and keycap sequences two cells` | Implemented |
| TW-44 | The checked-in table is exactly the generator's output from the vendored UCD 18.0.0 file, and names its version and input digest. | `is exactly what the generator produces from the vendored UCD files`, `names its Unicode version, its input digest and that it is generated` | Implemented |
| TW-45 | The generated Halfwidth ranges hold exactly the H code points, which the cluster rule counts as a cell when they extend a cluster. | `keeps only H for the halfwidth ranges, merging adjacent ones`, `is exactly what the generator produces from the vendored UCD files` | Implemented |

## Wrapping: `wrap-wide.test.ts` and `wrap-wide-paragraph.test.ts`

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| TW-10 | A mixed line that fits exactly stays on one line. | `keeps a mixed narrow/wide line that fits exactly on one line` | Implemented |
| TW-11 | A line one cell over, ending in a wide character, moves that character. | `moves the last wide character when the line overflows by one cell` | Implemented |
| TW-12 | A wide character with one cell left moves to the next line. | `never splits a wide character that meets the boundary with one cell left` | Implemented |
| TW-13 | Only wide characters at an odd width leave one cell empty. | `fills an odd width with whole wide characters and leaves one cell empty` | Implemented |
| TW-14 | Emoji between ideographs are two cells. | `counts emoji between ideographs as two cells, as graphemeWidth documents` | Implemented |
| TW-15 | A spaceless 200-character Chinese paragraph wraps at widths 10, 11, 40 and 80. | `wraps at width 10 into forty lines of five ideographs`, `wraps at odd width 11 into five ideographs per line, one cell unused`, `wraps at width 40 into ten copies of the twenty-ideograph run`, `wraps at width 80 into five lines of forty ideographs` | Implemented |
| TW-16 | For mixed CJK and Latin text and widths 2..120, no line exceeds the width and no grapheme is lost. | `keeps every line within widths 2..120 and loses no grapheme` | Implemented |
| TW-17 | Width 1 never emits a two-cell line. | none: flyingrobots/bijou#852 | Defect |
| TW-18 | A line starting with a space never wraps too wide. | none: flyingrobots/bijou#853 | Defect |

## Truncation: `constrain-wide.test.ts`, `interactive` and `static`

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| TW-20 | A mixed line that fits exactly is unchanged. | `leaves a mixed narrow/wide line that fits exactly unchanged` | Implemented |
| TW-21 | A line one cell over, ending in a wide character, truncates to the exact width. | `truncates a line that overflows by one cell where the last character is wide` | Implemented |
| TW-22 | Only wide characters at an odd width truncate to the exact width. | `truncates a line of only wide characters at an odd width` | Implemented |
| TW-23 | At width 1 the ellipsis stands alone. | `keeps the ellipsis alone at width 1 rather than half a wide character` | Implemented |
| TW-24 | No truncated line exceeds the width. | `never returns a line wider than maxWidth` | Implemented |
| TW-25 | A wide character meeting the edge with one cell left is padded to the exact width. | none: flyingrobots/bijou#851 | Defect |

## Tables: `table-wide.part01.test.ts` and `table-wide.part02.test.ts`, `interactive` and `static`

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| TW-30 | Kana, Hangul and halfwidth katakana rows align by cell width. | `aligns kana, Hangul and halfwidth katakana rows by cell width` | Implemented |
| TW-31 | Wide headers align over narrow cells. | `aligns wide headers over narrow cells` | Implemented |
| TW-32 | Right and centre alignment count cells. | `right-aligns and centres wide cells by cell width` | Implemented |
| TW-33 | A fixed-width cell that fits exactly is unchanged. | `keeps a mixed narrow/wide cell that fits exactly` | Implemented |
| TW-34 | A cell one cell over, ending in a wide character, pads or wraps. | `handles a cell that overflows by one cell where the last character is wide` | Implemented |
| TW-35 | A wide character ending at the column edge stays. | `keeps a wide character that ends exactly at the column edge` | Implemented |
| TW-36 | An odd-width column of only wide characters pads one cell. | `pads an odd-width column of only wide characters` | Implemented |
| TW-37 | Grapheme wrapping moves a wide character whole. | `wraps by grapheme the same way when wrap is "grapheme"` | Implemented |
| TW-38 | A truncating width-1 column holds one space. | `pads a width-1 column instead of placing half a wide character` | Implemented |
| TW-39 | Conjoining jamo rows align. | `grapheme-spacing-units.test.ts`: `aligns a table row of jamo syllables with precomposed Hangul` | Implemented |
