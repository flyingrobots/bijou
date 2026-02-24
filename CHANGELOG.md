# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0] - 2026-02-23

### Added

- **Hexagonal architecture monorepo** with `@flyingrobots/bijou` (zero-dep core) and `@flyingrobots/bijou-node` (chalk/readline/process adapter)
- **Port interfaces**: `RuntimePort`, `IOPort`, `StylePort`, `BijouContext`
- **Test adapters**: `mockRuntime()`, `mockIO()`, `plainStyle()`, `createTestContext()`
- **Theme engine**: `Theme<S, U, G>` triple-generic, two presets (`cyan-magenta`, `teal-orange-pink`), `BIJOU_THEME` env var selection
- **DTCG interop**: `fromDTCG()` / `toDTCG()` for Design Token Community Group JSON
- **Gradient text**: `lerp3()` interpolation, `gradientText()` with NO_COLOR support
- **Theme resolver**: `createThemeResolver()` factory with configurable env var, presets, fallback
- **Output detection**: `detectOutputMode()` → `rich` | `pipe` | `accessible`, respects `NO_COLOR`, `TERM=dumb`, `CI`, `BIJOU_ACCESSIBLE`
- **Components**: `box()`, `headerBox()`, `table()`, `progressBar()`, `spinnerFrame()`, `createSpinner()`, `loadRandomLogo()`, `selectLogoSize()`
- **Forms**: `input()`, `select()`, `multiselect()`, `confirm()`, `group()`
- **Graceful degradation** across all output modes for every component
- **CI workflow**: test + typecheck on Node 18/20/22
- **Release workflow**: tag-based publish with OIDC provenance, tag-on-main guard, version verification, retry with backoff, prerelease dist-tags
- **Lockstep versioning**: `npm run version <ver>` bumps all packages and cross-deps in one command
