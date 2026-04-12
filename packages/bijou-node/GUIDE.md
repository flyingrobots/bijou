# Guide — @flyingrobots/bijou-node

This guide covers the common Node bootstrap path and the bridge between the pure Bijou core and the terminal process.

For explicit context ownership, worker runtime flows, recorder/capture work, and deeper runtime-boundary concerns, use [ADVANCED_GUIDE.md](./ADVANCED_GUIDE.md).

## Basic Setup

```typescript
import { initDefaultContext } from '@flyingrobots/bijou-node';

// One line — auto-detects everything
initDefaultContext();
```

This detects:
- **TTY** → interactive mode (full colors, Unicode).
- **`CI=true`** → static mode (single-frame, no animations).
- **Piped stdout / `TERM=dumb`** → pipe mode (plain text).
- **`NO_COLOR`** → disables all color output.
- **`BIJOU_ACCESSIBLE=1`** → accessible mode (screen-reader friendly).

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

## Worker Runtime

If your app's `update()` logic is heavy (e.g., complex graph calculations), you can offload the TEA loop to a worker thread while keeping the main thread dedicated to rendering and I/O.

```typescript
import { runInWorker } from '@flyingrobots/bijou-node';

runInWorker({
  entry: './my-app-worker.js',
  mouse: true,
});
```

## Recorder

`bijou-node` can capture every frame of a `Surface` and rasterize them to a GIF. This is perfect for documentation or CI visual regression.

```typescript
import { recordDemoGif } from '@flyingrobots/bijou-node';
import { stringToSurface } from '@flyingrobots/bijou';
import { type App } from '@flyingrobots/bijou-tui';

type Model = { count: number };
type Msg = { type: 'increment' } | { type: 'quit' };

const app: App<Model, Msg> = {
  init: () => [{ count: 0 }, []],
  update: (msg, model) => [model, []],
  view: (model) => stringToSurface(`Count: ${model.count}`, 8, 1),
};

const result = await recordDemoGif<Model, Msg>({
  name: 'counter-demo',
  app,
  outputPath: 'demo.gif',
  steps: [{ kind: 'wait', ms: 300 }],
  frameDelayMs: 33,
});

console.log(result.outputPath, result.frames);
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
