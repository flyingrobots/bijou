# PR Self-Review Fixes

Fixes from self-review of `release/v1.8.0` vs `main`.

---

## Fixes

- [x] **Fix 1: `ANSI_SGR_RE` — remove `/g` flag** — Removed `/g` from shared constant to prevent `lastIndex` bugs. Callsites use `new RegExp(ANSI_SGR_RE, 'g')` for replacement.
- [x] **Fix 2: Timer double-start leaks interval handle** — `start()` now calls `stopInternal()` first to cancel any existing timer.
- [x] **Fix 3: Timer `elapsed()` / `pause()` stale values** — `elapsed()` computes live value when running; `pause()` uses `Date.now() - startTime`.
- [x] **Fix 4+5: CHANGELOG merge + test count** — Merged `[Unreleased]` into `[1.8.0]`; updated test count from 84 to 109.
- [x] **Fix 6: pre-push hook squashing suggestion** — Removed "squashing" from commit pacing warning.
- [x] **Fix 7: `constrain.ts` explicit `maxWidth=0` guard** — Added early return for `maxWidth=0`; updated `maxHeight` JSDoc.
- [x] **Fix 8: `wizard.ts` max iteration guard** — Added `MAX_WIZARD_STEPS = 1000` constant with throw on exceed.
- [x] **Fix 9: `env.test.ts` complete RuntimePort mocks** — Added `stdinIsTTY` and `rows` to all three mock objects.
