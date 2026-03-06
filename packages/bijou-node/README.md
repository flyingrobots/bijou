# @flyingrobots/bijou-node

Node.js adapter for bijou — chalk styling, readline I/O, process runtime.

## Documentation Status

This npm README is a quick overview and may lag behind the repository.

- Canonical API details and behavior notes live in [`GUIDE.md`](./GUIDE.md)
- Release-level changes live in the [CHANGELOG](https://github.com/flyingrobots/bijou/blob/main/docs/CHANGELOG.md)

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
