# Changelog

All notable changes to this project will be documented in this file.

All packages (`@flyingrobots/bijou`, `@flyingrobots/bijou-node`, `@flyingrobots/bijou-tui`) are versioned in lock-step.

## [Unreleased]

### Added

#### Core (`@flyingrobots/bijou`)

- **`DagSource` adapter interface** — decouple DAG rendering from in-memory `DagNode[]` arrays; bring your own graph representation (database, API, adjacency matrix, etc.)
- **`arraySource()`** — wraps `DagNode[]` as a `DagSource` for backward compatibility
- **`isDagSource()`** — type guard for `DagSource` vs `DagNode[]`
- **`DagSliceOptions`** — extracted named type for `dagSlice()` options
- **`dag()`, `dagSlice()`, `dagLayout()` overloads** — all three functions now accept either `DagSource` or `DagNode[]`; existing `DagNode[]` callers are unaffected
- **`dagSlice()` returns `DagSource`** when given `DagSource` input, enabling composable slice-of-slice chains

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

[Unreleased]: https://github.com/flyingrobots/bijou/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/flyingrobots/bijou/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/flyingrobots/bijou/releases/tag/v0.3.0
[0.2.0]: https://github.com/flyingrobots/bijou/releases/tag/v0.2.0
[0.1.0]: https://github.com/flyingrobots/bijou/releases/tag/v0.1.0
