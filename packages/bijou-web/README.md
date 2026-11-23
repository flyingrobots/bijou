# @flyingrobots/bijou-web

The browser host adapter for Bijou.

`@flyingrobots/bijou-web` implements Bijou's clock, runtime, style, and output
I/O ports for a browser window or worker, and composes them into a
`BijouContext`. It has no runtime dependencies and imports nothing from
Node.js.

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
| `mountBijouDom()` | DOM host | Runs a semantic scene app as native DOM elements. |

`createWebContext()` only writes output. The package mounts no canvas;
`mountBijouDom()` renders a semantic scene app into the DOM.

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

## Mount an app in the DOM

`mountBijouDom(app, container, options?)` runs a `SemanticSceneApp` from
`@flyingrobots/bijou-tui` in a container element. It lowers each scene with
`lowerUiSceneToBrowser()` and patches it in place, keyed by
`data-bijou-node-id`, so an `<input>` keeps its element, value, and selection
across re-renders. Clicks, keys, text input, and IME composition become action
requests. Theme tokens are custom properties on the mount root, such as
`--bijou-semantic-primary`.

The example is illustrative. `app` stands for any `SemanticSceneApp`.

```ts
import { mountBijouDom } from '@flyingrobots/bijou-web';

const handle = mountBijouDom(app, document.getElementById('app')!, {
  direction: (model) => model.direction,
});

// Later:
handle.stop();
```

The package needs `@flyingrobots/bijou-tui` as a peer for this function. The
seam lowers `group` and `text` nodes only. The tests run against an in-memory
document, not a browser; real focus, selection, and IME behavior is not
verified yet. Read the [DOM host reference](../../docs/topics/bijou-web-dom/README.md)
for the element mapping, events, focus fallback, and limits.

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
