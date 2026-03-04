# Completed Milestones

Shipped work, newest first. See [CHANGELOG.md](CHANGELOG.md) for detailed release notes.

---

## PR #28 Review Improvements + PR #29 CodeRabbit Fixes

- **Completed:** 2026-03-03
- **Summary:**
  - Vim-style normal/insert mode switching for `filter()`
  - Bitwise `encodeArrowPos()`/`decodeArrowPos()` replacing `GRID_COL_MULTIPLIER`
  - Shader-based `cellAt()` DAG edge rendering (replaces `charGrid`/`tokenGrid`)
  - `clearRender()` consistency fix for filter-interactive
  - Filter viewport scrolling (cursor stays visible past `maxVisible`)
  - Markdown code span isolation from bold/italic regex
  - Textarea empty submit now returns `defaultValue`
  - Markdown width validation prevents `RangeError` on negative/NaN
  - DAG `Map.get()` lookup replacing repeated `find()`, duplicate test fixture cleanup
  - CHANGELOG/ROADMAP tactical detail trimming
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
