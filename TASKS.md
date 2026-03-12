# v2.0.0 — Tech Debt Cleanup

> Historical note: this checklist is complete. Post-v3 follow-up backlog items now live in `docs/ROADMAP.md` and `docs/CODERABBIT_REVIEW_NOTES.md`.

Clean up all items from `.claude/bad_code.md`. Items 3, 4, 5, and 7 were already resolved in prior work. Remaining: items 1-2 (process.env fallbacks), item 6 (app-frame decomposition), plus a new finding (console.error in eventbus.ts).

BREAKING CHANGE: Removes deprecated public exports (`getTheme`, `resolveTheme`, `isNoColor` standalone, `_resetThemeForTesting`).

---

## Phase 1: Eliminate `process` fallbacks from `ports/env.ts`

Root cause of items 1 and 2. The shared `createEnvAccessor()` and `createTTYAccessor()` in `packages/bijou/src/ports/env.ts` fall back to `process.env` / `process.stdout.isTTY` when no `RuntimePort` is provided. This violates the hexagonal port boundary.

- [x] **1.1 Make `RuntimePort` required in `createEnvAccessor` and `createTTYAccessor`** — In `packages/bijou/src/ports/env.ts`: change `runtime?: RuntimePort` to `runtime: RuntimePort`. Remove the `process.env` and `process.stdout.isTTY` fallback branches. Update tests in `packages/bijou/src/ports/env.test.ts`: remove `'falls back to process.env when no runtime is provided'` and `'falls back to process.stdout.isTTY when no runtime is provided'` tests.
- [x] **1.2 Make `RuntimePort` required in `detectOutputMode` and `detectColorScheme`** — In `packages/bijou/src/core/detect/tty.ts`: change `runtime?: RuntimePort` to `runtime: RuntimePort`. Remove `@deprecated` JSDoc tags. Update tests in `packages/bijou/src/core/detect/tty.test.ts`: remove `'falls back to process.stdout.isTTY when runtime is omitted'` test; update the zero-arg `detectColorScheme()` calls in the `'detectColorScheme'` describe block to pass a `mockRuntime` instead.
- [x] **1.3 Make `RuntimePort` required in `isNoColor`** — In `packages/bijou/src/core/theme/resolve.ts`: change `runtime?: RuntimePort` to `runtime: RuntimePort`. Remove `@deprecated` JSDoc tag.
- [x] **1.4 Remove deprecated module-level functions from `resolve.ts`** — Delete `defaultResolver`, `getTheme()`, `resolveTheme()`, `_resetThemeForTesting()` (lines 179-212). Remove their exports from `packages/bijou/src/core/theme/index.ts` (lines 36-39: `isNoColor`, `getTheme`, `resolveTheme`, `_resetThemeForTesting`). Keep `isNoColor` in barrel but not `getTheme`/`resolveTheme`/`_resetThemeForTesting`. Remove from `packages/bijou/src/index.ts` (lines 72-74: `isNoColor`, `getTheme`, `resolveTheme`). Remove `_resetThemeForTesting` re-export from `packages/bijou/src/adapters/test/index.ts` (line 35).
- [x] **1.5 Rewrite `resolve.test.ts` to use `createThemeResolver` with `mockRuntime`** — Replace all tests that use `getTheme()`, `resolveTheme()`, `isNoColor()`, `_resetThemeForTesting()` with equivalent tests using `createThemeResolver({ runtime: mockRuntime(...) })`. The `createThemeResolver` tests already use this pattern and can serve as templates. Keep `createResolved` and `colorScheme` tests unchanged.
- [x] **1.6 Update example docs** — In `examples/theme/README.md`, `examples/README.md`, `examples/pipe/README.md`, and `docs/EXAMPLES.md`: replace any references to `resolveTheme()` or `detectOutputMode()` with `createThemeResolver()` / `createBijou()`.
- [x] **1.7 Verify zero `process.` references in bijou core** — Run `grep -r 'process\.' packages/bijou/src/ --include='*.ts' | grep -v '.test.ts' | grep -v 'node_modules'` and confirm no hits (excluding comments).
- [x] **1.8 Run tests** — `pnpm vitest run --config vitest.config.ts` from root. All tests must pass.

## Phase 2: Route `console.error` through a port in `eventbus.ts`

- [x] **2.1 Add `onError` option to `CreateEventBusOptions`** — In `packages/bijou-tui/src/eventbus.ts`: add `onError?: (message: string, error: unknown) => void` to `CreateEventBusOptions`. Replace the three `console.error(...)` calls (lines 216, 219, 220) with `busOptions?.onError?.(message, error)` — if neither `onCommandRejected` nor `onError` is provided, silently drop (the error is already unrecoverable at that point). Update `packages/bijou-tui/src/eventbus.test.ts`: change `'logs rejected commands when no rejection handler is configured'` test to verify NO `console.error` is called. Change `'logs both errors if onCommandRejected throws'` test to verify errors are routed through `onError`.
- [x] **2.2 Run tests** — `pnpm vitest run --config vitest.config.ts` from root.

## Phase 3: Decompose `app-frame.ts` (1662 lines)

Pure refactor — extract internal functions into focused modules. The public API surface (`createFramedApp` + exported types) stays in `app-frame.ts`. All existing tests must pass unchanged.

- [x] **3.1 Extract types** — Create `packages/bijou-tui/src/app-frame-types.ts` with all internal types: `InternalFrameModel`, `PaletteEntry`, `RenderContext`, `RenderResult`, `FrameAction`, `PaletteAction`, `PageScopedMsg`, `FrameScopedMsg`, symbols `PAGE_MSG_TOKEN`/`FRAME_MSG_TOKEN`, and message utilities (`isFrameScopedMsg`, `wrapFrameMsg`, `isPageScopedMsg`, `wrapPageMsg`, `emitMsg`, `emitMsgForPage`, `wrapCmdForPage`, `comboToMsg`). Keep public types (`FramePage`, `FrameCommandItem`, `FrameLayoutNode`, etc.) in `app-frame.ts`.
- [x] **3.2 Extract utilities** — Create `packages/bijou-tui/src/app-frame-utils.ts` with pure utility functions: `collectPaneIds`, `declaredAreaNames`, `assertUniquePaneIds`, `findPaneNode`, `isPaneMinimized`, `mergeMaps`, `offsetRect`, `frameBodyRect`, `fitLine`, `mergeBindingSources`, `createFrameKeyMap`.
- [x] **3.3 Extract rendering** — Create `packages/bijou-tui/src/app-frame-render.ts` with: `renderFrameNode`, `renderMissingGridCell`, `renderPageContent`, `renderMaximizedPane`, `renderHeaderLine`, `renderHelpLine`, `stringToGrid`, `renderTransition`.
- [x] **3.4 Extract actions** — Create `packages/bijou-tui/src/app-frame-actions.ts` with: `applyFrameAction`, `switchTab`, `cyclePane`, `scrollFocusedPane`, `applyToggleMinimize`, `applyToggleMaximize`, `applyDockMove`, `syncPageFrameState`, `createTransitionTickCmd`.
- [x] **3.5 Extract command palette** — Create `packages/bijou-tui/src/app-frame-palette.ts` with: `handlePaletteKey`, `openCommandPalette`, `buildPaletteEntries`.
- [x] **3.6 Update `app-frame.ts`** — Import from the extracted modules. Re-export public types. The main file should contain only `createFramedApp()` plus the public type definitions (~350 lines).
- [x] **3.7 Run tests** — `pnpm vitest run --config vitest.config.ts` from root. All 555 lines of `app-frame.test.ts` must pass unchanged.

## Phase 4: Finalize

- [x] **4.1 Update `docs/CHANGELOG.md`** — Add `[Unreleased]` / `[2.0.0]` section with breaking changes and improvements.
- [x] **4.2 Bump version** — All packages to `2.0.0` (lock-step).
- [x] **4.3 Update `docs/ROADMAP.md`** — Add v2.0.0 milestone entry (struck through) and move to shipped table.
- [x] **4.4 Update `docs/COMPLETED.md`** — Add v2.0.0 entry.
- [x] **4.5 Clear `.claude/bad_code.md`** — Check off all resolved items, purge checked items.
- [x] **4.6 Final test run** — `pnpm vitest run --config vitest.config.ts` from root.
