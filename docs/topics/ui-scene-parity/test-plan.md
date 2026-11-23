# Test plan: terminal and browser parity witness for `ui-scene-ir/1`

This ledger lists each requirement of the
[parity witness](./README.md), the test that holds it, and its status. Every
test is in `packages/bijou/src/core/`, in the file named in the requirement's
group heading. The oracle for each case is the assertion in the named test.
All cases use the debugger fixture of the
[browser renderer seam](../ui-scene-browser/README.md).

## Golden: `ui-scene-parity.part01.test.ts`

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| USP-01 | The debugger fixture gives one exact list of findings, with no mismatch. | `witnesses the debugger fixture with exact findings` | Implemented |
| USP-02 | Equal scenes give equal witnesses. | `gives the same witness for the same scene every time` | Implemented |
| USP-03 | Both lowerings come from one scene value, and the comparison needs only the two outputs. | `compares both lowerings of one frozen scene and needs no other input` | Implemented |
| USP-04 | Lowerings of different scenes are not compared. | `refuses to compare lowerings of different scenes` | Implemented |
| USP-05 | Both targets resolve the same colors from one token table. | `agrees on the colors both targets resolve from one token table` | Implemented |
| USP-06 | Both targets state the same text in each inspection mode. | `agrees on the text of every inspection mode` | Implemented |
| USP-07 | Inspection text longer than the terminal target is a `text-clipped` gap. | `names the gap when an inspection mode outgrows the terminal` | Implemented |

## Falsification: `ui-scene-parity.part02.test.ts`

Each case changes one output after lowering and expects one `mismatch`.

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| USP-08 | Different browser text is a mismatch. | `reports a mismatch when the browser text differs from the cells` | Implemented |
| USP-09 | A different terminal cell is a mismatch. | `reports a mismatch when the terminal draws a different cell` | Implemented |
| USP-10 | A different browser token is a mismatch. | `reports a mismatch when a browser token differs` | Implemented |
| USP-11 | A different browser position is a mismatch. | `reports a mismatch when a browser position differs` | Implemented |
| USP-12 | A visible text node missing from the terminal output is a mismatch. | `reports a mismatch when the terminal omits a visible text node` | Implemented |
| USP-13 | A drawn node missing from the browser tree is a mismatch. | `reports a mismatch when the terminal draws a node the browser lacks` | Implemented |

## Named gaps: `ui-scene-parity.part03.test.ts`

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| USP-14 | Text cut at the right edge is a `text-clipped` gap. | `names text that the terminal clips at its right edge` | Implemented |
| USP-15 | Text that starts left of the target is a `coordinate-normalized` gap and a `text-clipped` gap. | `names text that starts left of the terminal target` | Implemented |
| USP-16 | A text node outside the target, or with empty text, is a `text-not-visible` gap. | `names a text node that the terminal target does not show` | Implemented |
| USP-17 | A fractional or missing coordinate is a `coordinate-normalized` gap. | `names a coordinate that the terminal truncates or defaults` | Implemented |
| USP-18 | Text under a later node is a `text-overdrawn` gap. | `names text that a later node draws over in the terminal` | Implemented |
| USP-19 | Text with control sequences or tabs is a `text-sanitized` gap. | `names text that the terminal sanitizes` | Implemented |
| USP-20 | A border token is a `browser-only-fact` gap. | `names a border token that only the browser output carries` | Implemented |
| USP-21 | A declared checked state is a `browser-only-fact` gap. | `records the state as a browser-only parity gap` | Implemented |

USP-01 holds the `group-not-drawn` gap and the `browser-only-fact` gaps for
`role`, `component`, `action`, `binding`, `width`, and `height`.

## Refusals: `ui-scene-parity.part04.test.ts`

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| USP-21 | Only the browser seam refuses a node the root does not reach. | `records that only the browser refuses a node the root does not reach` | Implemented |
| USP-22 | Only the browser seam refuses a node the tree places twice. | `records that only the browser refuses a node the tree places twice` | Implemented |
| USP-23 | A missing target profile is refused by that target only. | `records a missing target profile as a refusal by that target only` | Implemented |
| USP-24 | Only the browser seam refuses a token color that is not hex. | `records that only the browser refuses a token color that is not hex` | Implemented |
| USP-25 | Both targets refuse a node kind other than `group` or `text`. | `records a refusal by both targets for a node kind neither can lower` | Implemented |
| USP-26 | Both targets refuse an invalid scene with one message. | `records one refusal message from both targets for an invalid scene` | Implemented |
| USP-27 | The terminal renderer resolves a color only from an own entry of `tokenColors`, as the browser seam does. | `resolves no color from an entry the token table only inherits` | Implemented |

## Not covered

- No test loads the markup in a browser engine. The sealed runner has none.
- Color strings other than six-digit lowercase hex.
- Fuzz and stress cases: not applicable, as the issue records.
