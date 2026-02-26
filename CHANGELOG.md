# Changelog

All notable changes to this project will be documented in this file.

All packages (`@flyingrobots/bijou`, `@flyingrobots/bijou-node`, `@flyingrobots/bijou-tui`) are versioned in lock-step.

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

[0.1.0]: https://github.com/flyingrobots/bijou/releases/tag/v0.1.0
