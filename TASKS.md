# v1.8.0 — The Big One

All 13 items across 5 phases: housekeeping, core small wins, core medium features, TUI panel management, and ship.

---

## Phase 1: Housekeeping (branch: `chore/v1.8.0-housekeeping`)

- [x] **1A. Dependency Audit** — Run `npm audit`, verify chalk/devDeps are maintained and MIT-licensed. Document in PR description (no file changes needed). All clean: 0 CVEs, all MIT, all maintained.
- [x] **1B. Code Smell Sweep** — Populate `.claude/bad_code.md` with 6 findings: `process.env` fallbacks in `tty.ts`/`resolve.ts`, duplicated `envAccessor` pattern, `process.env`/`console.warn` in `split-pane.ts`/`app-frame.ts`, `_reset*ForTesting` exports, `app-frame.ts` 1400+ lines, engine `>=20` vs `>=18` inconsistency.
- [x] **1C. Commit Pacing Hook** — Modify `scripts/hooks/pre-push` to add commit-count check before `npm test`. Read stdin refs, count local-only commits via `git rev-list`. Warn (don't block) if >10 commits (configurable via `BIJOU_PUSH_COMMIT_LIMIT`).
- [x] **1D. PR Reply Script** — Create `scripts/reply-to-reviews.sh`. Uses `gh api` to reply to individual CodeRabbit review threads. Two modes: interactive (prompt per thread) and batch (`--resolve-all "message"`). Filters by `coderabbitai[bot]` author, skips threads with existing human replies.

## Phase 2: Core Small Wins (branch: `feat/v1.8.0-core-small-wins`)

- [x] **2A. Custom Fill Chars** — Add `fillChar?: string` to `BoxOptions` in `packages/bijou/src/core/components/box.ts`. Replace hardcoded spaces in padding areas with `fillChar`. Validate single-width via `graphemeWidth()`. Tests: fillChar renders in padding, wide-char fallback, pipe/accessible passthrough.
- [x] **2B. MaxWidth / MaxHeight (`constrain()`)** — Create `packages/bijou/src/core/components/constrain.ts` + test. `constrain(content, { maxWidth?, maxHeight?, ellipsis?, ctx? })` → string. Uses `clipToWidth()` per line for width, truncates line array for height. Pipe/accessible: passthrough. Interactive/static: apply constraints. Ellipsis appended when clipped. Update barrel exports.
- [x] **2C. Note Field** — Create `packages/bijou/src/core/forms/note.ts` + test. `note({ message, title?, ctx? }): Promise<void>`. Interactive: info icon + bold title + muted message, left accent line. Fallback: plain text `"Note: {message}"`. Compatible with `group()`/`wizard()`. Update barrel exports.

## Phase 3: Core Medium Features (branch: `feat/v1.8.0-core-medium`)

- [x] **3A. Timer / Stopwatch** — Create `packages/bijou/src/core/components/timer.ts` + test. Static `timer(ms, opts)` renders `MM:SS` / `HH:MM:SS` / `MM:SS.mmm`. Live `createTimer({ duration, onComplete?, interval? })` and `createStopwatch({ interval? })` with `start/pause/resume/stop/elapsed`. Follow spinner/progressBar controller pattern. Update barrel exports.
- [x] **3B. Dynamic Forms** — Modify `packages/bijou/src/core/forms/wizard.ts` + test. Add `transform?` and `branch?` to `WizardStep<T, K>`. `transform`: called before `field()`, returns replacement field function or void. `branch`: called after value, returns steps to splice in. Convert to index-based iteration over mutable copy.

## Phase 4: TUI Panel Features (branch: `feat/v1.8.0-panel-management`)

- [x] **4A. Panel Minimize/Fold/Unfold** — Create `packages/bijou-tui/src/panel-state.ts` + test. State: `PanelVisibilityState` with `minimized: ReadonlySet<string>`. Functions: `createPanelVisibilityState`, `toggleMinimized`, `minimizePane`, `restorePane`, `isMinimized`. FrameModel addition: `minimizedByPage`. Rendering: minimized panes collapse to 1-2 row title bar, sibling gets remaining space. Keybinding: `ctrl+m`. Update barrel exports.
- [x] **4B. Panel Maximize/Restore** — Modify `packages/bijou-tui/src/panel-state.ts`, `app-frame.ts`, `index.ts`. State: `PanelMaximizeState` with `maximizedPaneId`. FrameModel addition: `maximizedPaneByPage`. Rendering: if maximized, render only that pane at full `bodyRect`. Keybinding: `ctrl+f`. Per-page state. Maximizing a minimized pane restores it first.
- [x] **4C. Dockable Panel Manager** — Create `packages/bijou-tui/src/panel-dock.ts` + test. State: `PanelDockState` with `orderByContainer`. Functions: `createPanelDockState`, `movePaneInContainer`, `resolveChildOrder`. FrameModel addition: `dockStateByPage`. Rendering: consults dock state to determine child order. Helper: `findPaneContainer(node, paneId)`. Keybinding: `ctrl+shift+arrow`.
- [x] **4D. Layout Presets + Session Restore** — Create `packages/bijou-tui/src/layout-preset.ts` + test. Types: `SerializedPageLayout`, `SerializedLayoutState`, `LayoutPreset`. Functions: `serializeLayoutState`, `restoreLayoutState`, presets `presetSideBySide`, `presetStacked`, `presetFocused`. Integration: `initialLayout?` option on `createFramedApp`.

## Phase 5: Ship

- [x] **Version bump** — All 5 packages → 1.8.0.
- [x] **Documentation** — `docs/CHANGELOG.md` `[1.8.0]` section, `docs/ROADMAP.md` strike completed items, `docs/COMPLETED.md` add entry, package READMEs if needed.
- [x] **Final validation** — `npm run build` clean, `npm run lint` zero errors/warnings, `npm test` 1985 passed, 12 skipped, 0 failures.
- [ ] **PR** — PR to main from release/v1.8.0 branch.
