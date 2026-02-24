# bijou

Themed terminal components for CLIs, loggers, and scripts — graceful degradation included.

## What is this?

bijou is a hexagonal-architecture toolkit for building beautiful terminal output. The core package (`@flyingrobots/bijou`) is **zero-dependency** pure TypeScript. Adapter packages like `@flyingrobots/bijou-node` wire it up to real runtimes.

**Key ideas:**

- Theme engine with DTCG interop and named presets (`BIJOU_THEME=teal-orange-pink`)
- Components: boxes, tables, spinners, progress bars, gradient text, ASCII logos
- Interactive forms: input, select, multiselect, confirm, group
- Graceful degradation: piped output strips decorations, `NO_COLOR` is respected
- Port-based architecture: swap runtime, I/O, and styling without touching core logic

## Install

```bash
npm install @flyingrobots/bijou @flyingrobots/bijou-node
```

## Quick start

```typescript
import { initDefaultContext } from '@flyingrobots/bijou-node';
import { box, headerBox, progressBar, gradientText } from '@flyingrobots/bijou';

// Initialize Node.js adapters (call once at startup)
initDefaultContext();

// Gradient text
console.log(gradientText('Hello from bijou!'));

// Boxes
console.log(box('Simple bordered box'));
console.log(headerBox('Deploy', { detail: 'v1.2.3 → production' }));

// Progress bar
console.log(progressBar(0.75));
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
| `RuntimePort` | env vars, exit, columns | `nodeRuntime()` |
| `IOPort` | stdin/stdout, raw input | `nodeIO()` |
| `StylePort` | text styling (bold, hex colors) | `chalkStyle()` |

### Output modes

bijou detects the output environment and adapts:

| Mode | When | Behavior |
|------|------|----------|
| `rich` | Interactive TTY | Full colors, unicode boxes, animations |
| `pipe` | Piped / redirected | Plain text, no decorations |
| `accessible` | `TERM_PROGRAM=accessibility` | Simplified formatting |

`NO_COLOR` (per [no-color.org](https://no-color.org)) disables all color output.

## Testing

```bash
npm test              # Run all tests
npm run lint          # Type-check both packages
```

Tests use `createTestContext()` from `@flyingrobots/bijou/adapters/test` with explicit mode and mock ports — no process globals mocked.

## Compatibility

- **Node.js** >= 18 (with `@flyingrobots/bijou-node`)
- **Bun** — works via Node compat (same packages)
- **Deno** — works via `npm:` specifiers

The core `@flyingrobots/bijou` package is runtime-agnostic. Write your own adapter by implementing `RuntimePort`, `IOPort`, and `StylePort`.

## License

MIT — see [LICENSE](./LICENSE).
