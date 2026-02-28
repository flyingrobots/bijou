# Changelog

All notable changes to this project will be documented in this file.

All packages (`@flyingrobots/bijou`, `@flyingrobots/bijou-node`, `@flyingrobots/bijou-tui`) are versioned in lock-step.

## [Unreleased]

## [0.8.0] — 2026-02-28

### 🚀 Features

#### Core (`@flyingrobots/bijou`)

- **`DagNode` `labelToken`/`badgeToken`** — optional per-node label and badge text color tokens for granular styling beyond border color. Propagated through `arraySource()`, `materialize()`, and `sliceSource()`
- **Color manipulation utilities** — `hexToRgb()`, `rgbToHex()`, `lighten()`, `darken()`, `mix()`, `complementary()`, `saturate()`, `desaturate()` for manipulating theme token colors. All functions preserve token modifiers and clamp amounts to [0,1]

#### TUI (`@flyingrobots/bijou-tui`)

- **`commandPalette()`** — filterable action list building block with case-insensitive substring matching on label/description/category/id/shortcut, focus and page navigation with wrap-around, viewport-clipped rendering, and preconfigured keymap
- **`tooltip()`** — positioned overlay relative to a target element with top/bottom/left/right direction and screen-edge clamping. Reuses existing `renderBox()` helper

### 🧪 Tests

- 93 new tests across 2 new test files (1198 total)

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

- **6 new examples** — `enumerated-list`, `hyperlink`, `log`, `status-bar`, `drawer`

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

### 🐛 Bug Fixes

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

[Unreleased]: https://github.com/flyingrobots/bijou/compare/v0.8.0...HEAD
[0.8.0]: https://github.com/flyingrobots/bijou/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/flyingrobots/bijou/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/flyingrobots/bijou/compare/v0.5.1...v0.6.0
[0.5.1]: https://github.com/flyingrobots/bijou/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/flyingrobots/bijou/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/flyingrobots/bijou/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/flyingrobots/bijou/releases/tag/v0.3.0
[0.2.0]: https://github.com/flyingrobots/bijou/releases/tag/v0.2.0
[0.1.0]: https://github.com/flyingrobots/bijou/releases/tag/v0.1.0
