# Audit Fix: Hex/SOLID/DRY/Platform (Tier 2)

Four fixes on `release/v1.8.0` from the four-dimension audit.

---

## Fixes

- [x] **2B. Deduplicate HIDE_CURSOR / SHOW_CURSOR across packages** — Exported `HIDE_CURSOR`, `SHOW_CURSOR`, `CLEAR_LINE_RETURN` from bijou barrel via `core/ansi.ts`. Replaced local constants in bijou-tui's `screen.ts` with re-exports from `@flyingrobots/bijou`.
- [x] **2D. Move test-only exports to dedicated entry point** — Removed `_resetDefaultContextForTesting` and `_resetThemeForTesting` from main barrel. Re-exported from `@flyingrobots/bijou/adapters/test`. Updated external import sites in bijou-tui and bijou-node test files.
- [x] **2A. Consolidate process.env fallbacks + deprecate no-runtime APIs** — Extracted `createEnvAccessor()` and `createTTYAccessor()` into `ports/env.ts`. Replaced local `envAccessor()` in `tty.ts` and `resolve.ts`. Added `@deprecated` JSDoc to `detectOutputMode()`, `detectColorScheme()`, `isNoColor()`, `getTheme()`, `resolveTheme()`.
- [x] **2C. Deprecate freestanding styled() / styledStatus()** — Added `@deprecated` JSDoc to both functions in `styled.ts` with guidance to use `ctx.style.styled()` instead.
