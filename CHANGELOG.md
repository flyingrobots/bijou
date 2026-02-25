# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added

- **DTCG Theme Engine Enhancements**:
  - `loadTheme()`, `loadThemesFromDir()` — data-driven theme loading via `IOPort` (ROADMAP #2)
  - `BIJOU_THEME` now supports direct `.json` file paths (e.g., `BIJOU_THEME=./themes/my-brand.json`)
  - **New Presets**: `nord` (arctic/clean) and `catppuccin` (modern/vibrant Mocha variant) added to built-in registry
  - Exported `nord.json` and `catppuccin.json` as reference DTCG documents in `packages/bijou/themes/`
  - Added Design System integration documentation for **Tokens Studio for Figma** and **Style Dictionary**
- **Robustness**:
  - `badge()` component now searches both `status` and `semantic` groups (supporting `accent` and `primary` variants)
  - `badge()` is now bulletproof with global `try-catch` and deep property guards to prevent theme-lookup crashes
- **Monorepo DX**:
  - Root `tsconfig.json` with path mapping to solve the "Dual Package Hazard" during local development
  - Interactive theme switching added to `demo.ts` and `demo-tui.ts` (press `t` to cycle themes live)

- **`@flyingrobots/bijou-tui`** — new package: TEA (The Elm Architecture) runtime for terminal UIs
  - `run()` — TEA event loop with keyboard input, alt screen management, and graceful cleanup
  - `parseKey()` — raw ANSI byte string → structured `KeyMsg` (arrows, ctrl combos, special keys)
  - `quit()`, `tick()`, `batch()` — built-in command constructors
  - `vstack()`, `hstack()` — layout composition helpers with ANSI-aware width calculation
  - `enterScreen()`, `exitScreen()`, `clearAndHome()` — screen control via `IOPort`
  - Graceful degradation: non-interactive modes render once and exit
  - Double Ctrl+C force-quit with terminal state restoration
  - ~43 tests across keys, screen, commands, layout, and runtime modules

- **Data components** (ROADMAP: Component catalog → Data):
  - `tree()` — hierarchical tree display with box-drawing connectors, accessible item-count annotations
  - `accordion()` — collapsible sections with ▼/▶ indicators, pipe mode shows all content as markdown
  - `timeline()` — vertical event timeline with filled/hollow status dots and connector lines
- **Navigation components** (ROADMAP: Component catalog → Navigation):
  - `tabs()` — tab bar with active indicator, badge support, custom separators
  - `breadcrumb()` — path breadcrumb with muted parents and bold current location
  - `paginator()` — page indicator in dots or text style
  - `stepper()` — multi-step progress with completed/active/pending markers
- **Element components** (ROADMAP: Component catalog → Element):
  - `separator()` — horizontal divider with optional label, full-width by default
  - `badge()` — colored label with inverse styling, 5 variants (success/error/warning/info/muted)
  - `alert()` — styled message box with icon, delegates to `box()`, 4 variants
  - `skeleton()` — loading placeholder with configurable width/lines
  - `kbd()` — keyboard key display with styled brackets and bold text

- **ROADMAP**: Added `appFrame` TEA app shell concept, backlog with P0–P3 priorities from Charm ecosystem gap analysis

### Changed

- **DTCG edge-case hardening** (ROADMAP #6):
  - `fromDTCG()` now throws on circular references (`Circular reference detected: ...`)
  - `fromDTCG()` now throws on unresolvable references (`Unresolvable reference: ...`)
  - Reference resolution is now recursive — multi-level chains (`{a}` → `{b}` → `#hex`) resolve correctly
  - Added `toDTCG()` schema validation test (every token has `$type`/`$value`)
  - Added custom theme round-trip test covering all modifier types and multi-stop gradients

### Fixed

- **README accuracy**:
  - Corrected output mode name (`rich` → `interactive`) and added missing `static` mode
  - Fixed `gradientText` and `progressBar` API examples to match actual signatures
  - Fixed accessible mode trigger (`TERM_PROGRAM=accessibility` → `BIJOU_ACCESSIBLE=1`)
  - Corrected `RuntimePort` port description (removed non-existent `exit()`)
  - Added environment variables reference table
  - Documented test adapter subpath export and `createNodeContext` vs `initDefaultContext`
- **initDefaultContext() test coverage**: added `_resetInitializedForTesting()` helper and tests verifying first-call sets default context, subsequent calls don't overwrite it
- **Consistent env stubbing**: replaced direct `process.env` mutation in `runtime.test.ts` with `vi.stubEnv()`/`vi.unstubAllEnvs()`
- **Modifier ANSI assertions**: added conditional `it.runIf` tests for bold, dim, strikethrough, and inverse modifiers in `style.test.ts`
- **TTY coverage documentation**: noted `question()`/`rawInput()` are not unit-testable without a TTY

### Added

- `_resetDefaultContextForTesting` re-exported from `@flyingrobots/bijou` barrel

## [0.1.0] - 2026-02-23

### Added

- **Hexagonal architecture monorepo** with `@flyingrobots/bijou` (zero-dep core) and `@flyingrobots/bijou-node` (chalk/readline/process adapter)
- **Port interfaces**: `RuntimePort`, `IOPort`, `StylePort`, `BijouContext`
- **Test adapters**: `mockRuntime()`, `mockIO()`, `plainStyle()`, `createTestContext()`
- **Theme engine**: `Theme<S, U, G>` triple-generic, two presets (`cyan-magenta`, `teal-orange-pink`), `BIJOU_THEME` env var selection
- **DTCG interop**: `fromDTCG()` / `toDTCG()` for Design Token Community Group JSON
- **Gradient text**: `lerp3()` interpolation, `gradientText()` with NO_COLOR support
- **Theme resolver**: `createThemeResolver()` factory with configurable env var, presets, fallback
- **Output detection**: `detectOutputMode()` → `interactive` | `static` | `pipe` | `accessible`, respects `NO_COLOR`, `TERM=dumb`, `CI`, `BIJOU_ACCESSIBLE`
- **Components**: `box()`, `headerBox()`, `table()`, `progressBar()`, `spinnerFrame()`, `createSpinner()`, `loadRandomLogo()`, `selectLogoSize()`
- **Forms**: `input()`, `select()`, `multiselect()`, `confirm()`, `group()`
- **Graceful degradation** across all output modes for every component
- **CI workflow**: test + typecheck on Node 18/20/22
- **Release workflow**: tag-based publish with OIDC provenance, tag-on-main guard, version verification, retry with backoff, prerelease dist-tags
- **Lockstep versioning**: `npm run version <ver>` bumps all packages and cross-deps in one command
- **README** with install, quick start, architecture, and compatibility notes
- **ROADMAP** with "Tests ARE the Spec" format: user stories, requirements, acceptance criteria, test plans

### Tested

- **Form functions** (42 tests): `confirm()`, `input()`, `select()`, `multiselect()` across pipe, accessible, and non-interactive modes
- **Factory + context** (15 tests): `createBijou()` wiring, theme resolution, NO_COLOR, default context singleton
- **Test adapter self-tests** (31 tests): `mockRuntime()`, `mockIO()`, `plainStyle()`, `createTestContext()`
- **Environment integration** (24 tests): NO_COLOR compliance, piped output degradation, CI/TERM=dumb detection, accessible mode, conflicting env vars
- **DTCG edge cases** (8 tests): round-trip for all presets, unresolvable/circular refs, missing groups, modifier preservation
- **bijou-node adapters** (29 tests): `nodeRuntime()`, `nodeIO()`, `chalkStyle()`, `createBijouNode()` integration

[Unreleased]: https://github.com/flyingrobots/bijou/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/flyingrobots/bijou/releases/tag/v0.1.0
