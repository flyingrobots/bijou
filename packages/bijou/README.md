# @flyingrobots/bijou

Themed terminal components for CLIs, loggers, and scripts — graceful degradation included.

**Zero dependencies. Hexagonal architecture. Works everywhere.**

## What's New in 0.2.0?

- **`IOPort.onResize()`** — new port method for terminal resize events, enabling TUI apps to reflow layout when the terminal is resized

See the [CHANGELOG](https://github.com/flyingrobots/bijou/blob/main/docs/CHANGELOG.md) for the full release history.

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

## Components

### Layout
`box()`, `headerBox()`, `separator()` — unicode box-drawing with automatic ASCII fallback.

### Elements
`badge()`, `alert()`, `kbd()`, `skeleton()` — status indicators and UI primitives.

### Data
`table()`, `tree()`, `accordion()`, `timeline()` — structured data display.

### Navigation
`tabs()`, `breadcrumb()`, `stepper()`, `paginator()` — wayfinding components.

### Animation & Progress
`spinner()`, `progressBar()`, `gradientText()` — live-updating output with color gradients.

### Forms
`input()`, `select()`, `multiselect()`, `confirm()`, `group()` — interactive prompts with validation that degrade to numbered-list selection in pipe/CI modes.

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
