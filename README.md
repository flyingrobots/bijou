# bijou

Themed terminal components for CLIs, loggers, and scripts — graceful degradation included.

## What is this?

bijou is a hexagonal-architecture toolkit for building beautiful terminal output. The core package (`@flyingrobots/bijou`) is **zero-dependency** pure TypeScript. Adapter packages like `@flyingrobots/bijou-node` wire it up to real runtimes.

**Key ideas:**

- Theme engine with DTCG interop and named presets (`BIJOU_THEME=cyan-magenta`)
- Components: boxes, tables, spinners, progress bars, gradient text, ASCII logos
- Interactive forms: input, select, multiselect, confirm, group
- Graceful degradation: four output modes adapt to TTY, CI, piped, and accessible environments
- Port-based architecture: swap runtime, I/O, and styling without touching core logic

## Install

```bash
npm install @flyingrobots/bijou @flyingrobots/bijou-node
```

## Quick start

```typescript
import { initDefaultContext } from '@flyingrobots/bijou-node';
import {
  box, headerBox, progressBar, gradientText,
} from '@flyingrobots/bijou';

// Initialize Node.js adapters (call once at startup)
const ctx = initDefaultContext();

// Gradient text (requires stops and a StylePort)
const stops = [
  { pos: 0, color: [0, 200, 255] as [number, number, number] },
  { pos: 1, color: [255, 0, 128] as [number, number, number] },
];
console.log(gradientText('Hello from bijou!', stops, { style: ctx.style }));

// Boxes
console.log(box('Simple bordered box'));
console.log(headerBox('Deploy', { detail: 'v1.2.3 → production' }));

// Progress bar (0–100 scale)
console.log(progressBar(75));
```

## Architecture

```
packages/
├── bijou/           Zero-dep core (theme, components, forms, detection)
│   └── src/
│       ├── ports/       Port interfaces (RuntimePort, IOPort, StylePort)
│       ├── adapters/    Test adapters (mockRuntime, mockIO, plainStyle)
│       ├── core/        Theme engine, components, forms, TTY detection
│       ├── factory.ts   createBijou() context builder
│       └── context.ts   Global default context
│
└── bijou-node/      Node.js adapter (chalk, readline, process)
```

All components accept an optional `ctx: BijouContext` parameter. If omitted, they use the global default context set by `initDefaultContext()`.

### Ports

| Port | Purpose | Node adapter |
|------|---------|-------------|
| `RuntimePort` | env vars, TTY flags, columns/rows | `nodeRuntime()` |
| `IOPort` | write, question, raw input, file I/O | `nodeIO()` |
| `StylePort` | text styling (bold, rgb, hex, tokens) | `chalkStyle()` |

### Output modes

bijou detects the output environment and adapts:

| Mode | When | Behavior |
|------|------|----------|
| `interactive` | stdout is a TTY | Full colors, unicode boxes, animations |
| `static` | `CI` env var is set | Single-frame rendering, no animations |
| `pipe` | Piped/redirected, `TERM=dumb`, or `NO_COLOR` | Plain text, no decorations |
| `accessible` | `BIJOU_ACCESSIBLE=1` | Screen-reader-friendly plain prompts |

Detection order (first match wins): `BIJOU_ACCESSIBLE=1` → accessible, `NO_COLOR` → pipe, `TERM=dumb` → pipe, non-TTY → pipe, `CI` → static, TTY → interactive.

### Environment variables

| Variable | Effect |
|----------|--------|
| `BIJOU_THEME` | Select a theme preset (e.g. `cyan-magenta`) |
| `NO_COLOR` | Disable all color output ([no-color.org](https://no-color.org)) |
| `CI` | Force `static` output mode |
| `TERM` | Set to `dumb` to force `pipe` output mode |
| `BIJOU_ACCESSIBLE` | Set to `1` for screen-reader-friendly output |

### Context helpers

`initDefaultContext()` creates a Node.js context and registers it as the global default (on first call). Components that omit `ctx` will use this default.

`createNodeContext()` creates a fresh Node.js context each time without setting the global default — useful when you need multiple isolated contexts.

## Testing

```bash
npm test              # Run all tests
npm run lint          # Type-check both packages
```

Tests use `createTestContext()` from `@flyingrobots/bijou/adapters/test` with explicit mode and mock ports — no process globals mocked.

```typescript
import { createTestContext } from '@flyingrobots/bijou/adapters/test';

const ctx = createTestContext({ mode: 'interactive' });
```

## Compatibility

- **Node.js** >= 18 (with `@flyingrobots/bijou-node`)
- **Bun** — works via Node compat (same packages)
- **Deno** — works via `npm:` specifiers

The core `@flyingrobots/bijou` package is runtime-agnostic. Write your own adapter by implementing `RuntimePort`, `IOPort`, and `StylePort`.

## License

MIT — see [LICENSE](./LICENSE).
