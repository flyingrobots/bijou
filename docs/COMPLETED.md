# Completed Milestones

Shipped work, newest first. See `docs/CHANGELOG.md` for detailed release notes.

---

## v1.0.0 — Architecture audit remediation (Phases 1–3)

- **Completed:** 2026-03-02
- **Summary:** ISP port segregation (WritePort/QueryPort/InteractivePort/FilePort), form DRY extraction (5 shared utilities), background color support (TokenValue.bg, StylePort.bgHex/bgRgb, Theme.surface, bgToken on box/flex/modal/toast/drawer/tooltip). Code review fixes: flex bg routed through StylePort, DTCG surface unconditional, preset surface validation, tooltip bgToken parity.
- **Ref:** PR #26

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
