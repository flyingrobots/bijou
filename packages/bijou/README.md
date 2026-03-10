# @flyingrobots/bijou

The pure core of the Bijou terminal graphics engine.

This package contains the **zero-dependency** foundation of Bijou, focusing entirely on data structures, component logic, and the "what" of terminal rendering. It delegates the "how" (actual TTY writing, styling) to abstract Hexagonal Ports.

## V3.0.0 Evolution

As of v3.0.0, `@flyingrobots/bijou` has evolved from a string-based library into a high-performance **2D Cell-Buffered Graphics Engine**.

### Core Pillars
- **Buffered Surfaces:** Components no longer return strings; they paint into a 2D `Surface` grid of `Cell` objects. Supports masking, affine transforms (rotate/scale), and layer composition (`blit`).
- **Reactive Token Graph:** A DAG-based theming engine supporting aliases (`ref: 'semantic.primary'`), functional color math (`darken`, `mix`), and adaptive mode buckets (`light`/`dark`).
- **Differential Rendering:** Contains `renderDiff`, the mathematical engine that computes the minimal set of ANSI escape codes (CUP/SGR) needed to transition from `Frame A` to `Frame B`.
- **Pure Components:** Contains the robust library of layout algorithms (`Flex`), atomic elements (`badge`, `box`), and form primitives (`input`, `select`)—all rewritten to paint natively to `Surface` buffers.

## Install

```bash
npm install @flyingrobots/bijou @flyingrobots/bijou-node
```

## Quick Start

```typescript
import { initDefaultContext } from '@flyingrobots/bijou-node';
import { box, headerBox, gradientText, table } from '@flyingrobots/bijou';

// Initialize Node.js adapters (auto-detects TTY, CI, NO_COLOR)
initDefaultContext();

// Use components
console.log(headerBox('My CLI', { detail: 'v1.0.0' }));
console.log(box('Hello, world!'));
```

## Features Breakdown

- **Resilient rendering**: automatic mode switching for interactive, static, pipe, and accessible output.
- **Core UI primitives**: `box`, `headerBox`, `table`, `tree`, `accordion`, `tabs`, `breadcrumb`, `stepper`, `timeline`, `paginator`.
- **Graph tooling**: `dag`, `dagSlice`, and `dagStats` for visualizing and analyzing DAGs.
- **Interactive forms**: `input`, `select`, `multiselect`, `confirm`, `group`, `wizard`, `textarea`, and `filter`.
- **Theme system**: preset themes + DTCG-compatible custom token loading via `BIJOU_THEME`.
- **Test adapters**: deterministic test context and assertion helpers for mock-free component testing.

## Components

### Layout
`box()`, `headerBox()`, `separator()` — unicode box-drawing with automatic ASCII fallback.

### Elements
`badge()`, `alert()`, `kbd()`, `skeleton()` — status indicators and UI primitives.

### Data
`table()`, `tree()`, `accordion()`, `timeline()`, `dag()`, `dagSlice()`, `dagLayout()`, `dagStats()` — structured data display, DAG rendering with `DagSource` adapter, and graph statistics.

### Navigation
`tabs()`, `breadcrumb()`, `stepper()`, `paginator()` — wayfinding components.

### Animation & Progress
`spinner()`, `progressBar()`, `gradientText()` — live-updating output with color gradients.

### Forms
`input()`, `select()`, `multiselect()`, `confirm()`, `group()`, `wizard()` — interactive prompts with validation that degrade to numbered-list selection in pipe/CI modes.

### Theme Engine
DTCG (Design Tokens Community Group) interop. Built-in presets: `nord`, `catppuccin`, `cyan-magenta`. Load custom themes via `BIJOU_THEME` env var or `extendTheme()`.

## Architecture

bijou uses a Ports and Adapters (hexagonal) architecture. See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full design.

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
