# @flyingrobots/bijou

The pure, zero-dependency core of Bijou.

`@flyingrobots/bijou` is the degradation-first terminal toolkit in the Bijou stack. It contains components, prompts, themes, environment detection, test adapters, and the foundational `Surface` and `LayoutNode` primitives that the V3 runtime builds on.

## What's New in v3.0.0

- **Truthful core/runtime split** — the core package remains the right place for CLIs, prompts, logs, and portable terminal output, while `@flyingrobots/bijou-tui` owns the high-fidelity fullscreen runtime.
- **Surface primitives without abandoning strings** — V3 adds serious surface/layout infrastructure to the core package, but `3.0.0` does not pretend every component is now surface-native. String-oriented helpers remain first-class where they fit the toolkit identity.
- **Surface-first companions for common V3 chrome** — `boxSurface`, `headerBoxSurface`, `separatorSurface`, `alertSurface`, and `tableSurface` let runtime apps stay on the `Surface` path for the most common layout and status primitives.
- **Explicit core/runtime boundaries** — when you move `Surface` output back into string-first core APIs, you do it explicitly with `surfaceToString(surface, ctx.style)`.
- **Same hexagonal core** — ports, themes, output-mode detection, and test adapters remain pure and dependency-free.

## Install

```bash
npm install @flyingrobots/bijou @flyingrobots/bijou-node
```

## Quick Start

```typescript
import { initDefaultContext } from '@flyingrobots/bijou-node';
import { badge, boxSurface, tableSurface } from '@flyingrobots/bijou';

// Initialize Node.js adapters (auto-detects TTY, CI, NO_COLOR)
const ctx = initDefaultContext();

const panel = boxSurface(
  tableSurface({
    columns: [{ header: 'Service' }, { header: 'Status' }],
    rows: [['api', badge('LIVE', { variant: 'success', ctx })]],
    ctx,
  }),
  { title: 'Runtime', padding: { top: 1, bottom: 1, left: 2, right: 2 }, ctx },
);

// Return `panel` from a V3 `view()` function or framed pane renderer.
```

## Features Breakdown

- **Resilient rendering**: automatic mode switching for interactive, static, pipe, and accessible output.
- **Core UI primitives**: `box`, `headerBox`, `table`, `tree`, `accordion`, `tabs`, `breadcrumb`, `stepper`, `timeline`, `paginator`.
- **Graph tooling**: `dag`, `dagSlice`, and `dagStats` for visualizing and analyzing DAGs.
- **Interactive forms**: `input`, `select`, `multiselect`, `confirm`, `group`, `wizard`, `textarea`, and `filter`.
- **Theme system**: preset themes + DTCG-compatible custom token loading via `BIJOU_THEME`.
- **Test adapters**: deterministic test context and assertion helpers for mock-free component testing.

## Design guidance

For the system-level guidance behind the component catalog, see:

- [`../../docs/design-system/README.md`](../../docs/design-system/README.md)
- [`../../docs/design-system/foundations.md`](../../docs/design-system/foundations.md)
- [`../../docs/design-system/patterns.md`](../../docs/design-system/patterns.md)
- [`../../docs/design-system/component-families.md`](../../docs/design-system/component-families.md)

Those docs answer the questions the API reference cannot:

- when to use a family
- when not to use it
- which variation is semantic versus render-path versus interaction-layer
- what belongs in core Bijou versus `@flyingrobots/bijou-tui`

## Choosing Component Families

### Status and feedback

- Use `badge()` when status is compact and belongs inline with another object.
- Use `note()` when the user needs explanation without urgency.
- Use `alert()` when the message should persist inside the page or document flow.
- Move to `@flyingrobots/bijou-tui` notifications when stacking, placement, actions, or history matter.

### Selection and prompts

- Use `select()` when the user is choosing one stored value from a short, stable set.
- Use `filter()` when the user is still choosing one stored value, but search and narrowing are the real job.
- Use `multiselect()` when the user is building a lasting set, not firing one-off commands.
- Use `confirm()` only when the decision is genuinely binary.
- Move to `commandPaletteSurface()` in `@flyingrobots/bijou-tui` when the outcome is an action or navigation command instead of stored form state.

### Tables and inspection

- Use `table()` when row/column comparison is the main job and string output is still the right endpoint.
- Use `tableSurface()` when the job is still passive comparison, but your V3 app is already composing `Surface` output.
- Use `navigableTable()` from `@flyingrobots/bijou-tui` when the user needs keyboard-owned row or cell inspection instead of passive reading.

## Components

### Layout
`box()`, `headerBox()`, `separator()` plus `boxSurface()`, `headerBoxSurface()`, `separatorSurface()` — string-first helpers and surface-native companions for layout chrome.

### Elements
`badge()`, `alert()`, `alertSurface()`, `kbd()`, `skeleton()` — inline status, in-flow status blocks, and UI primitives.

### Data
`table()`, `tableSurface()`, `tree()`, `accordion()`, `timeline()`, `dag()`, `dagSlice()`, `dagLayout()`, `dagStats()` — passive comparison and structured data display, DAG rendering with `DagSource` adapter, and graph statistics.

### Navigation
`tabs()`, `breadcrumb()`, `stepper()`, `paginator()` — wayfinding components.

### Animation & Progress
`spinner()`, `progressBar()`, `gradientText()` — live-updating output with color gradients.

### Forms
`input()`, `select()`, `multiselect()`, `confirm()`, `group()`, `wizard()`, `textarea()`, `filter()` — interactive prompts with validation that degrade to numbered-list selection in pipe/CI modes.

### Theme Engine
DTCG (Design Tokens Community Group) interop. Built-in presets: `nord`, `catppuccin`, `cyan-magenta`, `teal-orange-pink`. Load custom themes via `BIJOU_THEME` env var or `extendTheme()`.

## Architecture

bijou uses a Ports and Adapters (hexagonal) architecture. See [ARCHITECTURE.md](./ARCHITECTURE.md) for the package-level design and [`../../docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md) for the monorepo-wide architecture.

The core is pure TypeScript with zero runtime dependencies — all platform concerns flow through three ports:

- **`RuntimePort`** — environment variables, TTY detection, terminal dimensions
- **`IOPort`** — stdout writes, stdin reads, resize events, file I/O
- **`StylePort`** — RGB/hex color application, bold/italic/etc.

### Output Modes

bijou auto-detects the environment and adapts rendering:

| Mode | Trigger | Behavior |
| :--- | :--- | :--- |
| **Interactive** | TTY | Full RGB, unicode, animations |
| **Static** | `CI=true` | Single-frame, no animations |
| **Pipe** | Piped stdout | Plain text, ASCII fallbacks |
| **Accessible** | `BIJOU_ACCESSIBLE=1` | Screen-reader friendly |

## Testing

Import test adapters for deterministic, mock-free component testing:

```typescript
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { box } from '@flyingrobots/bijou';

const ctx = createTestContext({ mode: 'interactive' });
const result = box('hello', { ctx });
// Assert on the string directly — no process mocking needed
```

See [GUIDE.md](./GUIDE.md) for more on testing, theming, and component usage.
For upgrading existing apps, see the monorepo migration guide at [`../../docs/MIGRATING_TO_V4.md`](../../docs/MIGRATING_TO_V4.md).

## Related Packages

- [`@flyingrobots/bijou-node`](https://www.npmjs.com/package/@flyingrobots/bijou-node) — Node.js runtime adapter (chalk, readline, process)
- [`@flyingrobots/bijou-tui`](https://www.npmjs.com/package/@flyingrobots/bijou-tui) — TEA runtime for interactive terminal apps

## License

MIT

---

<p align="center">
Built with 💎 by <a href="https://github.com/flyingrobots">FLYING ROBOTS</a>
</p>

```rust
.-:::::':::   .-:.     ::-.::::::.    :::.  .,-:::::/
;;;'''' ;;;    ';;.   ;;;;';;;`;;;;,  `;;;,;;-'````'
[[[,,== [[[      '[[,[[['  [[[  [[[[[. '[[[[[   [[[[[[/
`$$$"`` $$'        c$$"    $$$  $$$ "Y$c$$"$$c.    "$$
 888   o88oo,.__ ,8P"`     888  888    Y88 `Y8bo,,,o88o
 "MM,  """"YUMMMmM"        MMM  MMM     YM   `'YMUP"YMM
:::::::..       ...     :::::::.      ...   :::::::::::: .::::::.
;;;;``;;;;   .;;;;;;;.   ;;;'';;'  .;;;;;;;.;;;;;;;;'''';;;`    `
 [[[,/[[['  ,[[     \[[, [[[__[[\.,[[     \[[,   [[     '[==/[[[[,
 $$$$$$c    $$$,     $$$ $$""""Y$$$$$,     $$$   $$       '''    $
 888b "88bo,"888,_ _,88P_88o,,od8P"888,_ _,88P   88,     88b    dP
 MMMM   "W"   "YMMMMMP" ""YUMMMP"   "YMMMMMP"    MMM      "YMmMY"
```
