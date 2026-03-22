# Changelog

All notable changes to this project will be documented in this file.

All packages (`@flyingrobots/bijou`, `@flyingrobots/bijou-node`, `@flyingrobots/bijou-tui`, `@flyingrobots/bijou-tui-app`, `create-bijou-tui-app`) are versioned in lock-step.

## [Unreleased]

### ✨ Features

- **Notification history center** — `@flyingrobots/bijou-tui` now exposes `renderNotificationHistory()` / `countNotificationHistory()`, and the framed notification lab can open a scrollable history modal from the command palette or `Shift+H`, with filter cycling and archived actionable/error review.
- **Shared TUI design-language defaults** — `@flyingrobots/bijou-tui` now centralizes compact-viewport detection plus overlay/notification inset defaults, so modals, toasts, and the notification lab share one cell-based spacing policy instead of drifting on local magic numbers.
- **Pointer policy + shell mouse routing** — `@flyingrobots/bijou-tui` now documents keyboard-first mouse policy, lets framed apps route click interactions through shell tabs and notification stacks, exposes notification hit-testing helpers, and enables the notification demo to run in real mouse mode.
- **Surface-native flex and viewport APIs** — `@flyingrobots/bijou-tui` now ships `flexSurface()` and `viewportSurface()`, so apps can keep layout and scrolling on the structured `Surface` path instead of flattening rich content into multiline strings at the composition boundary.
- **Structured overlay content** — `@flyingrobots/bijou-tui` now lets `modal()`, `drawer()`, and `tooltip()` accept either plain strings or structured `Surface` content, so rich overlay rows and embedded component surfaces can stay structured through the overlay renderer instead of being flattened first.
- **Surface-native stack and placement APIs** — `@flyingrobots/bijou-tui` now ships `placeSurface()` alongside `vstackSurface()` / `hstackSurface()`, giving the layout family a complete structured composition path for rich TUI views instead of forcing callers back through string-first stack/placement helpers.
- **Surface-native pager and focus-area panes** — `@flyingrobots/bijou-tui` now ships `pagerSurface()` and `createPagerStateForSurface()`, rounding out the existing `focusAreaSurface()` path so scrollable panes with status or focus chrome can stay on the `Surface` path instead of dropping through text-first viewport helpers.
- **Normalized transition shader override API** — `@flyingrobots/bijou-tui` transition shaders now expose `overrideChar`, `overrideCell`, and `overrideRole` instead of the old text-era `char` / `charRole` naming, keeping the public contract aligned with the surface-native renderer and combinator semantics.
- **Example bridge burn-down in core demos** — the `badge`, `pipe`, and `theme` examples now compose badge/status rows as structured `Surface` content and only lower once at the outer text endpoint, leaving the showcase badge preview as the only intentional `surfaceToString(badge(...))` teaching site.
- **Surface-native showcase preview contract** — the showcase component explorer now accepts either string or `Surface` previews per entry and lowers once per mode panel, so rich component demos like `badge()` can stay structured all the way through the preview path.

### 📝 Documentation

- **Design-system docs foundation** — added a new `docs/design-system/` section covering foundations, interaction/pattern policy, component families, and data-visualization guidance, plus linked that guidance from the root and package README entry points.
- **Component-family graceful lowering coverage** — the component-family design-system guide now documents graceful lowering and related-family guidance across the shipped semantic families, so the docs more honestly match the Carbon-style standard they claim to enforce.
- **Overlay doctrine and surface-native examples** — the design-system pattern docs, family docs, package README, and TUI guide now give sharper overlay/interruption guidance and lead with `compositeSurface(...)` for modal/toast composition instead of teaching the string-first overlay path as the default.
- **Shell and workspace doctrine** — the design-system and `@flyingrobots/bijou-tui` docs now more explicitly distinguish shell chrome from page content, clarify when to use `createFramedApp()`, `splitPane()`, and `grid()`, and tighten the content guidance for tabs, status rails, and workspace regions.
- **Design-system docs completeness gate** — the component-family guide now includes `Content guidance` for every shipped family, and the repo now ships a `docs:design-system:preflight` script that fails when required family-doc sections or lowering modes are missing.
- **Surface-first shader authoring docs** — the `@flyingrobots/bijou-tui` README, GUIDE, migration guide, and transitions example docs now document the normalized transition shader override contract and show surface-first custom shader authoring for v4.
- **Surface-first badge and theme examples** — the `badge()` and theme example docs now show structured surface composition with one explicit lowering step at the outer `console.log(...)` boundary instead of teaching per-badge string bridging.
- **Showcase preview docs** — added a dedicated showcase README and linked it from the examples index so the structured preview contract is documented instead of being implied by code.
- **Component-family decision guidance** — public package READMEs and example docs now explain when to choose `alert()` versus `toast()` versus the notification system, and when to choose `table()` / `tableSurface()` versus `navigableTable()`, instead of presenting those families as unrelated exports.
- **Pure-V4 migration naming guidance** — the V4 migration guide now calls out the canonical surface stack/composition names (`boxSurface()`, `vstackSurface()`, `hstackSurface()`) and explicitly drops the old transition-era `*V3` aliases.
- **Example helper naming cleanup** — the shared example surface helpers now live in `examples/_shared/example-surfaces.ts`, replacing both the transition-era `examples/_shared/v3.ts` path and the separate `surface-bridge.ts` helper so the example fleet stops teaching V3-branded or one-off bridge module names while the repo moves toward V4-only guidance.
- **Overlay example surface-first migration** — the `toast`, `modal`, `drawer`, and `tooltip` demos now build background/help content as `Surface` values and compose overlays with `compositeSurface(...)`, so the examples finally teach the same surface-native overlay path the TUI docs now recommend.
- **Prompt example output cleanup** — the `select`, `input`, `confirm`, `filter`, and `multiselect` demos now report their result state in plain text instead of decorating prompt outcomes with badge bridges, keeping those examples focused on prompt patterns rather than unrelated component styling.
- **Runtime helper example cleanup** — the `chat`, `mouse`, `print-key`, and `composable` demos no longer teach badge-string bridges in their runtime views; event inspectors now compose modifier pills as surfaces, while string-first layout demos use plain semantic labels instead of reparsing badge output.
- **Shared showcase and canary bridge cleanup** — the canonical workbench, showcase detail views, transitions demo, and core static canary now avoid badge-string bridge residue where the badge component was not the thing being demonstrated, leaving the remaining bridges concentrated in actual badge-focused previews and a few string-first layout demos.

### 🐛 Fixes

- **GitHub Actions runtime compatibility** — CI, publish, and release dry-run workflows now use `actions/checkout@v6` and `actions/setup-node@v6`, clearing the Node 20 action-runtime deprecation warning path before GitHub flips the default to Node 24.
- **Example badge-bridge burn-down (batch 1)** — several line-oriented runtime demos (`package-manager`, `spinner`, `progress-*`, `spring`, and `timeline-anim`) now compose badges and rows as `Surface` values via shared example helpers instead of round-tripping through `surfaceToString(badge(...))`.
- **Framed-shell pure-V4 boundary enforcement** — `createFramedApp()` now fails explicitly when a pane renderer returns a raw string instead of a `Surface` or `LayoutNode`, and the canonical workbench, showcase, and transitions demos now cross that boundary with explicit ANSI-to-surface bridges instead of relying on accidental runtime fallthrough.
- **Surface-native framed pane scrolling** — the framed shell now keeps pane rendering on the `Surface` path while applying focus gutters and scroll bounds, so pane views are no longer converted back into strings before focus-area rendering and scroll math run.
- **Surface-native frame shell body composition** — `createFramedApp()` now composes page bodies from rendered pane `Surface`s instead of stitching pane text back together first, so split/grid/maximized page content stays on the surface path all the way through shell composition and only transition shaders still drop to the text-grid bridge they require.
- **Surface-native transition shaders** — page transitions now blend rendered `Surface` cells directly instead of tokenizing styled strings into text grids first, so shader overrides can carry real cell styling and the framed shell no longer has to stringify pane surfaces just to animate between pages.
- **Surface-native shell chrome** — framed-app header and help lines now resolve BCSS text styling straight into full-width `Surface` rows, so shell chrome backgrounds and modifiers no longer depend on emitting styled strings and reparsing them into cells.
- **Surface-backed overlay family** — `modal()`, `toast()`, `drawer()`, and `tooltip()` now all return an explicit `surface` alongside their string content, and the overlay module now exposes `compositeSurface(...)` so overlay composition can stay on the `Surface` path instead of forcing ANSI-string splicing first.
- **Surface-native overlay constructors** — the overlay family now constructs `Surface` objects directly and derives `content` from that surface only as an explicit lowering path, so modal, toast, drawer, and tooltip rendering no longer depends on building full ANSI strings and reparsing them internally.
- **Notification history filtering and modal safety** — actionable archived notifications are now filtered by variant instead of custom action payload presence, the notification history center blocks background notification shortcuts while open, and the demo initializes framed shell dimensions from the injected runtime so the compact-terminal history modal clamps and wraps correctly.
- **Release dry-run artifact action compatibility** — the release dry-run workflow now uses `actions/upload-artifact@v7`, matching the current Node 24-compatible action runtime.
- **Surface-native layout example migration** — the `chat`, `composable`, `split-editors`, and `flex-layout` demos now use `flexSurface()` / `viewportSurface()` instead of string-first layout boundaries, and the shared example surface helpers now call the stack helpers with their actual surface-native signatures.
- **Structured overlay example migration** — the `modal`, `drawer`, and `tooltip` demos now pass structured `Surface` content into the overlay family, and the public overlay docs now document structured content as the preferred path when rich TUI layout matters inside an interruption layer.
- **Workspace layout doctrine update** — the layout-family docs and public TUI guides now explicitly treat `vstackSurface()` / `hstackSurface()` / `placeSurface()` as the canonical rich-TUI composition path and frame `vstack()` / `hstack()` / `place()` as explicit text-composition or lowering tools.
- **Scrollable pane doctrine update** — the design-system family guide now has a dedicated `pager()` / `focusArea()` family, and the package/example docs now teach `pagerSurface()` and `focusAreaSurface()` as the canonical rich-TUI path while leaving the string renderers as explicit lowering helpers.

## [3.1.0] - 2026-03-18

### ✨ Features

- **Stacked notification overlays** — `@flyingrobots/bijou-tui` now ships a reusable notification stack with actionable, inline, and toast variants; configurable placement/duration/action payloads; stacked screen-edge rendering; and animated enter/exit transitions, plus a new framed `examples/notifications` lab for interactive evaluation.
- **Surface-first companion primitives** — added `boxSurface()`, `headerBoxSurface()`, `separatorSurface()`, `alertSurface()`, and `tableSurface()` so V3 apps can keep common layout/status composition on the `Surface` path instead of dropping back through explicit string bridges.
- **Deterministic clock port and test adapter** — `BijouContext` now supports a shared `clock` port, and the test adapters now ship `mockClock()` so runtime code and component tests can fake wall-clock time without reaching for Node globals.
- **Idle-aware scripted driver controls** — `runScript()` now supports configurable pulse frequency, and the TUI event bus exposes explicit command-idle tracking so deterministic tests can wait for real command completion instead of sprinkling `setTimeout(...)` heuristics.

### 🐛 Fixes

- **Notification stack rendering and routing** — notification overlays now preserve full-card background fill, dismissed notifications use a longer visible exit phase, placement changes relocate and re-enter the active stack instead of leaving it visually stuck, overflowed notifications animate through a dedicated exit lane before they are archived, and framed apps can auto-route runtime warnings/errors into toast notifications while still writing to stderr.
- **Scaffold canary PTY shutdown race** — the PTY driver now treats queued late input/resize steps as no-ops once the child exits, preventing traceback noise from masking the actual canary failure.
- **PR status helper edge cases** — canceled checks now fail the review-status exit code, nullable review authors fall back safely, and the release dry-run workflow labels its lint step accurately.
- **Release dry-run peer pin validation** — the dry-run metadata gate now checks internal `peerDependencies` as well, so it matches the lock-step validation performed by the real publish workflow.
- **Packed scaffold bin test stability** — the packed `create-bijou-tui-app` bin-shim test now disables npm audit/fund/script overhead and uses explicit subprocess timeouts so it stays reliable under full-suite load.
- **Shared release validation script** — publish and dry-run workflows now use one repo script for tag parsing, lock-step package version checks, and internal dependency pin validation, with a matching local `npm run release:preflight` command.
- **Release preflight metadata and semver validation** — local `npm run release:preflight` now emits the derived `version` / `notes_tag` metadata, derives `--current-version` from discovered workspace manifests instead of assuming `packages/bijou`, and rejects leading-zero semver identifiers before npm can reject them later.
- **Packed scaffolder CLI execution path** — packaged `create-bijou-tui-app` verification now asserts the installed npm bin shim exists and invokes that installed shim directly after tarball install, keeping the packaged-path guarantee without paying for an extra `npm exec` hop.
- **PR merge-readiness tooling** — `pr:review-status` now collapses to the latest non-automated review per reviewer, ignores draft/pending reviews without `submittedAt`, prefers GitHub author metadata for bot detection, treats `mergeStateStatus=UNKNOWN` as pending while GitHub computes mergeability, honors GitHub `reviewDecision` / `mergeStateStatus`, fails fast if PR comment/review/thread metadata would be truncated, and down-ranks stale historical CodeRabbit rate-limit comments when a newer green or live pending bot signal exists; `pr:merge-readiness` adds a one-command merge gate summary on top of those signals and labels pending states separately from hard blockers.
- **Surface alert option parity** — `AlertOptions` now includes `borderToken`, and both `alert()` and `alertSurface()` honor custom border overrides while the surface path drops a redundant string nullish-coalescing fallback.
- **Surface primitive clipping and Unicode guardrails** — `boxSurface()` now clips constrained content inside the inner box instead of letting it overwrite borders, and the new text-based surface helpers now fail loudly on wide graphemes until the `Surface` model grows true wide-cell support.
- **Surface fixed-width normalization** — `boxSurface()` now normalizes fractional or negative fixed widths before border and blit math runs, so constrained boxes preserve their borders instead of drifting past the actual allocated surface width.
- **Surface title and table width parity** — `boxSurface()` now widens auto-sized boxes to account for long titles like `box()`, and `tableSurface()` now normalizes explicit column widths before layout math so fractional widths cannot corrupt the underlying `Surface` grid.
- **Surface background metadata parity** — `boxSurface()` now preserves interior background cells even when `ctx` is `noColor`, so the returned `Surface` model stays consistent and render policy decides whether color is emitted.
- **Pulse-driven TUI timing** — `tick()`, framed-page transitions, runtime render scheduling, and live timer/log/spinner/progress helpers now route through the shared clock/pulse seams instead of mixing raw `Date.now()`, `setTimeout(...)`, and `setInterval(...)` into component logic.
- **Deterministic test cleanup** — high-signal TUI tests now use `mockClock()`, explicit event-bus idleness, and deterministic temporary paths instead of wall-clock sleeps and random missing-file names.
- **Deterministic command and timer drains** — event-bus `drain()` now settles even when commands throw synchronously, and `mockClock.runAll()` now fails loudly instead of spinning forever when live intervals remain active.
- **Runtime timer-handle cleanup** — interactive runtime renders and shutdown flushes now dispose their scheduled timeout handles after firing, so deterministic clocks do not retain stale timeout bookkeeping after the app exits.
- **Deterministic Ctrl+C quit guard** — interactive runtime now treats “no prior Ctrl+C” distinctly from “Ctrl+C at time zero,” so injected clocks that start at `0` still forward the first Ctrl+C to the app instead of force-quitting immediately.
- **Deterministic runtime test lint compliance** — the Ctrl+C-at-time-zero regression test now disposes its timeout handles with a block-bodied loop so it satisfies the repo’s iterable-callback-return lint rule without changing behavior.
- **Deterministic runtime test helper cleanup** — the tracking clock helper in `runtime.test.ts` now passes timeout callbacks directly to the base clock instead of wrapping them in a no-op forwarding closure.
- **Shared runtime viewport overlay** — the main TUI runtime and the worker host/proxy now share one viewport overlay helper, so dimension sanitization and mutable resize state stay consistent across scripted runs, interactive resizes, and worker handoff.
- **Clock-driven test scheduling** — the remaining timer-sensitive runtime, command, component, and I/O adapter tests now use injected `mockClock()` instances instead of Vitest fake timers, and the Node/test I/O adapters accept clock injection so those tests never have to touch wall-clock scheduling.
- **Worker proxy test seams** — `runInWorker()` and `startWorkerApp()` now accept explicit worker-thread bindings, so the proxy-runtime tests can assert host/worker IPC behavior without module-reset mock churn.
- **Workflow and smoke harness hardening** — `smoke-all-examples` now exposes testable launcher/path helpers with focused unit coverage, the repo ships a local `workflow:shell:preflight` command for validating workflow shell blocks before CI is first to see them, and the PTY driver has extra shutdown-ordering coverage for late labeled steps after child exit.
- **Release readiness gate** — the repo now ships `npm run release:readiness`, a single local command that runs the build, test, frame-regression, smoke, workflow-shell, and release-preflight bars in release order instead of relying on tribal knowledge.

### 🧪 Tests

- **Deterministic frame regressions** — added repo-level frame assertion helpers plus scripted frame snapshots for the scaffold shell and flagship V3 examples, with explicit resize assertions on the shell path, responsive narrow/wide frame coverage for the BCSS demo, and ANSI-preserving BCSS snapshots so style-only media-query regressions are locked as well as text/layout changes.

## [3.0.0] - 2026-03-12

### BREAKING CHANGES

- **Truthful V3 runtime contract** — `App.view` and framed pane renderers were formalized under the transition-era `ViewOutput` contract while the runtime moved toward surface/layout-native rendering.
- **Surface/string seams are explicit** — surface-native helpers such as `badge()` must be converted with `surfaceToString(surface, ctx.style)` when passed into string-first APIs.
- **`surfaceToString()` requires a style port** — callers must pass `ctx.style`.

### ✨ Features

- **Surface-native flagship runtime path** — the runtime, scripted driver, and framed shell boundary now normalize V3 output consistently instead of relying on lossy full-frame ANSI round-tripping.
- **Framed shell `ViewOutput` support** — framed panes can return `string`, `Surface`, or `LayoutNode`, which makes shell-based apps compatible with surface-native V3 panes.
- **BCSS release scope** — `run(app, { css })` now ships with documented selector, token, media-query, and supported-region behavior for `3.0.0`.
- **Fractal TEA lifecycle helpers** — `initSubApp()` and `updateSubApp()` join `mount()` and `mapCmds()` as the supported nested-app composition path.
- **Motion contract tightened** — keyed motion supports spring/tween interpolation and initial rect offsets through the documented V3 path.
- **Worker runtime and native recorder** — `runInWorker()`, `startWorkerApp()`, and the internal Surface-to-GIF recorder ship in `@flyingrobots/bijou-node`.
- **Canonical V3 demos** — `v3-demo`, `v3-css`, `v3-motion`, `v3-subapp`, `v3-worker`, and `v3-pipeline` now anchor the release story.
- **Hybrid example recording pipeline** — flagship V3 examples use native Surface recording while tape-backed examples can continue using VHS.

### 🐛 Fixes

- **Back-buffer convergence** — cleared surface cells now converge cleanly across successive renders instead of getting stuck behind stale diff state.
- **Flex remainder allocation** — leftover units after integer rounding are preserved so narrow flex layouts do not develop visible gaps.
- **Runtime viewport sync** — interactive resize now updates the runtime viewport source of truth used by layout, BCSS, and rendering.
- **Worker viewport propagation** — worker apps now inherit host dimensions on first render, stay in sync on resize, and expose only worker-safe run options.
- **Flex API cleanup** — removed the unused `align` field from `FlexChildProps` instead of documenting a behavior the layout engine never implemented.
- **Worker IPC / recorder correctness** — removed an unused canvas option, aligned mouse disable sequences with the modes Bijou actually enables, and normalized resized recorder frames before GIF encoding while matching the bundled `gifenc` types to the runtime API.
- **Resize redraw invalidation** — interactive resize now forces a clean redraw so shell chrome does not disappear after repeated terminal resizes.
- **Framed shell compatibility** — shell panes no longer crash when downstream apps return `Surface` or `LayoutNode` output.
- **Example migration sweep** — examples that mixed string APIs with V3 `Surface` values were updated to render cleanly.
- **Interactive example smoke coverage** — prompt and form examples now run through PTY-driven scripted coverage instead of only static entrypoint checks.

### 🧪 Tests

- Added `typecheck:test` as a release gate.
- Added full-repo example smoke coverage via `smoke:examples:all`.
- Added regressions for framed pane `ViewOutput`, BCSS shell styling, runtime resize invalidation, worker runtime, and the native recorder.

### 📝 Documentation

- Rewrote the root architecture doc to reflect the five-package monorepo and actual package graph.
- Added a dedicated migration guide for upgrading apps to `3.0.0`.
- Updated the root and package READMEs with a truthful V3 story and release-facing examples.

## [2.1.0] - 2026-03-09

### ✨ Features

- **Transition shader system expansion (bijou-tui)** — Added 9 new built-in transition shaders: `radial`, `diamond`, `spiral`, `blinds`, `curtain`, `pixelate`, `typewriter`, `glitch`, and `static`. Added shader factories for parameterized variants (`wipe(direction)`, `radial(originX, originY)`, `blinds(count, direction)`, etc.) and composable combinators (`reverse()`, `chain()`, `overlay()`). Added `frame` counter to `TransitionCell` for temporal effects (glitch, static). Added `charRole` (`'decoration'` | `'marker'`) to `TransitionResult` so combinators can distinguish ambient noise from positional indicators. All 16 named transitions available via the `BuiltinTransition` union and `TRANSITION_SHADERS` registry.

### 🐛 Fixes

- **Zero-dimension guard in `renderTransition`** — Early-returns when `width <= 0` or `height <= 0`, preventing `NaN`/`Infinity` from division-by-zero in shaders called with degenerate dimensions.
- **Removed unused `_frameKeys` parameter from `applyFrameAction`** — Dead parameter left after palette logic was extracted; removed from signature and all call sites.
- **Explicit `charRole: 'decoration'` on char-emitting shaders** — `matrixShader`, `scrambleShader`, `pixelate()`, `glitch()`, and `tvStatic()` now explicitly declare their char overrides as decorations for self-documenting combinator behavior.
- **`overlay()` combinator JSDoc** — Documented OR semantics of `showNext` (composite reveals if either shader reveals).
- **`createEventBus` JSDoc** — Documented that command rejections are silent by default.
- **Fixed branch name in `COMPLETED.md`** — v2.0.0 entry now correctly references `feat/tui-shader-transitions`.

## [2.0.0] - 2026-03-08

### BREAKING CHANGES

- **Removed deprecated public exports (bijou)** — `getTheme()`, `resolveTheme()`, and `_resetThemeForTesting()` have been removed from `@flyingrobots/bijou`. Use `createBijou()` or `createThemeResolver({ runtime })` instead.
- **`RuntimePort` now required (bijou)** — `createEnvAccessor()`, `createTTYAccessor()`, `detectOutputMode()`, `detectColorScheme()`, `isNoColor()`, and `createThemeResolver()` no longer accept optional `RuntimePort` — it is now a required parameter. This eliminates all `process.env` / `process.stdout` fallbacks from the core package, enforcing the hexagonal port boundary.

### Refactors

- **Eliminated `process.env` fallbacks from hexagonal boundary (bijou)** — `ports/env.ts` no longer references `process.env` or `process.stdout.isTTY`. All environment and TTY access flows through `RuntimePort`.
- **Routed eventbus errors through `onError` port (bijou-tui)** — `createEventBus()` accepts an `onError` callback in options, replacing direct `console.error` calls. When no error handler is configured, rejected commands are silently dropped.
- **Decomposed `app-frame.ts` (bijou-tui)** — Split the 1662-line monolith into 6 focused modules: types (179), utilities (151), rendering (357), actions (410), palette (200), and factory (526). No public API changes.

## [1.8.0] - 2026-03-08

### ✨ Features

- **Custom fill characters (bijou)** — `box()` and `headerBox()` accept `fillChar` option for custom padding/fill characters. Validates single-width graphemes; wide characters fall back to space.
- **`constrain()` component (bijou)** — New `constrain(content, { maxWidth?, maxHeight?, ellipsis? })` for content truncation with configurable ellipsis. Passthrough in pipe/accessible modes.
- **Note field (bijou)** — New `note({ message, title? })` display-only form field. Interactive: info icon + bold title + muted message with left accent line. Compatible with `group()`/`wizard()`.
- **Timer / Stopwatch (bijou)** — Static `timer(ms)` renders MM:SS / HH:MM:SS / MM:SS.mmm with accessible spoken output. Live `createTimer()` countdown and `createStopwatch()` elapsed-time controllers with start/pause/resume/stop.
- **Dynamic wizard forms (bijou)** — `WizardStep` gains `transform` (replace field function dynamically) and `branch` (splice in additional steps after value collection) options.
- **`cursorGuard()` + `withHiddenCursor()` (bijou)** — Reference-counted cursor visibility guard. Multiple components (spinner, progress, timer, forms) sharing the same IOPort now coordinate hide/show automatically — nesting a spinner inside a progress bar no longer prematurely restores the cursor. `withHiddenCursor(io, fn)` provides try/finally sugar for one-shot use cases.
- **Panel minimize/fold/unfold (bijou-tui)** — Per-pane collapsed state with `ctrl+m` toggle. Minimized panes collapse to title bar; sibling gets remaining space. Cannot minimize last visible pane.
- **Panel maximize/restore (bijou-tui)** — `ctrl+f` promotes focused pane to full-area view. Per-page state. Maximizing a minimized pane restores it first.
- **Dockable panel manager (bijou-tui)** — `ctrl+shift+arrow` reorders panes within split/grid containers. Pure state reducers with `movePaneInContainer` and `resolveChildOrder`.
- **Layout presets + session restore (bijou-tui)** — `serializeLayoutState()` / `restoreLayoutState()` for JSON-friendly workspace persistence. Preset helpers: `presetSideBySide`, `presetStacked`, `presetFocused`. `initialLayout` option on `createFramedApp`.

### 🐛 Bug Fixes

- **`timer()` negative ms with `showMs`** — `formatTime()` now clamps the entire input to `>= 0` before extracting millis, fixing invalid output like `00:00.-500`.
- **`constrain()` ANSI-safe truncation detection** — Width comparison now uses `graphemeWidth()` instead of raw string length, preventing false-positive ellipsis on ANSI-styled input.
- **Timer cursor not restored on natural completion** — `createTimer()` now emits `\x1b[?25h` when countdown finishes naturally, not just on explicit `stop()`.
- **Timer double-start leaks interval handle** — `start()` now disposes any existing timer before creating a new one.
- **Timer `elapsed()` returns stale value** — `elapsed()` now computes on the fly when the timer is running, instead of returning a value only updated on tick.
- **Timer `pause()` snapshots stale elapsed** — `pause()` now uses `Date.now() - startTime` instead of the tick-updated `elapsedMs`.
- **Timer `stop()` loses sub-tick elapsed time** — `stop()` now snapshots `elapsedMs` before disposing the interval, so `elapsed()` returns an accurate value after stopping.
- **Timer `start()` while paused stays frozen** — `start()` now resets the `paused` flag, preventing a re-started timer from remaining frozen.
- **Timer `stop()` after `pause()` loses paused elapsed** — `stop()` now snapshots `pausedElapsed` into `elapsedMs` when stopped while paused.
- **`constrain()` height ellipsis ignores width constraint** — Height-truncation ellipsis now respects `maxWidth` when both constraints are active.
- **Grid dock operations were no-ops** — `findPaneContainer()` now returns pane IDs (not area names) for grid containers, fixing `ctrl+shift+arrow` in grid layouts.
- **Timer `onComplete` fires before cursor restore** — `onComplete` callback now runs after interval disposal and cursor restoration, so user code in the callback sees a clean terminal state.

### ⚠️ Deprecations

- **`detectOutputMode()`, `detectColorScheme()`, `isNoColor()` no-arg forms** — These fall back to `process.env` / `process.stdout`, bypassing hexagonal ports. Pass an explicit `RuntimePort` or use `createBijou()`.
- **`getTheme()`, `resolveTheme()` freestanding functions** — Rely on the global default resolver that falls back to `process.env`. Use `createBijou()` or `createThemeResolver({ runtime })`.
- **`styled()`, `styledStatus()` freestanding functions** — Reach for the global default context singleton, violating dependency inversion. Use `ctx.style.styled(token, text)` and `ctx.semantic(status)` instead.

### ♻️ Refactors

- **Deduplicate cursor constants (bijou-tui)** — `HIDE_CURSOR` and `SHOW_CURSOR` in `screen.ts` now re-export from `@flyingrobots/bijou` instead of defining local copies.
- **Test-only exports moved to `@flyingrobots/bijou/adapters/test`** — `_resetDefaultContextForTesting` and `_resetThemeForTesting` removed from the main barrel; available via the dedicated test entry point.
- **Shared env/TTY accessors** — Extracted `createEnvAccessor()` and `createTTYAccessor()` into `ports/env.ts`, replacing duplicated `envAccessor()` / `process.env` fallback logic in `tty.ts` and `resolve.ts`.
- **Cursor lifecycle via `CursorGuard`** — Spinner, progress bar, timer, and form `terminalRenderer` now use `cursorGuard()` instead of raw ANSI writes, eliminating duplicated `\x1b[?25l`/`\x1b[?25h` sequences and fixing nesting correctness.
- **Timer/stopwatch shared controller** — Extracted `createLiveController()` to deduplicate ~60 lines of identical start/pause/resume/stop logic between `createTimer()` and `createStopwatch()`.
- **`getNodeId()` deduplication (bijou-tui)** — Exported `getNodeId()` from `panel-dock.ts` and removed the duplicate `getLayoutNodeId()` from `app-frame.ts`.
- **`serializeLayoutState` reads model defaults** — Now falls back to `model.minimizedByPage` / `maximizedPaneByPage` / `dockStateByPage` / `splitRatioOverrides` when `perPage` is omitted, so callers don't need to pass redundant state.
- **DRY: shared ANSI constants** — Extracted `ANSI_SGR_RE`, `stripAnsi()`, `CLEAR_LINE_RETURN`, `HIDE_CURSOR`, `SHOW_CURSOR` into shared modules (`core/text/grapheme.ts`, `core/ansi.ts`). Replaced 4 inline ANSI strip regexes and ~12 raw `'\r\x1b[K'` sequences across spinner, progress, timer, and form components.
- **DRY: form scroll/navigation** — Extracted `clampScroll()` and `handleVerticalNav()` into `form-utils.ts`, deduplicating identical implementations in `select.ts` and `multiselect.ts`.
- **`WritePort.writeError` now required** — Removed optional `?` from `WritePort.writeError`. All adapters already provided it; this eliminates nil-checks at callsites.
- **`console.warn` removed from bijou-tui** — `app-frame.ts` grid-cell warning now routes through `writeError()`. `split-pane.ts` `warnInvalidRatio` accepts an optional `WritePort` instead of sniffing `process.env`.
- **`ANSI_SGR_RE` shared regex safety** — Removed `/g` flag from the exported constant to prevent `lastIndex` bugs. Callsites create fresh regex instances for replacement.
- **`constrain()` explicit `maxWidth=0` guard** — Returns empty string immediately instead of relying on `clipToWidth` coincidence.
- **Wizard max iteration guard** — `wizard()` throws after 1000 steps to prevent infinite `branch` recursion loops.
- **Timer state machine refactor** — Replaced 6 loose mutable variables in `createLiveController` with a `TimerState` discriminated union (`idle | running | paused | stopped`), making invalid states unrepresentable.

### 📦 Maintenance

- **bijou-tui-app dependency alignment** — Updated `@flyingrobots/bijou` and `@flyingrobots/bijou-tui` deps from `1.7.0` to `1.8.0`; engine constraint from `>=20` to `>=18` for consistency.

### 🔧 Infrastructure

- **Commit pacing hook** — `pre-push` warns when pushing >10 commits (configurable via `BIJOU_PUSH_COMMIT_LIMIT`).
- **PR reply script** — `scripts/reply-to-reviews.sh` for replying to CodeRabbit review threads (interactive + batch modes).
- **Code smell journal** — Populated `.claude/bad_code.md` with 7 findings (process.env bypasses, duplicated envAccessor, _reset exports, app-frame.ts size, engine version inconsistency).
- **Dependency audit** — 0 CVEs, all MIT, all maintained.
- **pre-push hook** — Removed squashing suggestion from commit pacing warning (repo forbids squashing).
- **pre-push hook pipefail safety** — `git rev-list` failures in the commit pacing check now fall back to `count=0` instead of aborting under `set -euo pipefail`.
- **reply-to-reviews.sh GraphQL thread resolution** — Replaced REST-based heuristic with GraphQL `reviewThreads.isResolved` for accurate unresolved thread detection.

### 🧪 Tests

- 110 new tests across all features: box fillChar (7), constrain (13), note (7), timer/stopwatch (24), dynamic wizard (16), panel-state (11), panel-dock (14), layout-preset (7), env accessors (5), cursor-guard (3), form-utils (1), ANSI regex (2).

## [1.7.0] - 2026-03-08

### ✨ Features

- **Multiselect `defaultValues` (bijou)** — New `defaultValues` option on `multiselect()` pre-selects items when the form first renders in interactive mode. Items render with filled checkboxes (`◉`) and can be toggled off with Space.

### 🧪 Tests

- **Spec-vs-impl corrections** — Resolved 3 mismatches between ROADMAP acceptance criteria and actual implementation: `mockIO().question()` exhaustion returns `''` (not throws), CI+TTY detects as `'static'` (not `'rich'`), Ctrl+C semantics documented per-form.
- **Node.js adapter tests (bijou-node)** — `nodeIO()`: write, writeError, readFile, readDir (with trailing `/` on dirs), joinPath, setInterval firing/dispose. `chalkStyle()`: bgRgb, bgHex, styled bg field, noColor mode for bg methods.
- **Multiselect defaultValues tests** — Pre-selected items render checked, can be toggled off.
- **Property-based fuzz suites (fast-check)** — Forms: arbitrary strings, control characters, long input, numeric edge cases, malformed comma lists, rapid repeated calls. Environment detection: 500+ random env×TTY combos, BIJOU_ACCESSIBLE priority invariant, NO_COLOR invariant. DTCG: random theme round-trip, hex preservation, modifier subset preservation, deeply nested reference chains, edge-case hex values.

### 🔧 Infrastructure

- **Git hooks (repo)** — `scripts/hooks/pre-commit` runs lint + lockfile consistency check (`npm ls --all`). `scripts/hooks/pre-push` runs the full test suite. Wired via `core.hooksPath scripts/hooks`. Catches lockfile drift before it reaches CI.
- **CodeRabbit path exclusions (repo)** — `.coderabbit.yaml` excludes planning/task files (`CLAUDE.md`, `TASKS.md`, `docs/ROADMAP.md`, `docs/COMPLETED.md`, `docs/GRAVEYARD.md`) from review to reduce false positives.

### 📝 Documentation

- **ROADMAP** — Test coverage spec sections corrected. Xyph migration moved to COMPLETED.

## [1.6.0] - 2026-03-07

### ✨ Features

- **F-key parsing (bijou-tui)** — `parseKey()` now recognizes F1–F12 via CSI `~` encoding (`\x1b[11~`–`\x1b[24~`) and SS3 encoding (`\x1bOP`–`\x1bOS`). Supports Shift/Ctrl/Alt modifier combinations via `\x1b[1;{mod}P` and `\x1b[{code};{mod}~` sequences.
- **Cursor manager (bijou-tui)** — `setCursorStyle(io, shape, { blink })` and `resetCursorStyle(io)` for DECSCUSR cursor shape control. Three shapes (`'block'`, `'underline'`, `'bar'`) with optional blink. Constants: `CURSOR_BLOCK`, `CURSOR_UNDERLINE`, `CURSOR_BAR`, `CURSOR_RESET`.
- **Underline text variants (bijou core + bijou-node)** — `TextModifier` expanded with `'underline'`, `'curly-underline'`, `'dotted-underline'`, `'dashed-underline'`. Chalk adapter applies standard underline via chalk and variants via raw SGR 4:3/4:4/4:5 sequences. Graceful degradation in unsupporting terminals.

### 🐛 Bug Fixes

- **Select cancel label mismatch (bijou core)** — `cleanup()` in `select()` always displayed the label at the cursor position, even on cancel (Ctrl+C/Escape) where the resolved value is the default/first option. Now accepts an optional `selectedLabel` parameter so the cancel path displays the correct fallback label.
- **Filter interactive cleanup label (bijou core)** — `cleanup()` in `interactiveFilter` now receives the resolved label from each call site instead of computing it from `filtered[cursor]`. Previously, cancel paths (Ctrl+C, Escape) and empty-list Enter always displayed the wrong label because `cleanup()` read `filtered[cursor]` which didn't reflect the actual fallback value.
- **Grid fractional inputs (bijou-tui)** — `gridLayout()` and `grid()` now floor `width`, `height`, and `gap` at the API boundary. Previously, fractional values passed through to `solveTracks()`, causing leftover fractions to be wrongly promoted to full cells.
- **Tabs validation (bijou-tui-app)** — `createTuiAppSkeleton()` now throws on duplicate `tab.id` values and falls back to first tab when `defaultTabId` is not found in tabs.
- **Transition tick zero-duration guard (bijou-tui)** — `createTransitionTickCmd()` now emits `transition-complete` immediately when `durationMs <= 0`, avoiding unnecessary interval timers.
- **F-key non-null assertions (bijou-tui)** — `keys.ts` capture group accesses replaced with `?? ''` fallbacks; `decodeModifier()` guards against NaN inputs.

### ♻️ Refactors

- **DRY grid dimension sanitisation (bijou-tui)** — extracted `sanitiseDimension()` helper shared by `gridLayout()` and `grid()`, eliminating duplicate floor/NaN/Infinity clamping.
- **Remove duplicate `fitBlock` (bijou-tui)** — `app-frame.ts` now imports `fitBlock` from `layout-utils.ts` instead of maintaining a local copy.
- **Import `WritePort` type (bijou-tui)** — `runtime.ts` now imports `WritePort` from `@flyingrobots/bijou` instead of inlining the type.
- **DRY enumerated list (bijou core)** — `enumeratedList()` no-context path now calls the existing `renderItems()` helper instead of duplicating its logic.
- **Extract `createThemeAccessors` (bijou core)** — Six duplicated accessor lambdas in `factory.ts` and `test/index.ts` consolidated into a single `createThemeAccessors()` function in `core/theme/accessors.ts`.
- **`createTestContext` style option (bijou core)** — `createTestContext()` now accepts an optional `style` override, eliminating 12 double-cast `(ctx as unknown as …).style = style` patterns across 5 test files.

- **`detectColorScheme` env accessor (bijou core)** — extracted shared `envAccessor()` helper in `tty.ts`, eliminating inline `process.env` fallback coupling. Both `detectOutputMode` and `detectColorScheme` now use the same accessor pattern.

### 🧪 Tests

- **table.test.ts auditStyle** — `table()` background fill tests now use `auditStyle()` to verify `bgHex` calls instead of checking rendered string content.
- **Test audit** — 24 new tests filling coverage gaps identified against acceptance criteria specs:
  - Form functions: confirm rich mode (y/Y/yes/n/N/no, invalid input, accessible mode), input (trimming, required, validator, noColor, ctx)
  - Test adapters: plainStyle `bgRgb()`/`bgHex()`, createTestContext theme accessor verification
  - DTCG: surface group defaults, partial group token fill
  - Chalk adapter: underline and variant modifier coverage

### 📝 Documentation

- **Roadmap cleanup** — moved shipped Phases 1–9 and P0–P2.5 backlog to `docs/COMPLETED.md`. Roadmap now contains only P3 backlog, test coverage specs, and Xyph migration plan.

## [1.5.0] - 2026-03-07

### ✨ Features

- **`gradient()` theme accessor** — `ctx.gradient(key)` returns `GradientStop[]` for any named gradient, completing the theme accessor API (`semantic`, `border`, `surface`, `status`, `ui`, `gradient`).
- **Background color support for 7 components** — Style pass adding `bgToken` / background fill support:
  - `alert()` — `surface.elevated` bg on interior box (default, overridable via `bgToken`)
  - `kbd()` — `surface.muted` bg for key-cap effect (default, overridable via `bgToken`)
  - `tabs()` — `surface.muted` bg on active tab with padding (default, overridable via `activeBgToken`)
  - `accordion()` — opt-in `headerBgToken` for expanded/collapsed section headers
  - `table()` — opt-in `headerBgToken` for header row background
  - `stepper()` — opt-in `activeBgToken` for active step indicator
  - `breadcrumb()` — opt-in `currentBgToken` for current segment highlight
  - All bg fills gracefully degrade in pipe/accessible/noColor modes via `shouldApplyBg()`

### 🧪 Tests

- **Relaxed brittle multiline assertions** — Replaced exact multiline `toBe()` assertions with `toMatch()`/`toContain()` + per-line checks in `table.test.ts`, `enumerated-list.test.ts`, `tree.test.ts`, and `dag.test.ts`. Tests now verify content and structure without breaking on whitespace changes.

### ♻️ Refactors

- **Migrated remaining direct theme accesses** — `textarea-editor.ts`, `progress.ts`, and `overlay.test.ts` now use `ctx.semantic()`, `ctx.gradient()`, and `ctx.border()` accessors instead of reaching into `ctx.theme.theme.*` directly. All source-level direct theme access is eliminated.

## [1.4.0] - 2026-03-07

### ✨ Features

- **Component showcase app** — full-screen interactive explorer (`examples/showcase/`) with 45 components across 4 categories (Display, Data, Forms, TUI Blocks). Each component shows rendered output in rich, pipe, and accessible modes side-by-side. Features animated welcome drawer, tab transitions, command palette, and full keyboard navigation.
- **Timeline-driven transitions (bijou-tui)** — `createFramedApp()` now accepts a `transitionTimeline` option: a compiled `timeline()` with a `'progress'` track that drives the transition animation. Users can share custom transition definitions with springs, tweens, and easing curves. Transitions are time-based (wall-clock `Date.now()`), not tick-based.
- **Tab transition animations (bijou-tui)** — implemented `wipe`, `dissolve`, `grid`, `fade`, `melt` (Doom-style), `matrix` (code-leading edge), and `scramble` (noise resolve) transitions in `createFramedApp()`. Transitions are driven by pure TEA state and rendered via high-performance character-grid shaders in `canvas()`.
- **Scrollable multiselect viewport (bijou core)** — `multiselect()` now supports `maxVisible` in interactive mode with scrolling behavior for long option lists, matching the `select()` and `filter()` components.

### ♻️ Refactors

- **Transition shader system (bijou-tui)** — extracted 7 hardcoded transition effects from `renderTransition()` into composable pure functions (`TransitionShaderFn`). `PageTransition` now accepts custom shader functions alongside built-in names, enabling user-authored spatial blend algorithms.
- **Mode rendering strategy (OCP)** — implemented `renderByMode` dispatcher pattern to replace repetitive `if (mode === …)` chains; migrated all core components to use the new registry pattern for cleaner mode-specific rendering.
- **Decentralized theme access (DIP)** — added `semantic()`, `border()`, `surface()`, `status()`, and `ui()` helpers to `BijouContext`; components now look up tokens via these semantic methods instead of reaching into the deep `ctx.theme.theme` object structure.
- **Form components consistency** — refactored `select()`, `multiselect()`, and `filter()` to use new semantic context helpers and the `renderByMode` dispatcher.

### 🐛 Fixes

- **Transition generation guard (bijou-tui)** — rapid tab switches no longer let stale tween ticks overwrite a newer transition's progress. Each transition carries a monotonic generation counter; mismatched ticks are discarded.
- **Table column width (bijou core)** — `table()` now uses `visibleLength()` instead of `.length` for auto-calculated column widths, preventing oversized columns when cells contain ANSI styling.
- **`headerBox()` nullish label handling** — nullish labels with non-empty `detail` no longer leak separators or empty styled spans.
- **Active tab bullet styling** — the `●` bullet in `tabs()` is now styled with the primary token, matching the active label.
- **Custom component example** — replaced `as any` mode mutation with immutable context spread pattern.

### 🧪 Tests

- **Tab transition coverage** — added manual and scripted interaction tests for tab transitions in `app-frame.test.ts`.
- **Multiselect scrolling coverage** — added `maxVisible` scrolling test cases to `multiselect.test.ts`, including wrap-around scrolling.
- **Shared test fixtures** — extracted common form data (colors, fruits, large lists) into `adapters/test/fixtures.ts` for reuse across test suites.
- **Defensive input hardening** — added comprehensive tests and fixes for `null`/`undefined` input handling in `box()`, `headerBox()`, `alert()`, `table()`, and `markdown()`.
- **Test suite refactoring** — migrated all form tests to use shared fixtures and updated component tests to leverage new `BijouContext` helpers.
- **Test isolation** — `app-frame.test.ts` now properly scopes `setDefaultContext()` with `beforeAll`/`afterAll` to prevent singleton leaks.

## [1.3.0] - 2026-03-06

### ✨ Features

- **`splitPane()` layout primitive (bijou-tui)** — new stateful split view with pure reducers (`splitPaneSetRatio`, `splitPaneResizeBy`, `splitPaneFocusNext`, `splitPaneFocusPrev`). Layout geometry is deterministic via `splitPaneLayout()`.
- **`grid()` layout primitive (bijou-tui)** — named-area constraint grid with fixed + fractional tracks (`fr`), gap support, and `gridLayout()` rect solving.
- **`createFramedApp()` shell (bijou-tui)** — high-level app frame with tabs, pane focus management, per-page/per-pane scroll isolation, help toggle, optional command palette, and pane-rect-aware overlay hooks.
- **Drawer anchor expansion + region scoping (bijou-tui)** — `drawer()` now supports `left`/`right`/`top`/`bottom` anchors and optional `region` mounting for panel-scoped drawers.
- **Scripted interaction harness upgrades (bijou-tui)** — `runScript()` now accepts key, resize, and custom message steps for richer integration testing.
- **Scrollable select viewport (bijou core)** — `select()` now supports `maxVisible` in interactive mode with scrolling behavior for long option lists.
- **`@flyingrobots/bijou-tui-app` package** — batteries-included app skeleton built on `createFramedApp()`. Includes tokenized tabs, full-screen defaults, animated physics drawer, quit-confirm modal (`q` / `ctrl+c`), `[` / `]` page switching, a two-line footer, and a default two-tab setup (drawer page + 1/3:2/3 split page).
- **`create-bijou-tui-app` package** — new `npm create bijou-tui-app@latest` scaffolder that generates a runnable TypeScript app using `createTuiAppSkeleton()` with strict config and starter scripts.

### 🐛 Fixed

- **Canonical workbench page-local selection state (`examples`)** — replace shared `selectionIndex` with dedicated `incidentIndex`, `backlogIndex`, and `graphSelectionIndex`; page navigation now clamps against the correct collection per page, and `buildPage()` enforces exhaustive `WorkbenchMsg` handling.
- **`create-bijou-tui-app` next-step quoting on Windows** — `quotePath()` now emits Windows-safe double-quoted paths on `win32`, so copied `cd` commands with spaces work in `cmd.exe`.
- **`create-bijou-tui-app` cmd metachar escaping** — Windows `cd` hints now escape `%` and `^` to avoid variable/metachar expansion when users scaffold into unusual directory names.
- **Split-pane invalid input/render guardrails (`bijou-tui`)** — `createSplitPaneState()` now warns in non-production/non-test environments when given non-finite ratios, and `splitPane()` sanitizes `dividerChar` to a single-column glyph so custom multi-width values cannot break layout width.
- **Readonly DAG parity (`bijou`)** — `DagNode.edges` is now `readonly string[]`, completing readonly overload support for immutable DAG literals.
- **Event bus rejection surfacing hardening (`bijou-tui`)** — `createEventBus()` now guards `onCommandRejected` callbacks so secondary handler exceptions are logged instead of reintroducing unhandled rejections.
- **Grid fractional allocation clarity (`bijou-tui`)** — `gridLayout()` now uses largest-remainder distribution for leftover `fr` space and throws on fractional `fr` tokens (e.g. `1.5fr`) to match documented/tested integer semantics.
- **Framed app render resilience (`bijou-tui`)** — missing grid cell nodes in `createFramedApp()` now render a placeholder with a warning instead of crashing the full app render.
- **App-frame example split-state persistence** — the `examples/app-frame` editor split state is now initialized once in `PageModel` instead of being recreated on every render.

### 🧪 Tests

- Add dedicated suites for `splitPane`, `grid`, and `appFrame`.
- Expand `splitPane` coverage for default state values, non-finite ratio fallback behavior, conflicting min-constraint precedence (`minB`), and multi-width divider sanitization.
- Extend `overlay` coverage for top/bottom drawer anchors and region-scoped mounting.
- Cover `driver` resize and custom message script steps.
- Add `select` coverage for `maxVisible` scrolling behavior.

### ♻️ Refactors

- **I/O stderr porting across core/tui** — add `writeError()` to `WritePort`, implement it in `nodeIO()` and test adapters, and route command rejection reporting through injected ports instead of direct `console.error`.
- **Theme resolver warning output port** — replace direct `console.warn` fallback logs in theme resolution with optional `warningPort.writeError()` wiring.
- **Runtime/global decoupling cleanup** — remove `process.stdout` dependencies from framed-app initialization and output-mode detection internals; runtime now performs an initial size sync via `ResizeMsg` from `RuntimePort`.

### 📝 Documentation

- Add new examples: `split-pane`, `grid-layout`, and `app-frame`.
- Add canonical app-shell demo entry points: `demo-tui.ts` and `examples/release-workbench/main.ts`.
- Update `@flyingrobots/bijou-tui` README/GUIDE/ARCHITECTURE docs for split/grid/app-frame and drawer region scoping.
- Update root README and examples index for the canonical release workbench demo.
- Clarify package README caveats: canonical docs/examples live in-repo, `run()` non-interactive single-render behavior, and `initDefaultContext()` first-call registration semantics.
- Expand `create-bijou-tui-app` docs with explicit generated-app run instructions (`npm run dev` / `npx tsx src/main.ts`) and a local monorepo smoke-test flow.
- Add a root README pointer for discovering the scaffolder development workflow.

## [1.2.0] — 2026-03-04

### ✨ Features

- **Vim-style mode switching for `filter()`** — interactive filter starts in normal mode where `j`/`k` navigate. Any printable character (except `j`/`k`) enters insert mode and types the character. Press `/` to enter insert mode without typing. `Escape` in insert returns to normal; `Escape` in normal cancels. Mode indicator shows `:` (normal) or `/` (insert).

### 🐛 Fixed

- **`k` key asymmetry in `filter()`** — `k` always navigated (even when query was non-empty), preventing users from typing `k` as a search character. Now properly handled via normal/insert mode switching.
- **`clearRender()` consistency in `filter()`** — navigation handlers now capture `renderLineCount()` before mutating state, preventing visual artifacts when the filtered list shrinks.
- **`filter()` viewport scrolling** — the filter list viewport was locked to `slice(0, maxVisible)`, so the cursor indicator disappeared once the user navigated past the visible window. Now tracks a `scrollOffset` that slides to keep the cursor in view.
- **Markdown code spans not isolated** — code span content (backtick-delimited) was vulnerable to subsequent bold/italic regex passes. For example, `` `a*b*c` `` in pipe mode became `abc` instead of `a*b*c`. Now uses NUL-delimited placeholders to isolate code span content.
- **`textarea()` empty submit ignores defaultValue** — submitting an empty textarea with Ctrl+D returned `''` instead of falling back to `defaultValue` when set.
- **`markdown()` width not validated** — negative or NaN width values flowed unchecked into `String.repeat()` in the separator renderer, causing a `RangeError`. Now clamped to a minimum of 1.
- **`markdown()` HR regex misses spaced variants** — `* * *` and `- - -` are valid CommonMark horizontal rules but were mis-parsed as bullet list items because the bullet regex matched first. HR regex changed from `/^(-{3,}|\*{3,}|_{3,})\s*$/` to `/^([-*_]\s*){3,}$/` on trimmed input.
- **DAG `cellAt()` CJK column mapping** — CJK/wide characters occupy 2 terminal columns but 1 grapheme slot, causing garbled rendering when `cellAt()` indexed directly by column offset. Now builds a column-to-grapheme mapping via `expandToColumns()` during `PlacedNode` construction.
- **Numbered list continuation indent misalignment** — continuation lines of wrapped numbered list items used per-item prefix width, causing misalignment between items 1–9 and 10+. Now calculates max prefix width across all items and uses it uniformly.
- **DAG `Math.max(...spread)` overflow** — `Math.max(...nodes.map(...))` in `renderInteractiveLayout()` could throw `RangeError` for arrays > ~65K elements. Replaced with `reduce()` loop.
- **DAG accessible edge count mismatch** — `renderAccessible()` header counted all declared edges but rendered only edges with existing targets, causing the "Graph: N nodes, M edges" summary to disagree with the body. Now counts only valid edges.
- **`textarea()` cleanup summary ignores defaultValue** — submitting an empty textarea with Ctrl+D showed "(cancelled)" in the summary line instead of the resolved `defaultValue`. Refactored `cleanup()` to accept the resolved value and cancelled flag.
- **`textarea()` maxLength=0 ignored** — truthy checks (`options.maxLength && ...`) treated `0` as unset, allowing unlimited input. Changed to nullish checks (`options.maxLength != null`).
- **DAG duplicate node ID misdiagnosed as cycle** — `assignLayers()` reported "cycle detected" when given duplicate node IDs. Now validates uniqueness before topological sort with a clear "duplicate node id" error message.
- **`junctionChar()` empty set returned `┼`** — an empty direction set (no edge traffic) now returns `' '` (space) instead of a four-way junction character.
- **Unnecessary type casts and redundant code** — remove `as 'interactive'` cast in static-mode test, narrow `linkReplacer` param type to `string` (removing `as string` cast), remove redundant null-equality clause in DAG token run-length encoding, return `renderInteractiveLayout()` result directly instead of destructuring into a new object.
- **`filter()` cursor flicker** — move `hideCursor()` from `render()` (called on every repaint) to one-time setup before the event loop.
- **Asterisk HR assertion** — strengthen `***` horizontal rule test to assert box-drawing character instead of non-empty output.

### ♻️ Refactors

- **Split `dag.ts` (941→~200 lines)** — extract edge routing into `dag-edges.ts`, layout algorithms into `dag-layout.ts`, and renderers into `dag-render.ts`. `dag.ts` remains the public facade with types and entry points.
- **Split `markdown.ts` (468→~50 lines)** — extract block/inline parsers and word wrapping into `markdown-parse.ts`, block renderer into `markdown-render.ts`. `markdown.ts` remains the public facade.
- **Extract `textarea-editor.ts`** — move the ~192-line interactive editor state machine from `textarea.ts` into a dedicated module. `textarea.ts` remains the public facade.
- **Extract `filter-interactive.ts`** — move the ~152-line interactive filter UI from `filter.ts` into a dedicated module. `filter.ts` remains the public facade.
- **`encodeArrowPos()` / `decodeArrowPos()`** — replace `GRID_COL_MULTIPLIER` arithmetic with self-documenting bitwise encoding functions `(row << 16) | col`, supporting up to 65535 rows/cols.
- **Shader-based DAG edge rendering** — replace pre-allocated `charGrid`/`tokenGrid` arrays in `renderInteractiveLayout()` with on-demand `cellAt()` per-cell computation using a spatial node index and highlight cell set.
- **Simplify `j` key handling in `filter-interactive`** — in insert mode, `j` falls through to the printable handler instead of being special-cased in the down-arrow condition block.
- **DRY `parseInlinePlain`/`parseInlineAccessible`** — extract shared `parseInlineStripped()` function; the two variants differed only in link replacement format.
- **Textarea running counter** — replace O(n) `lines.join('\n').length` recomputation on every keystroke with a maintained `totalLength` counter updated on insert/delete/newline.
- **Textarea dynamic line-number gutter** — replace hardcoded `prefixWidth = 6` with dynamic calculation based on line count, preventing overflow at 1000+ lines.

## [1.1.0] — 2026-03-04

### ✨ Features

- **`focusArea()`** (bijou-tui) — new scrollable pane building block with a colored left gutter bar indicating focus state. Wraps `viewport()` with gutter chrome, horizontal overflow support (`overflowX: 'scroll' | 'hidden'`), and a convenience keymap. Degrades gracefully: pipe/accessible modes omit the gutter; static mode renders it unstyled.
- **`dagPane()`** (bijou-tui) — new interactive DAG viewer building block. Wraps `dagLayout()` in a `focusArea()` with arrow-key node navigation (parent/child/sibling via spatial proximity), auto-highlight-path from root to selected node, and auto-scroll-to-selection. Includes full keymap with vim scroll bindings and arrow-key selection.

### 🐛 Fixed

- **`dagPane` redundant adjacency** — `updateSelection()` no longer rebuilds the adjacency map when all callers already have one; adjacency is now passed through as a parameter
- **`dagPane` unsafe cast** — replace `source as DagNode[]` with `isSlicedDagSource()` type guard in `renderLayout()`
- **`dagPaneSelectNode` unknown ID** — preserves existing selection when the requested node ID is not in the layout (previously cleared to `undefined`)
- **`dagPaneKeyMap` confirm binding** — fix `'return'` → `'enter'` key descriptor; `parseKey()` emits `'enter'` for Enter keypresses, so the confirm binding was unreachable
- **`createDagPaneState` invalid `selectedId`** — validate that `selectedId` exists in the source graph; fall back to no selection if the ID is unknown, preventing a stuck invalid selection state
- **`createFocusAreaState` dimension clamping** — clamp `width` and `height` to a minimum of 1, preventing invalid viewport state on zero or negative dimensions
- **`focusArea` scrollbar-aware horizontal bounds** — account for the scrollbar column when computing horizontal scroll `maxX`, preventing the rightmost column of content from being hidden behind the scrollbar
- **`focusArea` render-time scrollX clamping** — clamp `scrollX` against render-time content width to prevent one-column overscroll when pipe/accessible mode removes the gutter

### ♻️ Refactors

- **`DagPaneRenderOptions`** — replace empty interface with type alias
- **Merge duplicate imports** — consolidate split `import type` lines in `focus-area.ts` and `dag-pane.ts`
- **Remove dead code** — remove unused `toggle-focus` Msg variant and unreachable `case 'quit'` switch arm from focus-area example

### 📝 Documentation

- **GUIDE.md** — add missing `focusAreaSetContent` to Focus Area import example
- **2 new examples** — `focus-area` (scrollable pane with focus gutter), `dag-pane` (interactive DAG viewer with node navigation)
- **EXAMPLES.md** — add 18 missing example entries (dag-stats, enumerated-list, hyperlink, log, textarea, filter, wizard, pager, navigable-table, browsable-list, file-picker, interactive-accordion, status-bar, drawer, command-palette, tooltip, canvas, mouse) and update totals to 54/63

## [1.0.0] — 2026-03-03

### 💥 BREAKING CHANGES

- **`Theme.surface` is now required** — all `Theme` objects must include a `surface` section with `primary`, `secondary`, `elevated`, `overlay`, and `muted` tokens. Custom themes that omit `surface` will fail type checking.
- **`FlexOptions.bg` renamed to `FlexOptions.bgToken`** — `FlexOptions.bg` and `FlexChild.bg` (formerly `{ bg?: string }`) are now `bgToken?: TokenValue`. A `ctx` property is also required on `FlexOptions` for `bgToken` to take effect.

### ✨ Features

- **Background color support** — new `bg` field on `TokenValue`, `bgRgb()`/`bgHex()` on `StylePort`, `surface` tokens on `Theme`, and `bgToken` option on `box()`, `flex()`, `modal()`, `toast()`, `drawer()`, `tooltip()` for div-like colored blocks. Degrades gracefully in pipe/accessible/noColor modes.
- **`TooltipOptions.bgToken`** — new optional property for API consistency with modal/toast/drawer.
- **Adaptive color scheme detection** — `detectColorScheme(runtime?)` reads `COLORFGBG` env var to determine light vs dark terminal background. Wired into `ResolvedTheme.colorScheme` and `createTestContext({ colorScheme })`. Exported from main barrel.

### ♻️ Refactors

- **ports:** segregate IOPort into WritePort, QueryPort, InteractivePort, FilePort sub-interfaces (ISP cleanup)
- **forms:** extract shared form utilities (formatFormTitle, writeValidationError, renderNumberedOptions, terminalRenderer, formDispatch) to eliminate cross-form duplication
- **forms:** standardize all form components on shared resolveCtx() helper
- **Extract shared `resolveCtx` / `resolveSafeCtx`** — deduplicate the `resolveCtx` helper that was copy-pasted across 20 component files into a single shared module (`core/resolve-ctx.ts`). Both variants (strict and safe/try-catch) are exported from the bijou barrel. No runtime behavior change.
- **Extract shared `makeBgFill()` utility** — deduplicate the background-fill guard logic (noColor, pipe, accessible mode checks) that was copy-pasted across 5 call sites into a single shared module (`core/bg-fill.ts`). `shouldApplyBg()` and `makeBgFill()` are exported from the bijou barrel. No runtime behavior change; `box()` gains defense-in-depth guards via the shared utility (its early return already prevented bg in pipe/accessible modes).
- **Extract `createStyledFn()`/`createBoldFn()`** — noColor-safe styling helpers in `form-utils.ts` that return identity functions when `noColor` is true. Refactored select, multiselect, filter, and textarea to use them.
- **Replace exact ANSI assertions** — 12 raw ANSI string checks replaced with semantic helpers (`expectNoAnsi`, `expectHiddenCursor`, `expectShownCursor`) across form-utils and environment tests.

### 🐛 Fixed

- **`flex()` bg routed through StylePort** — background colors in flex layouts now route through `ctx.style.bgHex()` instead of emitting raw ANSI escape sequences, respecting `noColor`, pipe mode, and accessible mode.
- **`toDTCG()` surface write unconditional** — remove defensive `if (theme.surface)` guard that could silently drop surface tokens during DTCG export.
- **`tree()` `labelToken` wired up** — the `labelToken` option declared in `TreeOptions` is now passed through to `renderRich` and applied to node labels via `ctx.style.styled()`. Previously the option was accepted but silently ignored.
- **`clip.ts` ANSI regex** — convert `ANSI_RE` from regex literal to `RegExp` constructor to avoid Biome `noControlCharactersInRegex` lint violation
- **`select()` empty options guard** — throw `Error` when `options.options` is empty instead of allowing undefined dereference
- **`timeline()` duplicate track guard** — throw `Error` on duplicate track names during `build()` to prevent silent state overwrites
- **`timeline.step()` dt validation** — throw `Error` when `dt` is negative, `NaN`, or infinite to prevent corrupted timeline state
- **`readDir` uses `withFileTypes`** — replace `statSync` per-entry with `readdirSync({ withFileTypes: true })` to reliably identify directories without a separate stat call
- **overlay:** add noColor guard to bgFill in modal, toast, drawer, tooltip
- **overlay:** add pipe/accessible mode guards to bgFill
- **forms:** guard empty options in multiselect
- **docs:** fix MD038 code span spacing in CHANGELOG (`` `? ` `` → `"? "`)
- **docs:** correct `docs/CHANGELOG.md` → `CHANGELOG.md` sibling path in COMPLETED.md
- **forms:** guard `styledFn()` calls in multiselect interactive renderer when `noColor` is true — hint text and option descriptions no longer leak ANSI in noColor mode
- **forms:** fix noColor ANSI leaks in filter (5 unguarded calls) and textarea (4 unguarded calls) via `createStyledFn`/`createBoldFn` helpers
- **forms:** `formatFormTitle` now includes "? " prefix in noColor/accessible modes for visual parity; remove redundant manual ternaries from all 4 interactive form files
- **forms:** `createStyledFn`/`createBoldFn` now suppress styling in accessible mode (consistent with `formatFormTitle`)
- **forms:** fix misleading accessible fallback prompt in textarea (said "multi-line" but reads single line)
- **forms:** `confirm()` noColor prompt now uses `formatFormTitle` to include "? " prefix (visual parity with color mode)
- **forms:** `moveUp(0)` / `clearBlock(0)` in `terminalRenderer` now early-return instead of emitting empty ANSI sequences
- **detect:** remove unreachable `undefined` guard on `parts[parts.length - 1]` in `detectColorScheme` (replaced with `!` assertion — `split()` always returns >= 1 element)
- **lint:** ANSI lint test now uses case-insensitive regex for all escape form variants (`\x1B`, `\u001B`, `\u{1B}`)
- **forms:** `formDispatch()` now checks `stdoutIsTTY` in addition to `stdinIsTTY` before routing to interactive handler

### 📝 Documentation

- **JSDoc review fixes** — fix 57 issues found during self-review of JSDoc coverage: correct `OutputMode` values in `BijouContext.mode` (critical), add missing `@param`/`@returns`/`@throws` tags across all three packages, merge 12 split JSDoc blocks in bijou-tui, unify `resolveCtx` wording across 16 components, standardize punctuation (en-dashes, em-dashes, `6x6x6`), strip redundant implementation overload docs, and fix inaccurate descriptions (`readDir` sort claim, `NO_COLOR` attribution, "Mutable" snapshot, field check order)
- **CodeRabbit JSDoc review fixes** — address 16 documentation review comments from PR #25: fix CHANGELOG compare links for v0.10.1, clarify `BrowsableListItem.value`/`description` JSDoc, rename "Immutable" to "Readonly" in `BrowsableListState`, remove blank line before `@template` in `initBrowsableList`, fix verb tense in `createEventBus`, clarify `alignCross` `totalCrossSize` units, fix `ModalOptions.width` to "preferred minimum width", note hard truncation in `box()` `clipToWidth`, document `labelToken` override in `headerBox`, use "local wall-clock time" in `formatTimestamp`, note optional timestamp/prefix in `log()`, fix "mid-style" wording in `clipToWidth`, add non-blocking validation remark to `input()`, use "code point" in `ShaderFn` return, add `getDefaultContext` cross-reference to `resolveCtx`
- **CodeRabbit code review fixes** — remove unused `ctx?: BijouContext` option from `StatusBarOptions` (dead API surface that was never read by `statusBar()`); clarify `helpFor` JSDoc to note that `groupFilter` in options is overridden by the `groupPrefix` parameter
- **viewport JSDoc** — change "characters wide" to "visible columns wide" to reflect grapheme/ANSI-aware width measurement

### 🧪 Tests

- **Output assertion helpers** — 6 new test-only helpers: `expectNoAnsi()`, `expectNoAnsiSgr()`, `expectContainsAnsi()`, `expectHiddenCursor()`, `expectShownCursor()`, `expectWritten()`. Re-exported from `adapters/test` barrel.
- **noColor integration test suite** — 7 tests exercising all form components with `noColor: true` in interactive mode.
- **ANSI lint test** — scans source files for raw ANSI escapes (hex, unicode, and literal ESC byte forms); fails if found in non-allowed files (13 allowed files for terminal control, key matching, and ANSI parsing).

## [0.10.1] — 2026-02-28

### 📝 Documentation

- **JSDoc total coverage** — every exported and internal function, interface, type alias, constant, and class across all three packages (`bijou`, `bijou-node`, `bijou-tui`) now has comprehensive JSDoc with `@param`, `@returns`, `@throws`, and `@template` tags where applicable. 94 source files, ~3,600 lines of documentation added.

## [0.10.0] — 2026-02-28

### 🚀 Features

#### Core (`@flyingrobots/bijou`)

- **`clipToWidth()`** — grapheme-aware text clipping promoted from bijou-tui to bijou core. O(n) algorithm preserving ANSI escapes, won't split multi-codepoint grapheme clusters (emoji, CJK, ZWJ sequences). Appends reset only when ANSI present
- **`box()` width override** — optional `width` on `BoxOptions` locks outer box width (including borders). Content lines are clipped via `clipToWidth()` or right-padded to fill. Padding is clamped when it exceeds available interior space. Pipe/accessible modes ignore width
- **`box()` grapheme-aware width measurement** — replaced naive `stripAnsi().length` with `graphemeWidth()` for correct CJK/emoji box sizing (pre-existing bug fix)

#### TUI (`@flyingrobots/bijou-tui`)

- **`canvas()` shader primitive** — `(cols, rows, shader, options?) → string` character-grid renderer for procedural backgrounds. Shader receives `(x, y, cols, rows, time)` per cell. Returns empty string in pipe/accessible mode. Composes with `composite()` for layered rendering
- **Mouse input (opt-in)** — SGR mouse protocol support via `RunOptions.mouse?: boolean` (default false). New types: `MouseMsg`, `MouseButton`, `MouseAction`. `parseMouse()` parses SGR sequences (`\x1b[<button;col;rowM/m`). `isMouseMsg()` type guard. EventBus `connectIO()` accepts `{ mouse: true }` option. Runtime sends enable/disable escape sequences on startup/cleanup
- **`App.update()` signature widened** — now receives `KeyMsg | ResizeMsg | MouseMsg | M` (was `KeyMsg | ResizeMsg | M`). Since `MouseMsg` is never emitted when `mouse: false`, existing apps are unaffected at runtime

### 🐛 Fixes

- **`canvas()` surrogate corruption** — replace `ch[0]!` with code-point-aware `[...ch][0]` to correctly extract non-BMP characters (emoji) from shader output
- **Canvas example unsafe cast** — remove `(msg as Msg)` cast; TypeScript narrows through `'type' in msg` already
- **`parseMouse()` duplicated ternary** — extract `buttonFromBits()` helper to DRY the button-to-name mapping
- **`parseMouse()` zero coordinate guard** — reject malformed SGR sequences with col/row of 0 (protocol-invalid) instead of producing -1 positions
- **`clipToWidth()` / `sliceAnsi()` O(n²) perf** — rewrite to pre-segment stripped text once via `segmentGraphemes()`, then walk original string with a grapheme pointer; removes per-character `str.slice(i)` + re-segment pattern
- **`clipToWidth()` unconditional reset** — only append `\x1b[0m` when the clipped string actually contains ANSI style sequences
- **`viewport.ts` duplicate segmenter** — remove `getSegmenter()` singleton; import `segmentGraphemes` from `@flyingrobots/bijou` core
- **`markdown()` blockquote greedy continuation** — blockquote parser no longer swallows non-`>` continuation lines into the quote block
- **`markdown()` wordWrap grapheme width** — use `graphemeWidth()` instead of `.length` for correct CJK/emoji word wrapping
- **`markdown()` inline parse order** — code spans (`` ` ``) now parsed before bold/italic to prevent `*` inside backticks being treated as emphasis
- **`markdown()` bold regex** — changed from `[^*]+` to `.+?` to allow `*` inside bold spans (e.g. `**a*b**`)
- **`runScript()` init command settling** — add microtask yield after init commands and before dispose so async init commands settle before step processing begins
- **`runScript()` exception safety** — wrap lifecycle in `try/finally` so `bus.dispose()` runs even if app throws
- **`runScript()` unsafe cast** — remove `as KeyMsg | M` cast; `BusMsg<M>` already matches `app.update` signature
- **`runScript()` init-command test** — strengthen assertion to verify model mutation, not just frame count

### 🔧 Refactors

- **`viewport.ts` `clipToWidth()`** — re-exports from `@flyingrobots/bijou` core instead of maintaining a local copy. Public API unchanged for backward compatibility

### 🧪 Tests

- 53 new tests across 2 new + 5 expanded test files (1405 total)

### 📝 Documentation

- **2 new examples** — `canvas` (animated plasma shader), `mouse` (mouse event inspector)
- Add `queueMicrotask` limitation JSDoc to `runScript()` in driver.ts
- Mark canvas README snippet as excerpt
- Add missing `CHARS` definition to canvas README snippet
- Add `canvas` and `mouse` rows to examples README
- Add `static` mode comment to `canvas()`
- Fix ROADMAP version label (`v0.8.0` → `v0.9.0`)
- Fix CHANGELOG test file count (`8 new + 6 expanded` → `6 new + 7 expanded`)
- Fix CHANGELOG example count (`6 new examples` → `5 new examples`)
- Fix CHANGELOG v0.6.0 section heading (`Bug Fixes` → `Fixes`)
- Fix progress-download README unused `vstack` import
- Remove `(pre-release)` from xyph-title.md

## [0.9.0] — 2026-02-28

### 🚀 Features

#### Core (`@flyingrobots/bijou`)

- **Grapheme cluster support** — `segmentGraphemes()`, `graphemeWidth()`, `isWideChar()` utilities using `Intl.Segmenter` for correct Unicode text measurement. East Asian Wide characters (CJK = 2 columns), emoji (flags, ZWJ families, skin tones = 2 columns), and combining marks handled correctly
- **`markdown()`** — terminal markdown renderer supporting headings, bold, italic, code spans, bullet/numbered lists, fenced code blocks, blockquotes, horizontal rules, and links. Two-pass parser with mode degradation (interactive → styled, pipe → plain, accessible → labeled)
- **Color downsampling** — `rgbToAnsi256()`, `nearestAnsi256()`, `rgbToAnsi16()`, `ansi256ToAnsi16()` pure conversion functions for terminals with limited color support. `ColorLevel` type for color capability detection
- **`AuditStylePort`** — `auditStyle()` test adapter that records all `styled()`/`rgb()`/`hex()`/`bold()` calls for post-hoc assertion. `wasStyled(token, substring)` convenience method. Returns text unchanged for compatibility with existing string assertions

#### TUI (`@flyingrobots/bijou-tui`)

- **`isKeyMsg()` / `isResizeMsg()` type guards** — replace unsafe `as KeyMsg` casts with proper runtime type narrowing
- **`runScript()`** — scripted CLI/stdin driver for automated testing and demos. Feeds key sequences into a TEA app and captures all rendered frames. Supports delays, `onFrame` callbacks, and returns final model + frame history

#### Node adapter (`@flyingrobots/bijou-node`)

- **`chalkStyle()` level override** — accepts optional `level?: 0|1|2|3` for explicit color level control in tests

### 🐛 Fixes

- **`visibleLength()`** — now grapheme-cluster aware in both `dag.ts` and `viewport.ts`; correctly measures CJK, emoji, and combining marks
- **`clipToWidth()`** — grapheme-cluster aware clipping; won't split multi-codepoint sequences
- **`sliceAnsi()`** — grapheme-cluster aware column slicing
- **`truncateLabel()`** — truncates by grapheme clusters, not UTF-16 code units
- **`renderNodeBox()` char iteration** — uses grapheme segmenter instead of `[...line]` code-point spread
- **`flex.ts` duplicate `clipToWidth()`** — removed duplicate; imports from `viewport.ts`
- **`select()` / `multiselect()` / `textarea()` / `filter()`** — Escape key now cancels (in addition to Ctrl+C)
- **`markdown()` word wrap** — wrap plain text before applying inline styles to prevent ANSI escape bytes from causing premature line breaks
- **`sliceAnsi()` double reset** — prevent emitting `\x1b[0m` twice when loop breaks at the endCol boundary
- **`chalkStyle()` global mutation** — scope chalk level override to a per-call instance instead of mutating the global chalk, fixing test order-dependence
- **Hangul syllable range** — correct `isWideChar()` upper bound from `0xD7FF` to `0xD7A3`, excluding narrow Jamo Extended-B characters
- **`wasStyled()` equality** — use structural comparison (hex + modifiers) instead of reference equality on `TokenValue` objects
- **`chalkStyle()` noColor leaking ANSI** — `styled()` and `bold()` now short-circuit when `noColor` is true, preventing modifier ANSI codes from leaking
- **`ansi256ToAnsi16()` negative input** — clamp input to 0–255 range
- **`markdown()` blockquote regex** — handle indented blockquotes (leading whitespace before `>`)
- **`auditStyle()` mutable reference** — `get calls()` now returns a defensive copy
- **progress-download example** — add missing `{ type: 'quit' }` handler for auto-exit; remove unused `vstack` import
- **help example** — clamp `selected` index to >= 0 when deleting last item

### 🔧 Refactors

- Replace `as KeyMsg` / `as ResizeMsg` type casts with `isKeyMsg()` / `isResizeMsg()` type guards across all 23 example `main.ts` files, `demo-tui.ts`, `runtime.ts`, and `eventbus.test.ts`
- **`viewport.ts` grapheme dedup** — remove duplicated `_graphemeClusterWidth()` and `_isWide()`, delegate to `@flyingrobots/bijou` core exports; add lazy singleton `Intl.Segmenter`

### 🧪 Tests

- 143 new tests across 6 new + 7 expanded test files (1352 total)

### 📝 Documentation

- Updated 23 example README code snippets to use type guards (including help, navigable-table, print-key, stopwatch `isKeyMsg()` guard fixes)
- Fix CHANGELOG missing blank line before `## [0.8.0]`
- Fix ROADMAP `StyleAuditPort` → `AuditStylePort`
- Add bare-escape limitation comments to select, filter, multiselect, textarea
- Add `canvas()` shader primitive and `box()` width override to ROADMAP backlog (from XYPH title screen request)

## [0.8.0] — 2026-02-28

### 🚀 Features

#### Core (`@flyingrobots/bijou`)

- **`DagNode` `labelToken`/`badgeToken`** — optional per-node label and badge text color tokens for granular styling beyond border color. Propagated through `arraySource()`, `materialize()`, and `sliceSource()`
- **Color manipulation utilities** — `hexToRgb()`, `rgbToHex()`, `lighten()`, `darken()`, `mix()`, `complementary()`, `saturate()`, `desaturate()` for manipulating theme token colors. All functions preserve token modifiers and clamp amounts to [0,1]

#### TUI (`@flyingrobots/bijou-tui`)

- **`commandPalette()`** — filterable action list building block with case-insensitive substring matching on label/description/category/id/shortcut, focus and page navigation with wrap-around, viewport-clipped rendering, and preconfigured keymap
- **`tooltip()`** — positioned overlay relative to a target element with top/bottom/left/right direction and screen-edge clamping. Reuses existing `renderBox()` helper

### 🐛 Fixes

- **`dag()`** — fix charTypes/chars length mismatch on non-BMP characters (emoji) by using code-point count instead of UTF-16 `.length`
- **`cpPageDown()`/`cpPageUp()`** — change to half-page scroll (`floor(height/2)`) to match vim Ctrl+D/Ctrl+U conventions described in JSDoc
- **`tooltip()`** — clip content lines to screen width before rendering box to prevent overflow
- **`hexToRgb()`** — throw on invalid hex length (e.g. 2, 4, 5, 7+ digit strings)
- **command-palette example** — remove unused `cpSelectedItem` import

### 🧪 Tests

- 104 new tests across 4 test files (2 new, 2 expanded) (1209 total)

### 📝 Documentation

- **2 new examples** — `command-palette`, `tooltip`

## [0.7.0] — 2026-02-28

### 🚀 Features

#### Core (`@flyingrobots/bijou`)

- **`enumeratedList()`** — ordered/unordered list with 6 bullet styles (arabic, alpha, roman, bullet, dash, none), right-aligned numeric prefixes, multi-line item support, and mode degradation (pipe → ASCII fallbacks, accessible → simple numbering)
- **`hyperlink()`** — OSC 8 clickable terminal links with configurable fallback modes (`'url'`, `'text'`, `'both'`) for pipe and accessible environments
- **`log()`** — leveled styled output (debug/info/warn/error/fatal) with `badge()` prefixes, optional timestamps, and mode degradation (pipe → `[LEVEL] message`, accessible → `LEVEL: message`)

#### TUI (`@flyingrobots/bijou-tui`)

- **`place()`** — 2D text placement with horizontal (`left`/`center`/`right`) and vertical (`top`/`middle`/`bottom`) alignment, ANSI-safe width measurement, and automatic clipping
- **`statusBar()`** — segmented header/footer bar with left, center, and right sections, configurable fill character, and overlap priority (left > right > center)
- **`drawer()`** — full-height slide-in side panel overlay with left/right anchoring, optional title, themed borders, and `composite()` integration

### 🧪 Tests

- 84 new tests across 6 new test files (1105 total)

### 📝 Documentation

- **5 new examples** — `enumerated-list`, `hyperlink`, `log`, `status-bar`, `drawer`

## [0.6.0] — 2026-02-27

### 🚀 Features

#### Core (`@flyingrobots/bijou`)

- **`dagStats()`** — pure graph statistics (nodes, edges, depth, width, roots, leaves) with cycle detection, ghost-node filtering, and `SlicedDagSource` support
- **`wizard()`** — multi-step form orchestrator that runs steps sequentially, passes accumulated values to each step, and supports conditional skipping via `skip` predicates

#### TUI (`@flyingrobots/bijou-tui`)

- **`navigableTable()`** — keyboard-navigable table wrapping core `table()` with focus management, vertical scrolling, and vim-style keybindings (`j`/`k`, `d`/`u`, page up/down)
- **`createNavigableTableState()`** — factory for navigable table state with configurable viewport height
- **`navTableFocusNext()` / `navTableFocusPrev()`** — row focus with wrap-around
- **`navTablePageDown()` / `navTablePageUp()`** — page-sized jumps with clamping
- **`navTableKeyMap()`** — preconfigured keybinding map for table navigation
- **`browsableList()`** — navigable list building block with focus tracking, scroll-aware viewport clipping, page navigation, description support, and convenience keymap (`j/k` navigate, `d/u` page, `Enter` select, `q` quit)
- **`filePicker()`** — directory browser building block with focus navigation, scroll windowing, and extension filtering. Uses `IOPort.readDir()` for synchronous directory listing
- **`createFilePickerState()`** — initializes picker state from a directory path and IO port
- **`fpFocusNext()` / `fpFocusPrev()`** — focus navigation with wrap-around and scroll adjustment
- **`fpEnter()` / `fpBack()`** — directory traversal (enter child / go to parent)
- **`filePickerKeyMap()`** — preconfigured vim-style keybindings (j/k, arrows, enter, backspace)

### 🐛 Fixes

#### Node adapter (`@flyingrobots/bijou-node`)

- **`nodeIO().readDir()` directory classification** — entries are now suffixed with `/` for directories (via `statSync`), matching the `IOPort` contract that `filePicker()` relies on; previously `readdirSync()` returned bare names causing all directories to be misclassified as files

#### TUI (`@flyingrobots/bijou-tui`)

- **`filePicker()` unreadable directory crash** — `createFilePickerState()`, `fpEnter()`, and `fpBack()` now gracefully return empty entries instead of throwing when `readDir()` fails on an unreadable directory
- **`filePicker()` / `browsableList()` / `navigableTable()` viewport height** — `height` is now clamped to a minimum of 1, preventing invalid scroll/paging behavior with zero or negative values
- **`browsableList()` items mutation safety** — `createBrowsableListState()` now defensively copies items, consistent with navigable-table
- **`navigableTable()` deep row copy** — `createNavigableTableState()` now deep-copies rows (inner arrays) to prevent external mutation leaking into state
- **`fpBack()` cross-platform paths** — parent directory resolution now uses `io.joinPath()` instead of hardcoded `/` separator

### 🧪 Tests

- **Form edge-case hardening** — added confirm/input empty-answer tests in interactive mode, multiselect toggle-on-off and last-item navigation tests
- **Environment integration matrix** — added form fallback tests for pipe and accessible modes, component × mode matrix, NO_COLOR × component matrix, and CI=true TTY detection variants

### 📝 Documentation

- **5 new examples** — `dag-stats`, `wizard`, `navigable-table`, `browsable-list`, `file-picker` with VHS demo tapes and per-example READMEs

## [0.5.1] — 2026-02-27

### Fixed

- **`@flyingrobots/bijou-node` and `@flyingrobots/bijou-tui` dual-package hazard** — moved `@flyingrobots/bijou` from `dependencies` to `peerDependencies` so downstream consumers get a single shared instance, preventing split `setDefaultContext()` state

## [0.5.0] — 2026-02-27

### Added

#### Core (`@flyingrobots/bijou`)

- **`DagSource` adapter interface** — decouple DAG rendering from in-memory `DagNode[]` arrays; bring your own graph representation (database, API, adjacency matrix, etc.). Uses `has()`/`children()`/`parents()` traversal — never enumerates the full graph
- **`SlicedDagSource`** — bounded subtype of `DagSource` with `ids()` for rendering; produced by `dagSlice()` or `arraySource()`
- **`arraySource()`** — wraps `DagNode[]` as a `SlicedDagSource` for backward compatibility
- **`isDagSource()`** / **`isSlicedDagSource()`** — type guards
- **`DagSliceOptions`** — extracted named type for `dagSlice()` options
- **`dag()`, `dagSlice()`, `dagLayout()` overloads** — accept `SlicedDagSource` or `DagNode[]`; existing callers are unaffected
- **`dagSlice()` returns `SlicedDagSource`** when given `DagSource` input, enabling composable slice-of-slice chains; purely traversal-based (no full-graph enumeration)

### Fixed

#### Core (`@flyingrobots/bijou`)

- **`arraySource()` mutable reference leak** — `children()` and `parents()` now return defensive copies instead of exposing internal mutable arrays
- **`sliceSource()` ghost children leak** — ghost boundary `children()` now returns a copy instead of the internal edges array
- **`isSlicedDagSource()` incomplete guard** — now checks for `ghostLabel` method in addition to `ids` and `ghost`
- **`dagSlice()` default direction crash** — silently downgrades `'both'` to `'descendants'` when `parents()` is missing (only throws if `'ancestors'` was explicitly requested)
- **`dag()`/`dagLayout()` unbounded source guard** — throws a clear error if passed an unbounded `DagSource` directly
- **Inherited ghost preservation** — slice-of-slice now preserves ghost status from the input slice, preventing ghost nodes from rendering with solid borders
- **`sliceSource()` parent fallback performance** — replaced O(n×m) scan with precomputed parent map built during BFS

## [0.4.0] — 2026-02-27

### Added

#### Core (`@flyingrobots/bijou`)

- **`dag()` `selectedId`/`selectedToken`** — cursor-style node highlighting with highest priority over highlight path
- **`dagLayout()`** — returns node position map (`DagNodePosition`) and grid dimensions alongside rendered output, for interactive DAG navigation
- **`textarea()`** — multi-line text input form with cursor navigation, line numbers, placeholder, maxLength, and Ctrl+D submit / Ctrl+C cancel
- **`filter()`** — fuzzy-filter select form with real-time search by label and keywords, customizable match function, and configurable max visible items

#### TUI runtime (`@flyingrobots/bijou-tui`)

- **`stripAnsi()`**, **`visibleLength()`**, **`clipToWidth()`** — publicly exported ANSI utility functions from viewport module
- **viewport `scrollX`** — horizontal scrolling support with `sliceAnsi()`, `scrollByX()`, `scrollToX()`
- **`createPanelGroup()`** — multi-pane focus management with hotkey switching, per-panel KeyMap delegation, InputStack integration, and formatted labels
- **`pager()`** — scrollable content viewer building block wrapping `viewport()` with a status line, position tracking, and convenience keymap (`j/k` scroll, `d/u` page, `g/G` top/bottom, `q` quit)
- **`interactiveAccordion()`** — navigable accordion building block wrapping static `accordion()` with focus tracking, expand/collapse transformers, and convenience keymap (`j/k` navigate, `Enter/Space` toggle, `q` quit)
- **`composite()`** — ANSI-safe overlay compositing with dim background support
- **`modal()`** — centered dialog overlay with title, body, hint, and auto-centering
- **`toast()`** — anchored notification overlay with success/error/info variants

### Fixed

#### Core (`@flyingrobots/bijou`)

- **`filter()` empty-options crash** — guard against empty options array; throws descriptive error or returns `defaultValue` instead of crashing with modulo-by-zero / undefined dereference
- **`filter()` cursor wrap** — cursor navigation now no-ops when the filtered list is empty, preventing `NaN` cursor index
- **`textarea()` maxLength on Enter** — Enter key now respects `maxLength`, preventing newlines from exceeding the character limit
- **`textarea()` width rendering** — the `width` option now clips line content to the specified width instead of being silently ignored
- **`textarea()` placeholder line** — placeholder now renders on the first line (`lineIdx === 0`) instead of on lines beyond the buffer

#### TUI runtime (`@flyingrobots/bijou-tui`)

- **`composite()` dim predicate** — dim check now uses `visibleLength()` instead of raw `.length`, correctly skipping lines that contain only ANSI escape codes
- **`createPanelGroup()` defaultFocus validation** — throws a descriptive error when `defaultFocus` refers to a non-existent panel ID, preventing silent `InputStack` routing failures
- **`pager()` scroll clamp** — clamps scroll offset to the active viewport height, fixing overscroll artifact when `showStatus` is toggled off
- **`interactiveAccordion()` focusIndex normalization** — normalizes stale/out-of-range focus index before rendering to prevent undefined focus behavior
- **`interactiveAccordion()` continuation indentation** — continuation-line padding now matches the focus prefix width for custom `focusChar` values
- **`sliceAnsi()` ANSI leak** — appends reset sequence when the source string ends with an active style, preventing style bleed into subsequent content
- **viewport tests** — replaced inline ANSI-stripping regexes with the imported `stripAnsi()` utility

### Documentation

- **textarea example** — fixed `box()` call with nonexistent `title` option; replaced with `headerBox()`
- **textarea example** — use nullish check (`!= null`) instead of truthy check for cancellation detection
- **pager example** — removed unused `kbd` import; preserve scroll position across terminal resize
- **accordion example** — removed unused `separator` import
- **ROADMAP P1.75** — clarified that `dagStats()` is deferred, not shipped with overlay primitives

## [0.3.0] — 2026-02-27

### Added

#### Core (`@flyingrobots/bijou`)

- **`dag()`** — ASCII DAG renderer with auto-layout (Sugiyama-Lite), edge routing, badges, per-node tokens, path highlighting, and graceful degradation (interactive/pipe/accessible modes)
- **`dagSlice()`** — extract subgraphs (ancestors/descendants/neighborhood) with ghost boundary nodes for rendering fragments of large DAGs

### Fixed

#### Core (`@flyingrobots/bijou`)

- **`dag()` dangling edges** — edges pointing to node IDs not present in the graph no longer trigger a false "cycle detected" error; they are silently filtered out

### Documentation

- **43 example READMEs** — each example now has its own README with description, run command, GIF demo, and embedded source code
- **Examples master-of-contents** — `examples/README.md` with categorized table (Static, Forms, TUI Apps) linking all 43 examples
- **GIF demos** — recorded demo GIFs for all 43 examples via VHS tapes
- **Docs reorganization** — moved root-level docs (ARCHITECTURE, CHANGELOG, EXAMPLES, ROADMAP) into `docs/` directory

### Build

- Added `tsx` as devDependency to eliminate npx cold-start spinner in examples
- Added `record-gifs.ts` script with parallel GIF recording and bijou-powered progress UI

## [0.2.0] — 2026-02-26

### Added

#### Core (`@flyingrobots/bijou`)

- **`IOPort.onResize()`** — new port method for terminal resize events. Implementors receive `(cols, rows)` callbacks with a disposable handle.

#### Node adapter (`@flyingrobots/bijou-node`)

- **Resize listener** — `nodeIO()` implements `onResize` via `process.stdout.on('resize')`

#### TUI runtime (`@flyingrobots/bijou-tui`)

- **Spring animation engine** — damped harmonic oscillator with 6 presets (`default`, `gentle`, `wobbly`, `stiff`, `slow`, `molasses`) and configurable stiffness/damping/mass
- **Tween engine** — duration-based animation with 12 easing functions (linear through quartic, in/out/inOut variants)
- **`animate()`** — GSAP-style TEA command. Spring mode (default, physics-based) or tween mode (duration-based). `immediate: true` for reduced-motion support. `onComplete` callback for signaling when physics settle or tweens finish.
- **`sequence()`** — chain multiple animation commands
- **Multi-frame commands** — `Cmd` type receives an `emit` function, enabling long-running effects (like animations) to fire multiple messages per second back to the app.
- **GSAP Timeline** — `timeline()` builder with position-based timing (`'<'`, `'+=N'`, `'-=N'`, labels), pure state machine driven from the TEA update cycle
- **`viewport()`** — scrollable content pane with proportional scrollbar, ANSI-aware line clipping, scroll state management (`scrollBy`, `scrollTo`, `pageUp`, `pageDown`)
- **`flex()`** — flexbox-style layout with `direction`, `flex-grow`, `basis`, `minSize`/`maxSize`, `gap`, cross-axis alignment. Children can be render functions `(w, h) => string` that reflow on resize. True horizontal alignment for column-based layouts.
- **`ResizeMsg`** — built-in message type for terminal resize events, auto-dispatched by the TEA runtime
- **`EventBus`** — centralized event emitter. Unifies keyboard, resize, and command results into a single typed stream. Supports custom events, multiple subscribers, and clean disposal.
- **Keybinding manager** — `createKeyMap()` for declarative key binding with modifier support (`ctrl+c`, `alt+x`, `shift+tab`), named groups, runtime enable/disable, and `handle(keyMsg)` dispatch.
- **Help generator** — `helpView()` (grouped multi-line), `helpShort()` (single-line summary), `helpFor()` (filter by group prefix). Auto-generated from registered keybindings.
- **Input stack** — `createInputStack()` for layered input dispatch. Push/pop handlers (KeyMap or any `InputHandler`), dispatch top-down with opaque (modal) or passthrough (global shortcuts) layers.

### Changed

#### Core (`@flyingrobots/bijou`)

- **`IOPort` interface** — added `onResize()` method (breaking for custom port implementations)

#### TUI runtime (`@flyingrobots/bijou-tui`)

- **`Cmd` type signature** — Now `(emit: (msg: M) => void) => Promise<M | QuitSignal | void>`.
- **`App.update()`** signature now receives `KeyMsg | ResizeMsg | M` (was `KeyMsg | M`)
- **TEA runtime** refactored to use `EventBus` internally — single subscription drives the update cycle

### Fixed

#### TUI runtime (`@flyingrobots/bijou-tui`)

- **Layout height rounding** — `renderColumn` now correctly pads to the full target height, ensuring footers are anchored to the bottom row.
- **Row cross-axis alignment** — `flex()` row direction no longer conflates inline text alignment with cross-axis (vertical) alignment. `align: 'end'` correctly positions content at the bottom without right-aligning text.
- **Flicker-free rendering** — Refactored `renderFrame` to use `join('\n')` and `\x1b[K` (clear-to-end-of-line), preventing unwanted terminal scrolling and top-line clipping.
- **Scroll-safe initialization** — `enterScreen` now disables auto-wrap (`\x1b[?7l`) to ensure writing to the bottom-right corner doesn't trigger a scroll.
- **Layout hardening** — `flex()` and `hstack()` are now resilient to zero or negative dimensions (preventing `RangeError: repeat count must be non-negative`).
- **Spacers in vstack** — `vstack()` now preserves empty strings, allowing them to function as vertical spacers.
- **EventBus unhandled rejections** — `runCmd()` now catches rejected command promises instead of leaving them unhandled.
- **KeyMap group() safety** — `group()` now uses `try/finally` to restore scope even if the builder callback throws.
- **Duplicate modifier detection** — `parseKeyCombo()` now throws on duplicate modifiers like `"ctrl+ctrl+c"`.

### Showcase

- **High-fidelity demo** — `demo-tui.ts` completely rewritten to demonstrate physics-based springs, GSAP timelines, layered input stacks, real-time process telemetry (CPU/MEM/FPS), and a "Turbo Mode" benchmark.

### Build

- Switched to `tsc -b` with TypeScript project references for dependency-ordered incremental builds
- Added `prepack` script to all packages
- Added `composite: true` to all tsconfig files

## [0.1.0] — 2026-02-25

First public release.

### Added

#### Core (`@flyingrobots/bijou`)

- **Hexagonal architecture** — `RuntimePort`, `IOPort`, `StylePort`, `BijouContext` with automatic output mode detection (interactive, static, pipe, accessible)
- **Layout components** — `box()`, `headerBox()`, `separator()`
- **Element components** — `badge()`, `alert()`, `kbd()`, `skeleton()`
- **Data components** — `table()`, `tree()`, `accordion()`, `timeline()`
- **Navigation components** — `tabs()`, `breadcrumb()`, `stepper()`, `paginator()`
- **Animation** — `spinner()`, `createSpinner()`, `progressBar()`, `createProgressBar()`, `createAnimatedProgressBar()`, `gradientText()`
- **Forms** — `input()`, `select()`, `multiselect()`, `confirm()`, `group()` with validation and graceful pipe/CI degradation
- **Theme engine** — DTCG interop (`fromDTCG`/`toDTCG`), built-in presets (`cyan-magenta`, `nord`, `catppuccin`), `extendTheme()`, `styled()`, `styledStatus()`, `tv()`
- **Test adapters** — `createTestContext()`, `mockRuntime()`, `mockIO()`, `plainStyle()` for deterministic testing without process mocks
- **ASCII logo loader** — `loadRandomLogo()` with small/medium/large sizing

#### Node adapter (`@flyingrobots/bijou-node`)

- `nodeRuntime()`, `nodeIO()`, `chalkStyle()` port implementations
- `createNodeContext()` and `initDefaultContext()` for one-line setup
- Automatic `NO_COLOR`, `FORCE_COLOR`, `CI`, `TERM=dumb` detection

#### TUI runtime (`@flyingrobots/bijou-tui`)

- **TEA (The Elm Architecture) runtime** — `run()` with `App<M>` type (`init`, `update`, `view`)
- **Commands** — `quit()`, `tick()`, `batch()`
- **Key parsing** — `parseKey()` for raw stdin to `KeyMsg`
- **Screen control** — `enterScreen()`, `exitScreen()`, `clearAndHome()`, `renderFrame()`
- **Layout helpers** — `vstack()`, `hstack()`

[Unreleased]: https://github.com/flyingrobots/bijou/compare/v3.1.0...HEAD
[3.1.0]: https://github.com/flyingrobots/bijou/compare/v3.0.0...v3.1.0
[3.0.0]: https://github.com/flyingrobots/bijou/compare/v2.1.0...v3.0.0
[2.1.0]: https://github.com/flyingrobots/bijou/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/flyingrobots/bijou/compare/v1.8.0...v2.0.0
[1.8.0]: https://github.com/flyingrobots/bijou/compare/v1.7.0...v1.8.0
[1.7.0]: https://github.com/flyingrobots/bijou/compare/v1.6.0...v1.7.0
[1.6.0]: https://github.com/flyingrobots/bijou/compare/v1.5.0...v1.6.0
[1.5.0]: https://github.com/flyingrobots/bijou/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/flyingrobots/bijou/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/flyingrobots/bijou/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/flyingrobots/bijou/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/flyingrobots/bijou/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/flyingrobots/bijou/compare/v0.10.1...v1.0.0
[0.10.1]: https://github.com/flyingrobots/bijou/compare/v0.10.0...v0.10.1
[0.10.0]: https://github.com/flyingrobots/bijou/compare/v0.9.0...v0.10.0
[0.9.0]: https://github.com/flyingrobots/bijou/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/flyingrobots/bijou/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/flyingrobots/bijou/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/flyingrobots/bijou/compare/v0.5.1...v0.6.0
[0.5.1]: https://github.com/flyingrobots/bijou/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/flyingrobots/bijou/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/flyingrobots/bijou/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/flyingrobots/bijou/releases/tag/v0.3.0
[0.2.0]: https://github.com/flyingrobots/bijou/releases/tag/v0.2.0
[0.1.0]: https://github.com/flyingrobots/bijou/releases/tag/v0.1.0
- defaulted core box/table component overflow to wrap instead of truncate, with per-instance `overflow: 'truncate'` overrides and matching surface support
