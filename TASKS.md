# Audit Fix: Hex/SOLID/DRY/Platform (Tier 1)

Six low-risk fixes on `release/v1.8.0` from the four-dimension audit.

---

## Fixes

- [x] **1D. Make `WritePort.writeError` required** — Removed `?` from `WritePort.writeError` in `ports/io.ts`. Updated `resolve.ts` to drop nil-check. `mockIO()` and `nodeIO()` already provide it.
- [x] **1A. Extract shared ANSI strip regex** — Added `ANSI_SGR_RE` and `stripAnsi()` to `grapheme.ts`. Re-exported from `core/text/index.ts` and public barrel. Replaced inline regex in `clip.ts`, `table.ts`, `dag-render.ts`. Removed 4 duplicate definitions.
- [x] **1B. Extract line-clear constant** — Created `core/ansi.ts` with `CLEAR_LINE_RETURN`, `HIDE_CURSOR`, `SHOW_CURSOR`. Replaced raw `'\r\x1b[K'` in spinner, progress, timer, form-utils. Replaced raw cursor constants in `cursor-guard.ts`. Removed 6 files from ANSI lint allowlist.
- [x] **1C. Extract form scroll/navigation helpers** — Added `clampScroll()` and `handleVerticalNav()` to `form-utils.ts`. Updated `select.ts` and `multiselect.ts` to use them.
- [x] **1E. Fix bijou-tui-app version/engine mismatch** — Updated deps to `1.8.0`, engine `>=18`.
- [x] **1F. Replace `console.warn` in bijou-tui** — Replaced `console.warn` in `app-frame.ts` with `resolveSafeCtx()?.io.writeError()`. Refactored `split-pane.ts` `warnInvalidRatio` to accept optional `WritePort`, removed `process.env`/`typeof process` sniffing.
