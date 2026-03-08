# v1.7.0 — Test Fortress

All phases complete. Ready for PR.

---

## Phase 1: Spec-vs-Impl Mismatches ✅

- [x] **1a. `mockIO().question()` exhaustion** — Spec updated to match impl (returns `''`).
- [x] **1b. CI+TTY mode** — Spec corrected from "rich" to "static".
- [x] **1c. Ctrl+C semantics** — Spec updated to document per-form behavior.

## Phase 2: Hard Gaps ✅

- [x] **2a. multiselect() defaultValues** — Added `defaultValues` option, pre-selects items in interactive mode.
- [x] **2b. nodeIO() adapter tests** — write, writeError, readFile, readDir, joinPath, setInterval.
- [x] **2c. chalkStyle() adapter tests** — bgRgb, bgHex, styled bg field, noColor for bg methods.
- [x] **2d. input() validation re-render** — Already covered by existing tests (pipe mode validation + interactive error display).

## Phase 3: Fuzz / Stress Suites ✅

- [x] **3a. Forms fuzz** — fast-check: arbitrary strings, control chars, long input, numeric edge cases, malformed comma lists, rapid repeated calls.
- [x] **3b. Environment fuzz** — fast-check: 500+ random env×TTY combos, BIJOU_ACCESSIBLE priority, NO_COLOR invariant.
- [x] **3c. DTCG fuzz** — fast-check: random theme round-trip, hex preservation, modifier subsets, deeply nested reference chains.

## Phase 4: Cleanup & Ship ✅

- [x] **Update ROADMAP** — Test coverage spec marked shipped, v1.7.0 in milestones table.
- [x] **Update CHANGELOG** — `[1.7.0]` section with features, tests, docs.
- [x] **Version bump** — All 5 packages bumped to 1.7.0.
- [x] **Run full test suite** — 101 files, 1900 passed, 12 skipped, 0 failures.
- [ ] **Final commit and PR** — branch `feat/v1.7.0-test-fortress`, PR to main.
