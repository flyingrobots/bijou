# Changelog

All notable changes to this project will be documented in this file.

All packages (`@flyingrobots/bijou`, `@flyingrobots/bijou-node`, `@flyingrobots/bijou-tui`) are versioned in lock-step.

## [Unreleased]

### ♻️ Refactors

- **Extract shared `resolveCtx` / `resolveSafeCtx`** — deduplicate the `resolveCtx` helper that was copy-pasted across 20 component files into a single shared module (`core/resolve-ctx.ts`). Both variants (strict and safe/try-catch) are exported from the bijou barrel. No runtime behavior change.

### 🐛 Bug Fixes

- **`tree()` `labelToken` wired up** — the `labelToken` option declared in `TreeOptions` is now passed through to `renderRich` and applied to node labels via `ctx.style.styled()`. Previously the option was accepted but silently ignored.
- **`clip.ts` ANSI regex** — convert `ANSI_RE` from regex literal to `RegExp` constructor to avoid Biome `noControlCharactersInRegex` lint violation
- **`select()` empty options guard** — throw `Error` when `options.options` is empty instead of allowing undefined dereference
- **`timeline()` duplicate track guard** — throw `Error` on duplicate track names during `build()` to prevent silent state overwrites
- **`timeline.step()` dt validation** — throw `Error` when `dt` is negative, `NaN`, or infinite to prevent corrupted timeline state
- **`readDir` uses `withFileTypes`** — replace `statSync` per-entry with `readdirSync({ withFileTypes: true })` to reliably identify directories without a separate stat call

### 📝 Documentation

- **JSDoc review fixes** — fix 57 issues found during self-review of JSDoc coverage: correct `OutputMode` values in `BijouContext.mode` (critical), add missing `@param`/`@returns`/`@throws` tags across all three packages, merge 12 split JSDoc blocks in bijou-tui, unify `resolveCtx` wording across 16 components, standardize punctuation (en-dashes, em-dashes, `6x6x6`), strip redundant implementation overload docs, and fix inaccurate descriptions (`readDir` sort claim, `NO_COLOR` attribution, "Mutable" snapshot, field check order)
- **CodeRabbit JSDoc review fixes** — address 16 documentation review comments from PR #25: fix CHANGELOG compare links for v0.10.1, clarify `BrowsableListItem.value`/`description` JSDoc, rename "Immutable" to "Readonly" in `BrowsableListState`, remove blank line before `@template` in `initBrowsableList`, fix verb tense in `createEventBus`, clarify `alignCross` `totalCrossSize` units, fix `ModalOptions.width` to "preferred minimum width", note hard truncation in `box()` `clipToWidth`, document `labelToken` override in `headerBox`, use "local wall-clock time" in `formatTimestamp`, note optional timestamp/prefix in `log()`, fix "mid-style" wording in `clipToWidth`, add non-blocking validation remark to `input()`, use "code point" in `ShaderFn` return, add `getDefaultContext` cross-reference to `resolveCtx`
- **CodeRabbit code review fixes** — remove unused `ctx?: BijouContext` option from `StatusBarOptions` (dead API surface that was never read by `statusBar()`); clarify `helpFor` JSDoc to note that `groupFilter` in options is overridden by the `groupPrefix` parameter
- **viewport JSDoc** — change "characters wide" to "visible columns wide" to reflect grapheme/ANSI-aware width measurement

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

[Unreleased]: https://github.com/flyingrobots/bijou/compare/v0.10.1...HEAD
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
