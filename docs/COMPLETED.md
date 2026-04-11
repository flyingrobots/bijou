# Completed Milestones

Shipped work and completed branch milestones, newest first. See [CHANGELOG.md](CHANGELOG.md) for detailed release notes.

---

## v4.4.0 — Data Visualization Toolkit

- **Completed:** 2026-04-10
- **Summary:** Shipped the data-visualization component family (`sparkline`, `brailleChartSurface`, `statsPanelSurface`, `perfOverlaySurface`) with 27 tests. Zero-alloc framed app header/footer painting. Scoped pane scratch pool (RE-010). New bench scenarios (flame, component-app) with dynamic sizing. Soak runner rewritten on `createFramedApp`. DOGFOOD data-viz stories (36/36 families at 100% coverage). Closed stale backlog items for RE-008, RE-007, RE-009, RE-010, RE-015 (code fixes shipped in earlier releases).
- **Ref:** [`v4.4.0`](https://github.com/flyingrobots/bijou/releases/tag/v4.4.0)

---

## v4.3.0 — Byte-Packed Surface Rendering

- **Completed:** 2026-04-10
- **Summary:** Byte-packed surface representation (RE-008), byte-pipeline performance recovery (RE-017), `setRGB` zero-alloc API, direct ANSI emission, braille rendering fix (RE-015), bench v2 harness.
- **Ref:** [`v4.3.0`](https://github.com/flyingrobots/bijou/releases/tag/v4.3.0)

---

## v4.2.0 — MCP and Runtime Engine Migration

- **Completed:** 2026-04-08
- **Summary:** RE-007 framed shell migration, `@flyingrobots/bijou-mcp` rendering server (22 tools), METHOD migration, DOGFOOD corpus cycles (DF-022 through DF-026), WF-003 smoke migration, inspector fix.
- **Ref:** [`v4.2.0`](https://github.com/flyingrobots/bijou/releases/tag/v4.2.0)

---

## v4.1.0 — Runtime Engine and DOGFOOD Maturation

- **Completed:** 2026-04-04
- **Summary:** Runtime engine through RE-006, DOGFOOD maturation (DF-021 through DF-026), i18n packages, explicit layer objects, layer-stack routing. See [4.1.0 release docs](releases/4.1.0/whats-new.md).
- **Ref:** [`v4.1.0`](https://github.com/flyingrobots/bijou/releases/tag/v4.1.0)

---

## v4.0.0 — Pure Surface Release

- **Completed:** 2026-03-22
- **Summary:** Shipped the major pure-surface runtime and design-system conformance work from branch `feat/v4-pure-v3-release`: raw string `App.view` removal, surface-native frame shell/body/chrome/transitions, structured overlay content, surface-native layout and scrolling primitives (`flexSurface`, `viewportSurface`, `placeSurface`, `pagerSurface`, `splitPaneSurface`, `gridSurface`), surface-native shell utilities (`statusBarSurface()`, `helpViewSurface()`, `helpShortSurface()`, `helpForSurface()`), transition shader API normalization, viewport masking doctrine, example/canary bridge burn-down, CI/documentation gates for component-family completeness, release-facing README cleanup, and the Apache-2.0 licensing switch for published packages.
- **Ref:** [`v4.0.0`](https://github.com/flyingrobots/bijou/releases/tag/v4.0.0), branch `feat/v4-pure-v3-release`

---

## Post-v3 repo tooling groundwork

- **Completed:** 2026-03-19
- **Summary:** Added merge-readiness and review-status tooling, shared release metadata validation, workflow action-runtime upgrades, and the first release-readiness/drill-down commands so release and PR hygiene can be checked locally before pushing.
- **Ref:** post-v3 tooling groundwork on `main`

---

## v2.0.0 — Tech Debt Cleanup

- **Completed:** 2026-03-08
- **Summary:** Resolved all items from code smell journal. Eliminated `process.env`/`process.stdout` fallbacks from bijou core (enforcing hexagonal port boundary), removed deprecated public exports (`getTheme`, `resolveTheme`, `_resetThemeForTesting`), routed eventbus `console.error` through `onError` port, and decomposed 1662-line `app-frame.ts` into 6 focused modules. BREAKING: `RuntimePort` now required in detection/resolver APIs.
- **Ref:** v2.0.0, branch `feat/tui-shader-transitions`

---

## v1.8.0 — The Big One

- **Completed:** 2026-03-08
- **Summary:** 13 items across 5 phases. Core bijou: custom fill chars for box(), constrain() maxWidth/maxHeight, note() form field, timer/stopwatch components (static + live controllers), dynamic wizard forms (transform/branch). TUI: panel minimize/fold/unfold, maximize/restore, dockable panel manager (keyboard reorder), layout presets + session restore with serialization. Housekeeping: commit pacing hook, PR reply script, code smell journal, dependency audit. 84 new tests.
- **Ref:** v1.8.0, branch `release/v1.8.0`

---

## v1.7.0 — Test Fortress

- **Completed:** 2026-03-08
- **Summary:** Deep audit of ROADMAP test coverage spec vs actual assertions. Resolved 3 spec-vs-impl mismatches. Added `defaultValues` option to multiselect (bug fix + feature). Filled nodeIO and chalkStyle adapter test gaps. Added 3 property-based fuzz suites via fast-check (forms, environment detection, DTCG). 1900 tests total, all passing.
- **Ref:** v1.7.0, branch `feat/v1.7.0-test-fortress`

---

## Xyph Migration

- **Completed:** 2026-03-08
- **Summary:** Xyph TUI dashboard fully migrated to bijou. All five phases (views/selection/writes, confirm/input overlays, review actions/detail panel, full DAG interactivity, animated title screen) integrated using bijou components, layout primitives, and theme presets.

---

## PR #34 — JSDoc Coverage Overhaul

- **Completed:** 2026-03-08
- **Summary:** Comprehensive JSDoc coverage across all packages. Fixed 6 pre-existing behavioral bugs (select/filter cancel labels, grid fractional inputs, tab validation, fitBlock dedup, WritePort type dedup, enumerated-list DRY). Extracted `createThemeAccessors` to deduplicate accessor wiring. Added `style` option to `createTestContext`, eliminating 12 double-cast patterns. 5 rounds of CodeRabbit review — 18 items fixed, 12 declined with evidence.
- **Ref:** [PR #34](https://github.com/flyingrobots/bijou/pull/34)

---

## v1.6.0 — Terminal Whisperer + Test Audit

- **Completed:** 2026-03-07
- **Summary:** F-key parsing (F1–F12, CSI + SS3 encodings, modifier combos), cursor manager (DECSCUSR block/underline/bar with blink), underline text variants (standard, curly, dotted, dashed via SGR 4:x), `detectColorScheme` env accessor refactor. Test audit: 24 new tests filling coverage gaps across forms, test adapters, DTCG, and chalk adapter.
- **Ref:** [`9340854`](https://github.com/flyingrobots/bijou/commit/9340854) (release commit on `feat/v1.6.0-app-shell-primitives`)

---

## v1.5.0 — Polish & Patterns

- **Completed:** 2026-03-07
- **Summary:** Completed Phases 5 (mode rendering), 6 (test hardening), 7 (theme accessors), and 7b (style pass). Added `gradient()` accessor to BijouContext, migrated all remaining direct theme accesses to typed accessors, relaxed brittle test assertions, and added background color support to 7 components (alert, kbd, tabs, accordion, table, stepper, breadcrumb).
- **Ref:** [`5071dca`](https://github.com/flyingrobots/bijou/commit/5071dca) (release commit on `feat/v1.5.0-polish-and-patterns`)

---

## v1.4.0 — Transitions, Showcase & Architecture

- **Completed:** 2026-03-07
- **Summary:** Tab transition animations (wipe, dissolve, grid, fade, melt, matrix, scramble) with composable shader system. Interactive component showcase app. Scrollable multiselect viewport. Mode rendering strategy (OCP) and decentralized theme access (DIP) architecture refactors. Transition generation guards for rapid tab switching.
- **Ref:** v1.4.0, branch `feat/phase-5-7-refactor`

---

## v1.3.0 — App Shell Foundations

- **Completed:** 2026-03-06
- **Summary:** Phase 8 and 9 complete. `splitPane()` layout primitive with pure state reducers. `grid()` CSS Grid-inspired layout with fixed/fr tracks and named areas. `createFramedApp()` TEA app shell with tabs, pane focus, scroll isolation, help toggle, command palette, and panel-scoped overlays. `drawer()` expanded with top/bottom anchors and region-scoped mounting. Scrollable `select()` with `maxVisible`. `@flyingrobots/bijou-tui-app` batteries-included skeleton and `create-bijou-tui-app` scaffolder.
- **Ref:** v1.3.0, [PR #31](https://github.com/flyingrobots/bijou/pull/31)

---

## PR #28 Review Improvements + PR #29 CodeRabbit Fixes

- **Completed:** 2026-03-04
- **Summary:** 77-item self-code-review: vim-style filter modes, bitwise arrow encoding, shader-based DAG edges, clearRender/scrolling fixes, markdown code span isolation, textarea defaultValue handling, CJK DAG rendering, and various validation hardening.
- **Ref:** [PR #28](https://github.com/flyingrobots/bijou/pull/28), [PR #29](https://github.com/flyingrobots/bijou/pull/29)

---

## v1.0.0 — Architecture audit remediation (Phases 1–3)

- **Completed:** 2026-03-02
- **Summary:**
  - ISP port segregation (WritePort/QueryPort/InteractivePort/FilePort)
  - Form DRY extraction (5 shared utilities)
  - Background color support (TokenValue.bg, StylePort.bgHex/bgRgb, Theme.surface, bgToken on box/flex/modal/toast/drawer/tooltip)
  - Code review fixes: flex bg routing, DTCG surface unconditional, preset surface validation, tooltip bgToken parity
- **Ref:** [PR #26](https://github.com/flyingrobots/bijou/pull/26)

---

## v0.10.1 — JSDoc total coverage

- **Completed:** 2026-02-28
- **Summary:** Every exported and internal symbol across all three packages now has comprehensive JSDoc.
- **Ref:** [0.10.1](CHANGELOG.md#0101--2026-02-28)

---

## v0.10.0 — Canvas, mouse input, box width

- **Completed:** 2026-02-28
- **Summary:** Canvas shader primitive, opt-in SGR mouse protocol, box width override, clipToWidth promoted to core.
- **Ref:** [0.10.0](CHANGELOG.md#0100--2026-02-28)
