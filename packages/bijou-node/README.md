# @flyingrobots/bijou-node

Node.js adapters and runtime utilities for Bijou.

This package bridges the pure `@flyingrobots/bijou` core and the `@flyingrobots/bijou-tui` runtime to the Node.js environment. It owns runtime detection, terminal I/O, Chalk-backed styling, worker-thread helpers, and the native V3 demo recorder.

## What's New in v3.0.0

- **Worker runtime support** — `runInWorker()` and `startWorkerApp()` let TEA apps move heavy update work off the main thread while keeping input and rendering responsive.
- **Native demo recorder** — V3 flagship demos can now be recorded directly from captured `Surface[]` frames with `recordDemoGif()`.
- **Node boundary stays explicit** — runtime facts, I/O, and styling remain behind the port interfaces instead of leaking `process`, `readline`, or Chalk into the pure packages.

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
- **Worker helpers**: `runInWorker()` and `startWorkerApp()` for moving app logic into a worker thread.
- **Native recorder**: `recordDemoGif()` and related helpers for scripted V3 demo capture.

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
For upgrading existing apps, see [`../../docs/MIGRATING_TO_V4.md`](../../docs/MIGRATING_TO_V4.md).

## Related Packages

- [`@flyingrobots/bijou`](https://www.npmjs.com/package/@flyingrobots/bijou) — Zero-dependency core with all components and theme engine
- [`@flyingrobots/bijou-tui`](https://www.npmjs.com/package/@flyingrobots/bijou-tui) — TEA runtime for interactive terminal apps

## License

Apache-2.0

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
