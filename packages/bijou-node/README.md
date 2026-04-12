# @flyingrobots/bijou-node

Node.js adapters and runtime utilities for Bijou.

`@flyingrobots/bijou-node` bridges the pure core and the TUI runtime to the Node.js environment. It owns platform detection, terminal I/O, Chalk-backed styling, and worker-thread helpers.

## Role

- **Port Implementation**: Maps Node.js APIs to the Bijou port interfaces.
- **Worker Runtime**: Offloads heavy TEA logic to worker threads while maintaining main-thread responsiveness.
- **Bootstrapping**: One-call hosted app startup with `startApp()`.

## Install

```bash
npm install @flyingrobots/bijou @flyingrobots/bijou-node
```

## Quick Start

```typescript
import { stringToSurface } from '@flyingrobots/bijou';
import { startApp } from '@flyingrobots/bijou-node';
import { isKeyMsg, quit, type App } from '@flyingrobots/bijou-tui';

const app: App<{ count: number }> = {
  init: () => [{ count: 0 }, []],
  update: (msg, model) => {
    if (isKeyMsg(msg) && msg.key === 'q') return [model, [quit()]];
    return [model, []];
  },
  view: (model) => stringToSurface(`Count: ${model.count}\\nPress q to quit`, 16, 2),
};

await startApp(app);
```

## Port Mapping

| Port | Node.js Implementation | Responsibility |
| :--- | :--- | :--- |
| **`RuntimePort`** | `nodeRuntime()` | `process.env`, TTY detection, dimensions |
| **`IOPort`** | `nodeIO()` | `stdout`/`stdin`, readline, resize events |
| **`StylePort`** | `chalkStyle()` | RGB/hex styling, `NO_COLOR` support |

## API

- **`createNodeContext()`**: Returns a wired `BijouContext` without setting it as the global default.
- **`initDefaultContext()`**: Registers the first context as the global default for all Bijou components.
- **`startApp()`**: Initializes a default Node context when needed and runs a TUI app through the hosted runtime.
- **`scopedNodeIO()`**: Wraps the Node file adapter in a rooted filesystem boundary for app-level reads and guarded path resolution.
- **`runInWorker()`**: Starts a TEA app inside a worker thread.
- **`recordDemoGif()`**: Captures surface frames and rasterizes them to GIF for documentation.

## Scoped File Access

Prefer `scopedNodeIO()` over raw `nodeIO()` when the app should only read assets from
one project directory.

```typescript
import { scopedNodeIO } from '@flyingrobots/bijou-node';

const io = scopedNodeIO({ root: process.cwd() });

const theme = io.readFile('themes/app.json');
const outputPath = io.resolvePath('captures/demo.gif');
```

`readFile()`, `readDir()`, and `joinPath()` now stay inside the declared root. `resolvePath()`
gives hosts the same boundary check before they hand a path to raw Node writes such as
`fs.writeFileSync()`.

## Documentation

- **[GUIDE.md](./GUIDE.md)**: Productive-fast path for Node setups.
- **[ADVANCED_GUIDE.md](./ADVANCED_GUIDE.md)**: Worker thread and recorder internals.

---
Built with 💎 by [FLYING ROBOTS](https://github.com/flyingrobots)
