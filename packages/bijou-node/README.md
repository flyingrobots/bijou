# @flyingrobots/bijou-node

Node.js adapters and runtime utilities for Bijou.

`@flyingrobots/bijou-node` bridges the pure core and the TUI runtime to the Node.js environment. It owns platform detection, terminal I/O, Chalk-backed styling, and worker-thread helpers.

## Role

- **Port Implementation**: Maps Node.js APIs to the Bijou port interfaces.
- **Worker Runtime**: Offloads heavy TEA logic to worker threads while maintaining main-thread responsiveness.
- **Bootstrapping**: One-line context initialization with `initDefaultContext()`.

## Install

```bash
npm install @flyingrobots/bijou @flyingrobots/bijou-node
```

## Quick Start

```typescript
import { initDefaultContext } from '@flyingrobots/bijou-node';
import { headerBox } from '@flyingrobots/bijou';

initDefaultContext();

console.log(headerBox('My CLI', { detail: 'v1.0.0' }));
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
