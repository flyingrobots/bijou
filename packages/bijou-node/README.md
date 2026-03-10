# @flyingrobots/bijou-node

Node.js adapters for the Bijou terminal graphics engine.

This package bridges the pure, platform-agnostic `@flyingrobots/bijou` core with the Node.js runtime, handling TTY capabilities, raw I/O, chalk-based styling, and multi-threading.

## V3.0.0 Evolution

### 🌟 What's New
- **Background Worker Runtime:** The new `runInWorker()` and `startWorkerApp()` APIs allow you to run the TEA update loop in a Node.js `Worker` thread. This keeps the main thread 100% responsive for rendering and I/O, even during heavy synchronous workloads (like parsing large files or ASTs).
- **Environment Refresh Rate:** Automatically detects the environment's target refresh rate (or falls back to 60fps) to synchronize the TUI's unified animation heartbeat perfectly. Supports `BIJOU_FPS` override.
- **V3 Native I/O:** fully optimized for the new Double-Buffered differential rendering engine.

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

## Features Breakdown

- **Port implementation for Node.js**: complete `RuntimePort`, `IOPort`, and `StylePort` adapters for `@flyingrobots/bijou`.
- **Runtime detection**: environment variables, TTY state, and terminal dimensions sourced from `process`.
- **Interactive terminal I/O**: stdin/stdout integration with readline and resize-event support.
- **Styling backend**: Chalk-powered color/style methods wired into bijou styling APIs.
- **One-line bootstrap**: `initDefaultContext()` creates a production-ready context and registers it as default on first call.

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

// initDefaultContext() — first call registers as global default; later calls return fresh unregistered contexts
initDefaultContext();
```

If you need to replace the default context later in-process, call `setDefaultContext(createNodeContext())` from `@flyingrobots/bijou`.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for how the adapter maps to Node.js APIs, and [GUIDE.md](./GUIDE.md) for usage patterns.

## Related Packages

- [`@flyingrobots/bijou`](https://www.npmjs.com/package/@flyingrobots/bijou) — Zero-dependency core with all components and theme engine
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
