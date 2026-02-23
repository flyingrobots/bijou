# @flyingrobots/bijou — Roadmap

Themed terminal components for CLIs, loggers, and scripts.
Inspired by Go's [Charm](https://charm.sh) ecosystem (lipgloss + bubbles + huh), but for TypeScript/Node.js.

## Current: v0.1.0 — Core Package

The MVP ships a framework-agnostic core with zero React/Ink/Vue dependencies.

### Theme Engine
- [x] Generic `Theme<S>` with extensible status keys
- [x] Two presets: `cyan-magenta`, `teal-orange-pink`
- [x] `createThemeResolver()` factory — configurable env var, presets, fallback
- [x] Chalk adapter: `styled()`, `styledStatus()`, `chalkFromToken()`
- [x] Gradient interpolation: `lerp3()`, `gradientText()`
- [x] NO_COLOR compliance (no-color.org)

### Output Detection
- [x] `detectOutputMode()` → `interactive` | `static` | `pipe` | `accessible`
- [x] Respects `BIJOU_ACCESSIBLE`, `NO_COLOR`, `TERM=dumb`, `CI`, TTY detection

### Components
- [x] `spinnerFrame()` / `createSpinner()` — animated terminal spinner
- [x] `progressBar()` — gradient-colored progress bar
- [x] `table()` — themed cli-table3 wrapper
- [x] `box()` / `headerBox()` — themed boxen wrapper
- [x] `loadRandomLogo()` / `selectLogoSize()` — ASCII art loader

### Forms
- [x] `input()` — text prompt via readline
- [x] `select()` — single-select with arrow keys
- [x] `multiselect()` — multi-select with space toggle
- [x] `confirm()` — yes/no prompt
- [x] `group()` — chain fields into a sequence

### Graceful Degradation
All components degrade across four output modes:

| Component | interactive | static | pipe | accessible |
|-----------|------------|--------|------|------------|
| Spinner | Animated frames | `... Loading` | `Loading...` | `Loading. Please wait.` |
| Progress | `[████░░░] 45%` colored | Same, no animation | `Progress: 45%` | `45 percent complete.` |
| Table | Themed borders+colors | Borders, no color | TSV | `Row 1: Name=foo` |
| Box | Colored border | Border, no color | Content only | Content with header |
| Select | Arrow-key navigation | Numbered list | Numbered to stdin | `Enter number:` |

---

## Next: Framework Adapters

Separate entry points — only pull in framework deps when imported.

### `@flyingrobots/bijou/ink`
- `ThemeProvider` — React context for Ink apps
- `useTheme()` — hook to access resolved theme
- `Scrollbar` — vertical scroll indicator component
- `useScrollableList()` — hook for paginated list navigation

### `@flyingrobots/bijou/vue` (if/when vue-termui matures)
- `provideTheme()` / `useTheme()`
- Equivalent component wrappers

---

## Future: Component Catalog

Growing toward a full terminal component library (a la Nuxt UI for terminals).

### Element
- `alert()` — styled info/warn/error/success messages
- `badge()` — inline status badge
- `separator()` — horizontal rule with optional label
- `skeleton()` — placeholder loading state
- `kbd()` — keyboard shortcut display

### Data
- `accordion()` — collapsible sections
- `tree()` — indented tree view
- `timeline()` — vertical event timeline

### Navigation
- `tabs()` — tab bar with active indicator
- `breadcrumb()` — path breadcrumb
- `paginator()` — page N of M controls
- `stepper()` — multi-step wizard progress
- `commandPalette()` — fuzzy-filter command picker

### Overlay
- `modal()` — centered overlay box
- `toast()` — transient notification
- `drawer()` — slide-in side panel

---

## Xyph Migration Path

Once bijou is published:

1. `npm install @flyingrobots/bijou`
2. Create `src/tui/theme/xyph-theme.ts` — defines `XyphStatusKey` union, xyph presets, calls `createThemeResolver({ envVar: 'XYPH_THEME', ... })`
3. Replace imports: `./theme/index.js` → `@flyingrobots/bijou` + `./theme/xyph-theme.js`
4. Delete extracted files from `src/tui/theme/` (keep xyph-theme.ts)
5. Replace inline patterns: `asciiBar()` → `progressBar()`, table boilerplate → `table()`
6. Views and Ink components stay in xyph — they're domain-specific consumers
7. When `/ink` adapter ships, migrate `Scrollbar`, `ThemeProvider`, `useTheme`
