# PR #28 Review Improvements

> Implement 5 improvements surfaced from PR #28 review: vim mode switching, DAG encoding functions, shader-based DAG rendering, k-key bug fix, clearRender consistency.

---

- [x] **Write tests for `encodeArrowPos`/`decodeArrowPos`.** Create `packages/bijou/src/core/components/dag-edges.test.ts` with round-trip tests (typical, zero, max, edge cases).

- [x] **Implement `encodeArrowPos`/`decodeArrowPos` and update call sites.** Add bitwise encoding functions to `dag-edges.ts`, update `markEdge()` and `dag-render.ts`. Remove `GRID_COL_MULTIPLIER` export.

- [x] **Fix `clearRender()` consistency in `filter-interactive.ts`.** Make `clearRender()` accept explicit line count parameter. All navigation handlers capture `renderLineCount()` before mutating state.

- [x] **Write vim mode tests for filter-interactive.** Add `describe('vim-style mode switching')` block to `filter.test.ts` with 11 tests for normal/insert mode behavior.

- [x] **Implement vim-style mode switching in `filter-interactive.ts`.** Add `mode` state, restructure key handler with normal/insert mode logic, update render for mode indicator (`:` normal, `/` insert).

- [x] **Add DAG render output stability snapshots.** Add 9 snapshot tests to `dag.test.ts` capturing exact output for key graph shapes.

- [x] **Replace `charGrid`/`tokenGrid` with shader-based `cellAt` query.** Refactor `renderInteractiveLayout()` to use on-demand per-cell computation with spatial node index + highlight cell set.

- [x] **Update docs, changelog, roadmap, and tracking files.** Update `CHANGELOG.md`, `ROADMAP.md`, `TASKS.md`, `bad_code.md`, `cool_ideas.md`.
