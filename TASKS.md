# PR #29 Self-Review Fixes

> 77 issues identified by self-code-review of `feat/pr28-improvements` vs `origin/main` (PR #28 and PR #29). Grouped by severity, then by file. Each item is self-contained.

---

## MAJOR — Source Code (5)

- [ ] **Fix HR regex to handle spaced variants (`* * *`, `- - -`).** In `packages/bijou/src/core/components/markdown-parse.ts`, the HR regex at line 70 is `/^(-{3,}|\*{3,}|_{3,})\s*$/` applied to `line.trim()`. This requires three *consecutive* identical characters, but CommonMark allows interspersed spaces: `* * *` and `- - -` are valid HRs. Currently these are mis-parsed as bullet list items because the bullet regex (`/^\s*[-*]\s+/`) matches first. Fix: change the HR regex to `/^([-*_]\s*){3,}$/` on `line.trim()`. Apply the same fix in `isBlockStart()` at line 143. Write a failing test first (`markdown.test.ts`): `markdown('* * *', { ctx: ctx() })` should render an HR, not a bullet list.

- [ ] **Fix CJK/wide-char column-to-grapheme mapping in DAG `cellAt()`.** In `packages/bijou/src/core/components/dag-render.ts`, the `cellAt(row, col)` function (line 327) computes `ci = col - p.startCol` and indexes directly into the `chars` grapheme array. CJK characters occupy 2 terminal columns but 1 grapheme slot, so `col` (a column offset) and `ci` (a grapheme index) diverge when wide characters are present. This causes garbled rendering for CJK node labels. Fix: either expand the grapheme array with empty placeholder entries for the second column of wide characters, or build a column-to-grapheme mapping during `PlacedNode` construction. Write a test with a CJK label (e.g., `{ id: 'a', label: '日本語' }`) and verify the output is well-formed.

- [ ] **Fix word-wrap ordering in `renderBlocks` paragraph case.** In `packages/bijou/src/core/components/markdown-render.ts` line 57, `wordWrap(block.text, width)` is called on raw markdown source *before* `parseInline()`. Markdown markers like `**bold**` consume wrap width but are invisible in the rendered output, causing premature line breaks. Fix: either (a) strip markers before wrapping and re-apply after (complex), or (b) document this as a known limitation with a `// Known limitation:` comment explaining the trade-off. Option (b) is recommended given the complexity of (a).

- [ ] **Document Escape key ambiguity in `filter-interactive.ts` and `textarea-editor.ts`.** In `packages/bijou/src/core/forms/textarea-editor.ts` line 130, bare `\x1b` cancels the editor and discards all typed content. On slow SSH connections, arrow key escape sequences (`\x1b[A`) may arrive byte-by-byte, causing a false cancel and data loss. The same issue exists in `packages/bijou/src/core/forms/filter-interactive.ts` line 224 (normal mode Escape cancels). The textarea already has a comment (lines 132–134) acknowledging this; add a matching comment in `filter-interactive.ts` at line 224 for parity. Timer-based disambiguation is a future improvement.

- [ ] **Document `static` mode fall-through in markdown renderer.** In `packages/bijou/src/core/components/markdown-render.ts` line 28, the `renderBlocks` function checks `mode === 'accessible'` and `mode === 'pipe'` explicitly but lets `'static'` and `'interactive'` fall through to styled rendering. Add a comment at the top of `renderBlocks` explaining that `static` mode intentionally receives styled output (same as `interactive`). Similarly, in `packages/bijou/src/core/components/markdown-parse.ts` line 162, `parseInline` routes non-pipe/non-accessible modes to `parseInlineStyled` — add a comment.

---

## MAJOR — Tests (7)

- [ ] **Fix filter mode indicator assertion to be non-trivial.** In `packages/bijou/src/core/forms/filter.test.ts` line 278, `expect(output).toContain(':')` passes trivially because `:` appears everywhere in terminal output. Change to `expect(output).toContain('  : ')` to match the actual rendered mode indicator pattern (two-space indent, colon, space), paralleling line 286's `expect(output).toContain('  / ')`.

- [ ] **Fix filter count test to prove filtering actually occurred.** In `packages/bijou/src/core/forms/filter.test.ts` line 172, the query character `'a'` matches all 3 options (Apple, Banana, Carrot all contain `a`), so the count stays `3/3 items` — same as unfiltered. Change the query to `'c'` (matches only Carrot) and assert `expect(output).toContain('1/3 items')`.

- [ ] **Fix `k` typeable assertion to positively prove typing.** In `packages/bijou/src/core/forms/filter.test.ts` line 289, the test types `/` then `k` and expects `apple` (default). This can't distinguish "k was typed as filter text with no match" from "k navigated and something else happened." Fix: add a `{ label: 'Kiwi', value: 'kiwi' }` option to `OPTIONS` (or use a local fixture), so typing `k` matches `Kiwi` and the result proves `k` was treated as filter text. Alternatively, inspect `ctx.io.written` for the filter input line containing the typed `k`.

- [ ] **Fix bold/italic interactive-mode tests to verify styling.** In `packages/bijou/src/core/components/markdown.test.ts` lines 38–46, `toContain('bold')` and `toContain('italic')` pass trivially because those words exist in the raw source. Fix: assert the output contains ANSI bold escape `\x1b[1m` (for bold) or use the existing `expectContainsAnsi()` test helper. For italic, verify the muted token was applied by checking for ANSI color codes or using `auditStyle()`.

- [ ] **Fix code span and HR tests to verify transformation occurred.** In `packages/bijou/src/core/components/markdown.test.ts`: (a) line 61 "renders inline code" — add `expect(result).not.toContain('\`')` to prove backticks were stripped; (b) lines 131–142 "renders hr" — replace `expect(result.length).toBeGreaterThan(0)` with `expect(result).toContain('\u2500')` to verify the box-drawing character was rendered.

- [ ] **Add tests for `junctionChar`, `createGrid`, and `markEdge` in dag-edges.** In `packages/bijou/src/core/components/dag-edges.test.ts`, only `encodeArrowPos`/`decodeArrowPos` are tested. The other three exported functions have zero coverage. Add: (a) `junctionChar`: verify known direction sets produce correct box-drawing chars (e.g., `new Set(['D', 'R'])` → `┌`), test fallback for unknown combos; (b) `createGrid`: verify dimensions and that cells start with empty direction sets; (c) `markEdge`: verify straight and diagonal edges mark correct cells with correct directions and arrowheads.

- [ ] **Fix `dagSlice` descendants test to check all expected nodes.** In `packages/bijou/src/core/components/dag.test.ts` line 416, the test "extracts descendants" only checks for `root`, `a`, `b` but the BFS should also return `c`, `d`, `e`, `f`. Add assertions for all descendant nodes: `expect(ids).toContain('c')`, `expect(ids).toContain('d')`, `expect(ids).toContain('e')`, `expect(ids).toContain('f')`.

---

## MAJOR — Docs (2)

- [x] **Fix `[Unreleased]` compare link in CHANGELOG.** In `docs/CHANGELOG.md` line 551, the link reference points to `v1.0.0...HEAD` but `v1.1.0` has been tagged. Change to `[Unreleased]: https://github.com/flyingrobots/bijou/compare/v1.1.0...HEAD`.

- [x] **Add missing `[1.1.0]` link reference in CHANGELOG.** In `docs/CHANGELOG.md`, the `## [1.1.0]` section (line 32) uses a reference-style link but there is no corresponding definition at the bottom. Add `[1.1.0]: https://github.com/flyingrobots/bijou/compare/v1.0.0...v1.1.0` between the `[Unreleased]` and `[1.0.0]` link definitions.

---

## MINOR — Source Code (7)

- [ ] **Guard against NUL sentinel collision in markdown code span isolation.** In `packages/bijou/src/core/components/markdown-parse.ts` lines 191, 228, 262, the placeholder `\x00CODE{n}\x00` could collide if input contains literal NUL bytes. Use a longer, more unique sentinel (e.g., `\x00\x01BIJOU_CODE${idx}\x01\x00`) or add a brief comment noting the assumption that NUL bytes don't appear in markdown input.

- [ ] **DRY up `parseInlinePlain` and `parseInlineAccessible`.** In `packages/bijou/src/core/components/markdown-parse.ts`, lines 217–276 are near-identical — they differ only in the link replacement format (`'$1 ($2)'` vs `'Link: $1 ($2)'`). Extract a shared `parseInlineStripped(text: string, linkFormat: string)` function and have both call it.

- [ ] **Add empty-options guard to `interactiveFilter`.** In `packages/bijou/src/core/forms/filter-interactive.ts` lines 210, 218, 228, `options.options[0]!.value` crashes if called with an empty array. The caller guards against this, but `interactiveFilter` is exported. Add an early `if (options.options.length === 0) throw new Error(...)` or a `@throws` JSDoc tag documenting the precondition.

- [ ] **Fix hardcoded line-number gutter width in textarea.** In `packages/bijou/src/core/forms/textarea-editor.ts` line 71, `prefixWidth` is hardcoded to 6, which overflows at 1000+ lines (number formatting uses `padStart(3)`). Calculate dynamically: `const numWidth = String(lines.length).length; const prefixWidth = showLineNumbers ? numWidth + 3 : 2;` and update the `padStart` accordingly.

- [ ] **Replace `currentLength()` with a running counter in textarea.** In `packages/bijou/src/core/forms/textarea-editor.ts` line 94, `lines.join('\n').length` recomputes on every keystroke (O(n) allocation). Maintain a `totalLength` variable updated on insert/delete/newline instead.

- [ ] **Replace `Math.max(...spread)` with loop in DAG render.** In `packages/bijou/src/core/components/dag-render.ts` line 183, `Math.max(...nodes.map(...))` spreads all elements as arguments. This throws `RangeError` for arrays > ~65K elements. Use `nodes.reduce((max, n) => Math.max(max, ...), 0)` instead.

- [ ] **Fix numbered list continuation indent misalignment.** In `packages/bijou/src/core/components/markdown-render.ts` lines 77–88, the numbered list prefix width varies per item (`1. ` vs `10. `). Continuation lines of wrapped items inherit their own item's prefix width, causing misalignment between items 1–9 and 10+. Calculate the max prefix width across all items and use it uniformly for all continuation indents.

---

## MINOR — Tests (13)

- [ ] **Add viewport scrolling tests for bidirectional scroll, filter reset, and boundary maxVisible.** In `packages/bijou/src/core/forms/filter.test.ts` lines 297–332, only 2 tests exist. Add: (a) scroll down then back up — verify viewport tracks correctly; (b) type query that narrows list to < maxVisible — verify scroll offset resets; (c) `maxVisible=1` edge case; (d) `maxVisible >= option count` (no scrolling needed).

- [ ] **Add Escape key cancellation test for textarea.** In `packages/bijou/src/core/forms/textarea.test.ts`, no test exercises the Escape key (`\x1b`). Add: `io: { keys: ['h', 'i', '\x1b'] }` and assert result is `''`.

- [ ] **Add tests for textarea `showLineNumbers`, `height`, and `placeholder` options.** In `packages/bijou/src/core/forms/textarea.test.ts`: (a) `showLineNumbers: true` — assert output contains `│` and line number; (b) `height: 2` with 5+ lines — verify scrolling occurs (status shows high `Ln` number); (c) `placeholder: 'Type here...'` — verify output contains placeholder text.

- [ ] **Add `static` mode test for markdown.** In `packages/bijou/src/core/components/markdown.test.ts`, add at least one test with `ctx('static')` verifying styled output (ANSI present, same as interactive).

- [ ] **Strengthen DAG truncation test to verify truncation occurred.** In `packages/bijou/src/core/components/dag.test.ts` line 310, `expect(result).toBeDefined()` is a no-crash guard. Assert the full long label does NOT appear in the output, or assert an ellipsis (`\u2026`) is present.

- [ ] **Strengthen DAG `selectedId` tests to verify styling was applied.** In `packages/bijou/src/core/components/dag.test.ts` lines 358–393, tests only assert label text is present. Use `auditStyle()` or compare styled vs unstyled output to prove selection styling differs.

- [ ] **Strengthen DAG `highlightPath` test to verify highlight styling.** In `packages/bijou/src/core/components/dag.test.ts` line 274, the test only asserts label text. Compare output with vs without `highlightPath` and assert they differ.

- [ ] **Add "0/3 items" status assertion for no-matches case.** In `packages/bijou/src/core/forms/filter.test.ts` line 195, the test verifies the return value but doesn't check the rendered status. Assert `ctx.io.written.join('').includes('0/3 items')`.

- [ ] **Add out-of-range number tests for filter fallback mode.** In `packages/bijou/src/core/forms/filter.test.ts`, add tests for inputs `'0'`, `'-1'`, and `'99'` in non-interactive mode to verify boundary handling.

- [ ] **Add overflow behavior test for `encodeArrowPos`.** In `packages/bijou/src/core/components/dag-edges.test.ts`, add a test documenting that `encodeArrowPos(65536, 0)` silently wraps (same encoding as `(0, 0)`). This documents the limit, not a bug fix.

- [ ] **Strengthen blockquote test to verify pipe character.** In `packages/bijou/src/core/components/markdown.test.ts` line 182, "renders blockquote with pipe character" doesn't assert `\u2502` is present. Add `expect(result).toContain('\u2502')`.

- [ ] **Strengthen link test to verify hyperlink rendering.** In `packages/bijou/src/core/components/markdown.test.ts` line 164, "renders link in interactive mode as hyperlink" only checks `toContain('Click')`. Add `expect(result).toContain('\x1b]8;')` to verify OSC 8 hyperlink escape.

- [ ] **Capture return value in textarea validation tests.** In `packages/bijou/src/core/forms/textarea.test.ts` lines 32–50, the `required: true` and custom validator tests assert error messages appear in output but don't assert return values. Capture and assert `expect(result).toBe('')` and `expect(result).toBe('ab')` respectively to document fallback-path behavior.

---

## MINOR — Docs (8)

- [x] **Fix COMPLETED.md entry to reference both PRs and follow naming convention.** In `docs/COMPLETED.md` line 7, the title "PR #28 Review Improvements + PR #29 CodeRabbit Fixes" doesn't follow the version-prefix convention of other entries. Change Ref to include both PRs: `**Ref:** [PR #28](...), [PR #29](...)`.

- [x] **Update ROADMAP "Current" line to reflect shipped state.** In `docs/ROADMAP.md` line 5, "Current: **v1.0.0**" is stale — v1.0.0 and v1.1.0 have both shipped. Update to reflect actual state (e.g., remove "Current:" or change to "Latest: **v1.1.0**").

- [x] **Fix CHANGELOG markdown.ts line count approximation.** In `docs/CHANGELOG.md` line 25, "468→~30 lines" for markdown.ts is inaccurate (actual: ~53 lines). Change to "468→~50 lines".

- [x] **Fix CHANGELOG `j` key simplification entry wording.** In `docs/CHANGELOG.md` line 30, the entry says "remove `j` from the down-arrow condition block" but `j` is still in the down-arrow block in normal mode (`filter-interactive.ts` line 232). Reword to: "in insert mode, `j` falls through to the printable handler instead of being special-cased in the down-arrow condition block."

- [x] **Fix TASKS.md to reference both PR #28 and PR #29.** In `TASKS.md` line 3, change "All items from PR #28 Review Improvements" to "All items from PR #28 Review Improvements and PR #29 CodeRabbit Fixes" to match the COMPLETED.md entry.

- [x] **Fix `visibleLength` return type in dag.md.** In `docs/dag.md` line 425, the function signature shows `function visibleLength(str: string): string` — the return type should be `: number`.

- [x] **Update dag.md LoC estimates to reflect actuals.** In `docs/dag.md` lines 514–533, "Phase 3: ~80 LoC" and "Total: ~420 LoC + tests" are vastly wrong. Actual: `dag.ts` (212) + `dag-layout.ts` (176) + `dag-edges.ts` (160) + `dag-render.ts` (466) = ~1014 lines. Update or remove the estimates.

- [x] **Clarify "any printable" in filter README keyboard table.** In `examples/filter/README.md` line 12, the Normal mode row says `any printable | Enter insert mode + type character`. This implicitly excludes `j`, `k`, and `/` which are also printable but have special behavior. Change to `any other printable` or `any printable (except j/k//)`.

---

## NIT (20)

- [ ] **Add comment explaining `navigateUp`/`navigateDown` skip `clearBlock`.** `filter-interactive.ts` lines 172–188 use a lighter rerender path than `clearAndRerender`. Add a brief comment explaining this is intentional because `render()` uses per-line `\x1b[K`.

- [ ] **Add comment explaining `switchMode` rerender pattern.** `filter-interactive.ts` line 197 — same pattern divergence as navigate functions. Brief comment for consistency.

- [ ] **Add comment on junction char alphabetical sort invariant.** `dag-edges.ts` line 77: `[...dirs].sort().join('')` relies on `D < L < R < U` alphabetically. Add: `// Alphabetical sort of D,L,R,U matches JUNCTION table keys`.

- [ ] **Remove redundant `visited` set in Kahn's algorithm.** `dag-layout.ts` line 50: the `visited` set is redundant — in-degree tracking guarantees each node is queued exactly once. Remove or add a defensive-programming comment.

- [ ] **Move `hideCursor()` to initial render only in textarea.** `textarea-editor.ts` line 67: `term.hideCursor()` is called on every `render()` invocation, but the cursor is already hidden. Move to the one-time setup before the event loop.

- [ ] **Move empty-source check before context resolution in markdown.** `markdown.ts` line 49: `if (source.trim() === '') return ''` runs after context resolution. Move to line 45 for a micro-optimization.

- [ ] **Add comment on `wordWrap` behavior for `width <= 0`.** `markdown-parse.ts` line 289: `wordWrap` silently degrades for non-positive widths (returns `[text]` unwrapped). Document this design choice.

- [ ] **Document code span regex limitations.** `markdown-parse.ts` line 187: the regex `` /`([^`]+)`/g `` doesn't handle escaped backticks or double-backtick spans (`` `` `code` `` ``). Add a `// Limitation:` comment.

- [ ] **Clarify bold/italic interaction comment.** `markdown-parse.ts` line 195: "Italic: `*text*` (but not inside `**`)" is misleading — the negative lookahead only prevents `**text**` from matching as italic, not `*text*` inside a bold span. Clarify that italic runs after bold removal.

- [ ] **Add type-safety fallback for `hlToken`.** `dag-render.ts` lines 346, 353: `hlToken!` non-null assertion is logically safe but hides the invariant from TypeScript. Use `hlToken ?? edgeToken` for type safety.

- [ ] **Add comment on run-length token comparison.** `dag-render.ts` line 372: `tk === prevToken` works because `TokenValue` is a string primitive. Add a comment confirming this assumption.

- [x] **Shorten filter demo description in EXAMPLES.md.** `docs/EXAMPLES.md` line 203: the filter demo description is 4+ lines of dense text. Shorten to 1–2 sentences matching other entries' style, deferring keyboard details to the example's README.

- [x] **Fix ROADMAP Phase 8 table cell formatting.** `docs/ROADMAP.md` line 109: the mixed strikethrough + checkmark in a single cell is visually cluttered. Rewrite the Notes cell to be clearer: "Add `maxVisible` + scroll offset to `select()`. `filter()` scroll: Done."

- [x] **Move struck-through P3 backlog items to end of table.** `docs/ROADMAP.md` lines 561, 563: completed items are interleaved with active backlog. Group them at the end for scanability.

- [x] **Update dag.md optional chaining note.** `docs/dag.md` line 316: pseudocode says `g.dirs[row][col]` but actual code uses `g.dirs[row]?.[col]`. Minor accuracy fix.

- [ ] **Deduplicate or differentiate filter "typing filters" tests.** `filter.test.ts` lines 132 and 235: both type `c`, `a`, `r`, Enter and assert `carrot`. They're in different describe blocks but exercise the same code path.

- [ ] **Improve code span test naming.** `markdown.test.ts` lines 71–84: "preserves asterisks inside code spans" could be clearer as "treats asterisks as literal text inside code spans".

- [ ] **Add `expect(result).not.toBe('hi')` to textarea Ctrl+C test.** `textarea.test.ts` line 89: the existing assertion `expect(result).toBe('')` is sufficient, but adding a negative assertion makes the intent crystal clear.

- [ ] **Add more `encodeArrowPos` distinctness pairs.** `dag-edges.test.ts` line 30: only tests `(1,2)` vs `(2,1)`. Add `(0,1)` vs `(1,0)` and `(256,0)` vs `(0,256)`.

- [ ] **Add duplicate-node-ID test for DAG.** `dag.test.ts`: no test exercises duplicate `id` values. Add one to document whether it throws or silently uses one.
