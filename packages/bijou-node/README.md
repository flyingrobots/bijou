# @flyingrobots/bijou-node

Node.js adapter for bijou — chalk styling, readline I/O, process runtime.

## What's New in 0.6.0?

- **`nodeIO().readDir()` directory classification** — entries now include a trailing `/` for directories, enabling `filePicker()` to correctly distinguish directories from files

See the [CHANGELOG](https://github.com/flyingrobots/bijou/blob/main/docs/CHANGELOG.md) for the full release history.

## Install

```bash
npm install @flyingrobots/bijou @flyingrobots/bijou-node
```

## Usage

```typescript
import { initDefaultContext } from '@flyingrobots/bijou-node';
import { box, headerBox } from '@flyingrobots/bijou';

// Wire up Node.js adapters and set the default context.
// Auto-detects TTY, CI, NO_COLOR, and TERM=dumb.
initDefaultContext();

console.log(headerBox('My CLI', { detail: 'v1.0.0' }));
```

## What It Provides

`bijou-node` implements the three ports that `@flyingrobots/bijou` requires:

| Port | Implementation | What it does |
| :--- | :--- | :--- |
| `RuntimePort` | `nodeRuntime()` | `process.env`, TTY detection, terminal dimensions |
| `IOPort` | `nodeIO()` | `process.stdout/stdin`, readline, resize events |
| `StylePort` | `chalkStyle()` | RGB/hex color via chalk, respects `NO_COLOR` |

### API

```typescript
// Individual port factories
import { nodeRuntime, nodeIO, chalkStyle } from '@flyingrobots/bijou-node';

// All-in-one context (most common)
import { createNodeContext, initDefaultContext } from '@flyingrobots/bijou-node';

// createNodeContext() — returns a BijouContext without setting it as default
const ctx = createNodeContext();

// initDefaultContext() — creates context AND registers it as the global default
initDefaultContext();
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for how the adapter maps to Node.js APIs, and [GUIDE.md](./GUIDE.md) for usage patterns.

## Related Packages

- [`@flyingrobots/bijou`](https://www.npmjs.com/package/@flyingrobots/bijou) — Zero-dependency core with all components and theme engine
- [`@flyingrobots/bijou-tui`](https://www.npmjs.com/package/@flyingrobots/bijou-tui) — TEA runtime for interactive terminal apps

## License

MIT
