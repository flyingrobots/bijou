# Completed Milestones

Shipped work, newest first. See [CHANGELOG.md](CHANGELOG.md) for detailed release notes.

---

## v1.6.0 — Terminal Whisperer + Test Audit

- **Completed:** 2026-03-07
- **Summary:** F-key parsing (F1–F12, CSI + SS3 encodings, modifier combos), cursor manager (DECSCUSR block/underline/bar with blink), underline text variants (standard, curly, dotted, dashed via SGR 4:x), `detectColorScheme` env accessor refactor. Test audit: 24 new tests filling coverage gaps across forms, test adapters, DTCG, and chalk adapter.
- **Ref:** v1.6.0, branch `feat/v1.6.0-app-shell-primitives`

---

## v1.5.0 — Polish & Patterns

- **Completed:** 2026-03-07
- **Summary:** Completed Phases 5 (mode rendering), 6 (test hardening), 7 (theme accessors), and 7b (style pass). Added `gradient()` accessor to BijouContext, migrated all remaining direct theme accesses to typed accessors, relaxed brittle test assertions, and added background color support to 7 components (alert, kbd, tabs, accordion, table, stepper, breadcrumb).
- **Ref:** v1.5.0, branch `feat/v1.5.0-polish-and-patterns`

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
