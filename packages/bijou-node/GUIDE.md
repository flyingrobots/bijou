# Guide — @flyingrobots/bijou-node

This guide covers the common Node bootstrap path and the bridge between the pure Bijou core and the terminal process.

For explicit context ownership, worker runtime flows, recorder/capture work, and deeper runtime-boundary concerns, use [ADVANCED_GUIDE.md](./ADVANCED_GUIDE.md).

## Basic Setup

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
  view: (model) => stringToSurface(`Count: ${model.count}\nPress q to quit`, 16, 2),
};

await startApp(app);
```

`startApp()` detects:
- **TTY** → interactive mode (full colors, Unicode).
- **`CI=true`** → static mode (single-frame, no animations).
- **Piped stdout / `TERM=dumb`** → pipe mode (plain text).
- **`NO_COLOR`** → disables all color output.
- **`BIJOU_ACCESSIBLE=1`** → accessible mode (screen-reader friendly).

It also registers the default context automatically so lower-level helpers that
rely on ambient `ctx` resolution still work in the common path.

Importing `@flyingrobots/bijou-node` also registers a lazy Node default-context
initializer. That means low-level `run(app)` flows can still resolve ambient
`ctx` on first use, but `startApp()` remains the preferred first-app entrypoint
because it makes host ownership explicit in the call site.

## Custom Context

If you need more control, create the context without setting the global default:

```typescript
import { createNodeContext } from '@flyingrobots/bijou-node';
import { box } from '@flyingrobots/bijou';

const ctx = createNodeContext();

// Pass explicitly to components
console.log(box('hello', { ctx }));
```

## Individual Adapters

For advanced use cases, construct adapters individually:

```typescript
import { nodeRuntime, nodeIO, chalkStyle } from '@flyingrobots/bijou-node';

const runtime = nodeRuntime();
const io = nodeIO();
const style = chalkStyle({ noColor: false });

// Use runtime for environment checks
if (runtime.stdoutIsTTY) {
  io.write('Interactive terminal detected\n');
}

// Use style for coloring
io.write(style.hex('#ff6600', 'Orange text\n'));
```

## Scoped File Access

Use `scopedNodeIO()` when app-level file reads should stay inside one rooted project
directory instead of inheriting unrestricted host filesystem access.

```typescript
import { scopedNodeIO } from '@flyingrobots/bijou-node';

const io = scopedNodeIO({ root: process.cwd() });

const themeJson = io.readFile('themes/app.json');
const capturePath = io.resolvePath('captures/demo.gif');
```

`readFile()`, `readDir()`, and `joinPath()` reject any path that escapes the declared
root. `resolvePath()` is the companion escape hatch for host-owned writes that still need
the same boundary before calling `fs.writeFileSync()` or similar Node APIs.

## Worker Runtime

If your app's `update()` logic is heavy (e.g., complex graph calculations), you can offload the TEA loop to a worker thread while keeping the main thread dedicated to rendering and I/O.

```typescript
import { runInWorker } from '@flyingrobots/bijou-node';

runInWorker({
  workerPath: './my-app-worker.js',
  options: { mouse: true },
});
```

## Recorder

`bijou-node` can capture every frame of a `Surface` and rasterize them to a GIF. This is perfect for documentation or CI visual regression.

```typescript
import { recordDemoGif } from '@flyingrobots/bijou-node';

await recordDemoGif({
  outputPath: 'demo.gif',
  render: (frame) => renderMyApp(frame),
  frames: 120,
  fps: 30,
});
```

## Environment Variables

| Variable | Effect |
| :--- | :--- |
| `NO_COLOR` | Disables all color output. |
| `FORCE_COLOR` | Forces color even in non-TTY environments. |
| `CI` | Switches to static output mode. |
| `TERM=dumb` | Switches to pipe output mode. |
| `BIJOU_ACCESSIBLE=1` | Enables accessible output mode. |
| `BIJOU_THEME=./path.json` | Loads a custom DTCG theme file. |
| `BIJOU_FPS=60` | Overrides the detected terminal refresh rate. |

---
**The Node package bridges the pure TypeScript foundation to the physical terminal and the host OS.**
