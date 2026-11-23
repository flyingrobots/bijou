# @flyingrobots/bijou-web

The browser host adapter for Bijou.

`@flyingrobots/bijou-web` implements Bijou's clock, runtime, style, and output
I/O ports for a browser window or worker, composes them into a
`BijouContext`, and mounts a TEA app on a `<canvas>` it owns. It has no
runtime dependencies, imports nothing from Node.js, and depends on
`@flyingrobots/bijou-tui` only as a peer.

This package is a workspace package. It is not published to npm yet.

## What it provides

| Export | Port | Role |
| :--- | :--- | :--- |
| `createWebClock()` | `ClockPort` | Wall-clock time, timers, microtasks, and frame scheduling. |
| `createWebRuntime()` | `RuntimePort` | An in-memory environment and a mutable output size. |
| `createWebStyle()` | `StylePort` | 24-bit ANSI SGR styling that honors `NO_COLOR`. |
| `createWebOutputIO()` | `IOPort` | Output to your sinks or to in-memory buffers. |
| `createWebInteractiveIO()` | `IOPort` | Output plus keyboard, IME, paste, pointer, wheel, and resize input. |
| `createWebContext()` | `BijouContext` | The four output-side ports composed through `createBijou()`. |
| `createWebInteractiveContext()` | `BijouContext` | The same, with `createWebInteractiveIO()` as the I/O port. |
| `mountBijouCanvas()` | — | Runs a TEA app on an owned `<canvas>` through injected presenters. |

`createWebContext()` only writes output.

## Mount on a canvas

`mountBijouCanvas()` adds a canvas and a hidden textarea to a container,
picks a presenter (`'auto'` tries `webgpu`, `webgl2`, then `canvas2d`, each
on a fresh canvas), and runs the app with frames drawn once per animation
frame. You inject the presenter factories, so the package depends on no GPU
library. The example is illustrative; `app`, `container`, the three factory
functions and `cellPxW`/`cellPxH` stand for your own values.

```ts
import { mountBijouCanvas } from '@flyingrobots/bijou-web';

const handle = await mountBijouCanvas(app, container, {
  createCanvas: () => document.createElement('canvas'),
  cellPx: { width: cellPxW, height: cellPxH },
  presenters: { webgpu: makeWebGpu, webgl2: makeWebGl2, canvas2d: makeCanvas2d },
});
console.log(handle.backend, handle.fallbackReasons);
await handle.switchBackend('canvas2d'); // keeps the model and input
await handle.stop(); // idempotent; removes everything it added
```

Only an unavailable backend falls back; a renderer fault rejects. The
[reference](../../docs/topics/bijou-web/README.md#mountbijoucanvasapp-container-options)
has the presenter interface and an example that wires Geordi's factories. The
mount has been tested with in-memory fakes, not in a real browser.

## Read input

`createWebInteractiveIO()` reads input from a hidden `<textarea>` and a
surface element that you pass in. The example is illustrative; `textarea` and
`canvasHost` are elements your page owns, and `handle` stands for your code.

```ts
import { createWebInteractiveIO, createWebRuntime } from '@flyingrobots/bijou-web';

const runtime = createWebRuntime({ columns: 100, rows: 30 });
const io = createWebInteractiveIO({
  textarea,
  surface: canvasHost,
  runtime,
  platform: navigator.userAgent.includes('Mac') ? 'mac' : 'other',
});

const keys = io.keyInput((key) => handle(key));
const mouse = io.mouseInput((msg) => handle(msg)); // 0-based col and row
keys.dispose();
mouse.dispose();
io.dispose(); // idempotent
```

IME composition arrives once as committed text. Single-line paste arrives as
text; multi-line paste is rejected rather than turned into Enter keys. Browser
shortcuts such as reload and DevTools pass through. `cellFromPoint()` and
`mouseInput()` use 0-based cells; only the SGR packets on `rawInput()` are
1-based. The adapter has been tested against in-memory event targets, not in a
real browser. The [reference](../../docs/topics/bijou-web/README.md) has the
full contract.

## Create a context

The example is illustrative. `append` stands for whatever your page does with
text.

```ts
import { alert } from '@flyingrobots/bijou';
import { createWebContext } from '@flyingrobots/bijou-web';

const ctx = createWebContext({
  mode: 'static',
  runtime: { columns: 100, rows: 30, env: { NO_COLOR: '1' } },
  output: { write: (text) => append(text) },
});

ctx.io.write(alert('Deploy complete', { variant: 'success', ctx }));
```

Without `output` sinks, text is kept in memory. Read it with
`ctx.io.output()` and `ctx.io.errorOutput()`, and empty it with
`ctx.io.clear()`. Each buffer retains the most recent 1,048,576 characters
unless you set `bufferLimit` on `createWebOutputIO()`.

## Output modes

Pass `mode` to choose one of `interactive`, `static`, `pipe`, or `accessible`.
Without `mode`, the context detects it from the runtime in the same order as
every other Bijou host: `BIJOU_ACCESSIBLE=1`, `TERM=dumb`, `stdoutIsTTY`, then
`CI`.

Components lower gracefully in every mode. In `static`, `pipe`, and
`accessible` modes the lowered text reaches the output sink as plain strings.

## Runtime

A browser has no environment variables and no terminal, so you own both.

- `env` is an in-memory map. Change it with `runtime.setEnv(key, value)`.
- `columns` and `rows` are mutable. Zero and negative values clamp to `1`;
  a value that is not finite uses the default of `80` or `24`.
- `runtime.resize(columns, rows)` sets both and notifies `io.onResize()`
  listeners once.
- `refreshRate` defaults to `60`. `stdoutIsTTY` defaults to `true` and
  `stdinIsTTY` to `false`.

## Clock

`createWebClock()` uses the host globals, and works where `window` is
undefined. Pass `host` to inject any of `now`, `monotonicNow`, `setTimeout`,
`setInterval`, `queueMicrotask`, and `requestFrame`. Each scheduler returns its
own cancel function.

`clock.requestFrame(callback)` uses `requestAnimationFrame` when the host has
it, and a timer of `frameIntervalMs` (default 16 ms) when it does not.
`clock.pendingHandles()` counts the timeouts, intervals, and frames that are
still scheduled.

## Style

`createWebStyle()` writes 24-bit SGR sequences for `styled`, `rgb`, `hex`,
`bgRgb`, `bgHex`, and `bold`. An invalid hex color leaves the text unstyled.
Pass `runtime` to read `NO_COLOR` on every call, or `noColor` to decide
explicitly.

## Unsupported capabilities

A browser has no filesystem, and this package attaches no input. These calls
refuse with a `WebUnsupportedCapabilityError` instead of returning an empty
value:

| Call | `capability` |
| :--- | :--- |
| `io.readFile(path)` | `FilePort.readFile` |
| `io.readDir(path)` | `FilePort.readDir` |
| `io.question(prompt)` (rejects) | `QueryPort.question` |
| `io.rawInput(onKey)` | `InteractivePort.rawInput` |

Every such error has `code` equal to `BIJOU_WEB_UNSUPPORTED_CAPABILITY`.

`io.joinPath()` is supported: it joins segments with `/` and keeps a URL
scheme intact. `io.onResize()` follows the context runtime. On a port made
directly with `createWebOutputIO()` and no `resize` source, its callbacks
never run.

When `BIJOU_THEME` names a `.json` file, `createBijou()` cannot read it in a
browser and uses the fallback theme. Pass `theme` or `presets` instead.

## License

Apache-2.0
