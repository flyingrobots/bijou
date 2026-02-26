# Changelog

All notable changes to this project will be documented in this file.

All packages (`@flyingrobots/bijou`, `@flyingrobots/bijou-node`, `@flyingrobots/bijou-tui`) are versioned in lock-step.

## [Unreleased]

### Added

#### TUI runtime (`@flyingrobots/bijou-tui`)

- **Multi-frame commands** — `Cmd` type updated to receive an `emit` function, enabling long-running effects (like animations) to fire multiple messages per second back to the app.
- **Animation completion signal** — `animate()` now accepts an `onComplete` callback to signal precisely when physics have settled or a tween has finished.
- **Flicker-free rendering** — Refactored `renderFrame` to use `join('\n')` and `\x1b[K` (clear-to-end-of-line), preventing unwanted terminal scrolling and top-line clipping.
- **Scroll-safe initialization** — `enterScreen` now disables auto-wrap (`\x1b[?7l`) to ensure writing to the bottom-right corner doesn't trigger a scroll.
- **Layout hardening** — `flex()` and `hstack()` are now resilient to zero or negative dimensions (preventing `RangeError: repeat count must be non-negative`).
- **Enhanced Flex centering** — `flex()` now supports true horizontal alignment for column-based layouts.
- **Spacers in vstack** — `vstack()` now preserves empty strings, allowing them to function as vertical spacers.

### Fixed

- **Escape key mapping** — Keyboard parser now emits `'esc'` instead of `'escape'` for better compatibility with common TUI keybindings.
- **Layout height rounding** — `renderColumn` now correctly pads to the full target height, ensuring footers are anchored to the bottom row.

### Showcase

- **High-fidelity demo** — `demo-tui.ts` completely rewritten to demonstrate physics-based springs, GSAP timelines, layered input stacks, real-time process telemetry (CPU/MEM/FPS), and a "Turbo Mode" benchmark.

### Changed

#### TUI runtime (`@flyingrobots/bijou-tui`)

- **`Cmd` type signature** — Now `(emit: (msg: M) => void) => Promise<M | QuitSignal | void>`.
- **Keybinding manager** — `createKeyMap()` for declarative key binding with modifier support (`ctrl+c`, `alt+x`, `shift+tab`), named groups, runtime enable/disable, and `handle(keyMsg)` dispatch.
- **Help generator** — `helpView()` (grouped multi-line), `helpShort()` (single-line summary), `helpFor()` (filter by group prefix). Auto-generated from registered keybindings.
- **Input stack** — `createInputStack()` for layered input dispatch. Push/pop handlers (KeyMap or any `InputHandler`), dispatch top-down with opaque (modal) or passthrough (global shortcuts) layers.

## [0.2.0] — 2026-02-26

### Added

#### Core (`@flyingrobots/bijou`)

- **`IOPort.onResize()`** — new port method for terminal resize events. Implementors receive `(cols, rows)` callbacks with a disposable handle.

#### Node adapter (`@flyingrobots/bijou-node`)

- **Resize listener** — `nodeIO()` implements `onResize` via `process.stdout.on('resize')`

#### TUI runtime (`@flyingrobots/bijou-tui`)

- **Spring animation engine** — damped harmonic oscillator with 6 presets (`default`, `gentle`, `wobbly`, `stiff`, `slow`, `molasses`) and configurable stiffness/damping/mass
- **Tween engine** — duration-based animation with 12 easing functions (linear through quartic, in/out/inOut variants)
- **`animate()`** — GSAP-style TEA command. Spring mode (default, physics-based) or tween mode (duration-based). `immediate: true` for reduced-motion support.
- **`sequence()`** — chain multiple animation commands
- **GSAP Timeline** — `timeline()` builder with position-based timing (`'<'`, `'+=N'`, `'-=N'`, labels), pure state machine driven from the TEA update cycle
- **`viewport()`** — scrollable content pane with proportional scrollbar, ANSI-aware line clipping, scroll state management (`scrollBy`, `scrollTo`, `pageUp`, `pageDown`)
- **`flex()`** — flexbox-style layout with `direction`, `flex-grow`, `basis`, `minSize`/`maxSize`, `gap`, cross-axis alignment. Children can be render functions `(w, h) => string` that reflow on resize.
- **`ResizeMsg`** — built-in message type for terminal resize events, auto-dispatched by the TEA runtime
- **`EventBus`** — centralized event emitter. Unifies keyboard, resize, and command results into a single typed stream. Supports custom events, multiple subscribers, and clean disposal.

### Changed

#### Core (`@flyingrobots/bijou`)

- **`IOPort` interface** — added `onResize()` method (breaking for custom port implementations)

#### TUI runtime (`@flyingrobots/bijou-tui`)

- **`App.update()`** signature now receives `KeyMsg | ResizeMsg | M` (was `KeyMsg | M`)
- **TEA runtime** refactored to use `EventBus` internally — single subscription drives the update cycle

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

[0.2.0]: https://github.com/flyingrobots/bijou/releases/tag/v0.2.0
[0.1.0]: https://github.com/flyingrobots/bijou/releases/tag/v0.1.0
