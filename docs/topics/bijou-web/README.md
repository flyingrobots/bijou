# Browser host adapter: `@flyingrobots/bijou-web`

This page is the reference for the port contracts of
`@flyingrobots/bijou-web`. The package implements Bijou's clock, runtime,
style, and output I/O ports for a browser window or worker.

For installation status and a usage example, read the
[package README](../../../packages/bijou-web/README.md). The cases that hold
this behavior are listed in the [test plan](./test-plan.md).

## Boundaries

The package has no runtime dependencies. Its sources import nothing from
Node.js and do not name `process` or `Buffer`; it compiles with
`"types": []`, so those names do not typecheck.

`createWebContext()` only writes output. `createWebInteractiveIO()` reads
keyboard, IME, paste, pointer, wheel, and resize input from elements you pass
in, and `createWebInteractiveContext()` composes a context around it.
`mountBijouCanvas()` runs a TEA app on a `<canvas>` it owns inside a container
element; presenters are injected, and the package depends on no GPU library.

`mountBijouDom()` runs a semantic scene app as native DOM elements. Its
reference is [DOM host](../bijou-web-dom/README.md).

## `createWebClock(options?)`

| Member | Contract |
| --- | --- |
| `now()`, `date(ms?)` | Wall-clock time from the host. `date()` without an argument uses `now()`. |
| `monotonicNow()` | Monotonic milliseconds from the host. |
| `setTimeout(callback, ms)` | Runs the callback once. `dispose()` cancels a pending timeout and is safe to repeat. |
| `setInterval(callback, ms)` | Runs the callback until `dispose()`. |
| `queueMicrotask(callback)` | Queues the callback on the host. |
| `requestFrame(callback)` | Uses the host frame hook when there is one, and a timer of `frameIntervalMs` (default 16) otherwise. |
| `pendingHandles()` | Counts timeouts, intervals, and frames that are scheduled and neither finished nor disposed. |

A delay that is negative or not finite is zero. `options.host` replaces any of
the host functions; an absent member uses the global, and
`requestFrame: undefined` turns the frame hook off. The global host works
where `window` is undefined.

## `createWebRuntime(options?)`

| Member | Contract |
| --- | --- |
| `env(key)`, `setEnv(key, value)` | An in-memory map. The initial `env` object is copied. `undefined` removes a key. |
| `columns`, `rows` | Mutable. Each value is floored and is at least `1`. A value that is not finite uses `80` or `24`. |
| `resize(columns, rows)` | Sets both dimensions and notifies listeners once, only when the size changes. |
| `onResize(callback)` | Registers a listener. `dispose()` removes it. |
| `refreshRate` | Mutable. A value that is not a positive finite number is `60`. |
| `stdoutIsTTY`, `stdinIsTTY` | Mutable flags. Defaults: `true` and `false`. |

## `createWebStyle(options?)`

The style port writes 24-bit ANSI SGR sequences and uses no library.

| Method | Opens with | Closes with |
| --- | --- | --- |
| `rgb`, `hex` | `ESC[38;2;R;G;Bm` | `ESC[39m` |
| `bgRgb`, `bgHex` | `ESC[48;2;R;G;Bm` | `ESC[49m` |
| `bold` | `ESC[1m` | `ESC[22m` |

`styled(token, text)` applies the token's modifiers innermost, then its
foreground, then its background. Channels are rounded and held to 0 through
255. A hex color is `rgb` or `rrggbb` with an optional `#`; any other text
leaves the output unstyled. A style is opened again after a nested style
closes, and is closed and reopened around each line break.

With `options.noColor` set to `true`, or with `NO_COLOR` defined in
`options.runtime`, every method returns its text unchanged. The runtime is
read on every call. An explicit `noColor` takes precedence over the runtime.

## `createWebOutputIO(options?)`

| Member | Contract |
| --- | --- |
| `write(data)`, `writeError(data)` | Go to the `write` and `writeError` sinks. A stream without a sink is kept in an in-memory buffer. |
| `writeBytes(buf, len)` | Reads only the first `len` bytes. `len` is floored and held to 0 through `buf.length`. Goes to the `writeBytes` sink, or is decoded as streaming UTF-8 and written as text. |
| `output()`, `errorOutput()`, `clear()` | Read and empty the in-memory buffers. Each buffer keeps the most recent `bufferLimit` characters (default 1,048,576). |
| `setInterval(callback, ms)` | Runs on `options.clock`, or on a `createWebClock()` clock. |
| `joinPath(...segments)` | Joins the non-empty segments with one `/`. A URL scheme stays intact. |
| `onResize(callback)` | Follows `options.resize`. Without a resize source the callback never runs. |

These calls refuse with a `WebUnsupportedCapabilityError`. Its `code` is
`BIJOU_WEB_UNSUPPORTED_CAPABILITY` and its `capability` names the call.

| Call | `capability` | Form |
| --- | --- | --- |
| `readFile(path)` | `FilePort.readFile` | Throws |
| `readDir(path)` | `FilePort.readDir` | Throws |
| `rawInput(onKey)` | `InteractivePort.rawInput` | Throws |
| `question(prompt)` | `QueryPort.question` | Returns a rejected promise |

## `createWebContext(options?)`

`createWebContext()` composes the four ports through `createBijou()`. The
runtime's `NO_COLOR` controls both the resolved theme and the style port, and
runtime resizes reach `io.onResize()` listeners.

`options.mode` sets the output mode. Without it, the mode is detected from the
runtime: `BIJOU_ACCESSIBLE=1` gives `accessible`, `TERM=dumb` or a false
`stdoutIsTTY` gives `pipe`, a defined `CI` gives `static`, and anything else
gives `interactive`.

When `BIJOU_THEME` names a `.json` file, `createBijou()` cannot read it on
this host and uses the fallback theme.

## `createWebInteractiveContext(options?)`

Composes the same ports as `createWebContext()`, with `createWebInteractiveIO()`
as the I/O port. `options.input` takes the input elements and policies
(`textarea`, `surface`, `platform`, `passThrough`, `onPasteRejected`); the
runtime, clock, resize source and output sinks come from the context options,
so `io.cellFromPoint()` and pointer hit-testing follow `ctx.runtime`'s size and
runtime resizes reach `io.onResize()`.

The TUI runtime reads keys and mouse input from `io.rawInput()` only. A key
reaches the app once, as its terminal encoding, and a pointer event as an SGR
packet; nothing subscribes to `keyInput()` or `mouseInput()` on the app's
behalf, so there is no double delivery. The raw stream drops the modifiers of
modified navigation keys (see [Raw encoding](#raw-encoding)).

## `createWebInteractiveIO(options?)`

Returns a `createWebOutputIO()` port that also reads browser input, through
narrow structural interfaces (`WebTextareaLike`, `WebPointerSurface`) that a
DOM `<textarea>` and element satisfy. It needs no DOM library and no `jsdom`.
`rawInput()` works on this port; the output-only port still refuses it.

| Option | Contract |
| --- | --- |
| `textarea` | The hidden `<textarea>` that receives keys, IME composition, and paste. Without it, no key is read. |
| `surface` | The element whose cells pointer and wheel events address. Without it, no pointer is read. |
| `runtime` | Supplies `columns` and `rows` for hit-testing, read on every event. Defaults to 80 by 24. |
| `platform` | `'mac'` or `'other'` (default) selects the pass-through policy. |
| `passThrough` | Replaces the policy. It receives `{ key, ctrl, alt, shift, meta }` and returns `true` to leave the chord to the browser. |
| `onPasteRejected` | Receives the original text of a rejected multi-line paste. |
| `resize`, plus every output option | As in `createWebOutputIO()`. |

| Member | Contract |
| --- | --- |
| `keyInput(onKey)` | Structured `KeyInputMsg` values. |
| `mouseInput(onMouse)` | `WebMouseMsg` values, shaped like the terminal host's `MouseMsg`, with 0-based `col` and `row`. |
| `rawInput(onKey)` | The terminal byte encoding of the same keys and text, and SGR mouse packets. |
| `cellFromPoint(clientX, clientY)` | The 0-based `{ col, row }` under a client point, clamped to `[0, columns - 1]` and `[0, rows - 1]`. A non-finite point or a surface with no area gives 0. |
| `onResize(callback)` | Follows `options.resize`. The handle is idempotent. |
| `dispose()` | Removes every listener, ends every stream, and disposes every resize handle. Safe to repeat. |

Every handle's `dispose()` is idempotent and stops delivery at once.
Listeners attach to `textarea` and `surface` when the first stream is
subscribed, and detach when the last is disposed. A subscription made after
`dispose()` is inert.

### Keys

`keydown` maps to the key names the terminal host uses: `up`, `down`, `left`,
`right`, `enter`, `escape`, `tab`, `backspace`, `delete`, `insert`, `home`,
`end`, `pageup`, `pagedown`, `space`, `f1` through `f12`, and lowercase
letters. An uppercase ASCII letter is the lowercase name with `shift`, and
`shift` is also set by Shift+Tab. `alt` means Alt or Meta. A printable key
carries `text` and prevents the default. Modifier-only, dead, and unidentified
keys deliver nothing and are not prevented. Keys that arrive while a
composition is open, or with `isComposing`, are ignored.

### Shortcut pass-through

A chord that passes through delivers nothing and is not prevented. The default
policy is:

| Platform | Passes through |
| --- | --- |
| Every platform | `F12` |
| `mac` | Meta+R, W, T, L, C, V; Meta+Alt+I, J, U, C |
| `other` | Ctrl+T, N, V; Ctrl+Shift+I, J, C, V, T, N, W |

Ctrl+R, Ctrl+L, and Ctrl+W reach the application on `other`, because a page
can intercept them. Other Meta chords on `mac` arrive as `alt`.

### IME and text

The adapter tracks composition state. `compositionend` delivers the committed
text once, as `{ key: text, text, ctrl: false, alt: false, shift: false }`.
The `input` event that follows it is dropped when its data equals the text
just delivered, and an `input` event inside an open composition is ignored, so
both `compositionend`-then-`input` and `input`-then-`compositionend` orderings
deliver once. The guard is spent by the next `input`, `keydown`, or
composition. An `input` event outside a composition delivers its data, which
covers mobile keyboards, and `deleteContentBackward` is `backspace`. The
textarea value is emptied after each delivery. Text has C0, DEL, and C1
control characters removed, so it cannot forge an escape sequence on
`rawInput()`.

### Paste

A `paste` event reads `text/plain`, prevents the default, and delivers one
text message. One trailing line break is trimmed. Text that still holds a
`\r` or `\n` is rejected: nothing is delivered, no `enter` key is produced,
and `onPasteRejected` receives the original text. Multi-line paste is a
non-claim until Bijou defines a paste message.

### Pointer and wheel

`pointerdown` and `pointerup` map the primary, middle, and secondary buttons
to `press` and `release`; other buttons deliver nothing. `pointermove` is a
`move` carrying the held button, or `none`. `wheel` is `scroll-up` for a
negative `deltaY` and `scroll-down` for a positive one, prevents the page
scroll, and is registered as non-passive; a zero delta is ignored.

Cells are 0-based everywhere inside the package. They become 1-based only in
the SGR packet written to `rawInput()`: cell `(0, 0)` is `ESC[<0;1;1M`. The
button code is 0, 1, or 2 for left, middle, or right (3 for none), plus 32 for
motion, with scroll as 64 and 65, plus 4 for Shift, 8 for Alt or Meta, and 16
for Ctrl. A release ends in `m`.

### Raw encoding

`rawInput()` encodes keys as a terminal would. Modifiers are kept for function
keys (`CSI code;modifier ~`), Shift+Tab, Ctrl+letter, and Alt+character. Other
modified navigation keys lose their modifiers on the raw stream; `keyInput()`
does not.

### Not verified

Every test drives an in-memory event target. Nothing here has run in a real
browser, so cross-browser event ordering, Safari's `keydown` after
`compositionend`, and real virtual keyboards are unverified.

## `mountBijouCanvas(app, container, options)`

Mounts a TEA app on a `<canvas>` that the mount owns inside `container`, and
resolves to a `MountedBijouCanvas` handle. `app` is the app, or a function
that builds it from the context the run uses (`BijouCanvasApp`): an app such as
`createShowcaseApp(ctx)` that takes a `BijouContext` is mounted that way. The
function is called once, before `init()`; in `interactive` mode the context's
runtime already has the mounted grid. A subscription it makes to
`ctx.io.onData()` is kept and receives the stop message. If it throws, the
mount releases the canvas, presenter, observers and input it had made, and
rejects with that error. The app runs once, on
`run()` from `@flyingrobots/bijou-tui` with `RunOptions.presenter`, for the
whole life of the mount; switching backends never restarts it.

### Options

| Option | Contract |
| --- | --- |
| `presenters` | `{ webgpu?, webgl2?, canvas2d? }`: one `BijouCanvasPresenterFactory` per backend. Required. |
| `createCanvas` | Creates one canvas, for example `() => document.createElement('canvas')`. Required. Its return type is what the factories receive. |
| `cellPx` | `{ width, height }`: physical pixels per cell, the glyph atlas's cell size. Required. |
| `backend` | `'auto'` (default), `'webgpu'`, `'webgl2'` or `'canvas2d'`. |
| `isBackendUnavailable` | Tells unavailability from a renderer fault. Defaults to `isGpuBackendUnavailable`: `error.code === 'GEORDI_E_BIJOU_BACKEND_UNAVAILABLE'`. |
| `createTextarea` | Creates the hidden textarea. Defaults to `container.ownerDocument.createElement('textarea')`. |
| `host` | `BijouCanvasHost`: resize observation and the device pixel ratio. Defaults to the browser globals. |
| `clock` | A `WebClock`. Defaults to `createWebClock()`; frames are drawn on its `requestFrame()`. |
| `mode` | Output mode. Detected as `createWebContext()` does when absent. |
| `context` | `createWebContext()` options other than `clock` and `mode`: theme, environment, output sinks. |
| `input` | `platform`, `passThrough` and `onPasteRejected` of the input adapter. |
| `signal` | An `AbortSignal` that cancels a mount that has not resolved yet. |
| `css` | A BCSS stylesheet, passed to `run()` as `RunOptions.css` in every output mode. |

`createCanvas` is required, not defaulted, so that the canvas type reaches the
factories unchanged: with `() => document.createElement('canvas')` they
receive an `HTMLCanvasElement` and can hand it to a GPU library without a cast.

### The structural presenter interface

The package defines the presenter contract itself and imports nothing from a
GPU library.

```ts
type BijouCanvasBackend = 'webgpu' | 'webgl2' | 'canvas2d';

interface BijouCanvasFrame {
  readonly width: number;                 // cells
  readonly height: number;                // cells
  readonly buffer: Uint8Array;            // packed cells, row-major
  readonly sideTable: readonly string[];  // multi-codepoint graphemes
  readonly renderDirtyWords: Uint32Array; // one damage bit per cell
}

interface BijouCanvasResize {
  readonly cssWidth: number;
  readonly cssHeight: number;
  readonly dpr: number;
  readonly devicePixelContentBox?: { readonly width: number; readonly height: number };
}

interface BijouCanvasPresenter {
  present(current: BijouCanvasFrame, target: BijouCanvasFrame,
    ctx: { readonly forceFullRefresh?: boolean }): void;
  resize(size: BijouCanvasResize): void;
  dispose(): void;
}

type BijouCanvasPresenterFactory<C> = (
  canvas: C,
  init: { readonly backend: BijouCanvasBackend; readonly signal: { readonly aborted: boolean } },
) => BijouCanvasPresenter | Promise<BijouCanvasPresenter>;
```

`BijouCanvasFrame` has the shape of Geordi's `GpuPackedSurface`, and Geordi's
`GpuSurfacePresenter` satisfies `BijouCanvasPresenter` as it is; the extra
members (`cellFromPoint`, `getLastReceipt`) are not called. `present()` is
synchronous and the mount reuses both frames after it returns.

A factory that throws or rejects with an error the predicate accepts makes
`'auto'` move on. Any other error is a renderer fault and is thrown as it is.
`init.signal.aborted` turns true when `stop()` or the mount signal fires; a
factory may read it, and the mount disposes a presenter that arrives after it.

### Wiring Geordi's factories (illustrative)

This example is illustrative and not run by any test here. It assumes the
`@flyingrobots/geordi-bijou-gpu` exports as they stand today; `atlas`
and `app` are values your page builds.

```ts
import {
  createCanvas2DSurfacePresenter, createWebGL2SurfacePresenter, createWebGPUSurfacePresenter,
} from '@flyingrobots/geordi-bijou-gpu';
import { mountBijouCanvas } from '@flyingrobots/bijou-web';

const handle = await mountBijouCanvas(app, document.getElementById('terminal')!, {
  createCanvas: () => document.createElement('canvas'),
  cellPx: { width: atlas.bitmap.cellPxW, height: atlas.bitmap.cellPxH },
  presenters: {
    webgpu: (canvas) => createWebGPUSurfacePresenter(canvas, { atlas }),
    webgl2: (canvas) => createWebGL2SurfacePresenter({ canvas, atlas }),
    canvas2d: (canvas) => createCanvas2DSurfacePresenter({ canvas, atlas }),
  },
});
console.log(handle.backend, handle.fallbackReasons);
```

The factories take no shader argument; each Geordi presenter loads its bundled
shader source. Geordi's errors carry `code` strings, so the default predicate
recognises `BackendUnavailableError` without importing the class.

### Backend ladder

`'auto'` tries `webgpu`, `webgl2`, then `canvas2d`, each on a fresh canvas:
a canvas binds one context type for life, so a canvas whose attempt failed,
including one that failed after it acquired a context, is removed and never
reused. A backend without a factory is passed over. Each passed-over backend
adds `{ backend, code, reason }` to `fallbackReasons`, where `reason` is the
error's `reason`, `detail` or message. A renderer fault stops the ladder and
rejects the mount with that error. When every backend is passed over, the
mount rejects with `BijouCanvasError` `BIJOU_WEB_CANVAS_NO_BACKEND`, whose
`fallbackReasons` lists them all.

A forced `backend` makes one attempt. Its unavailability rejects with the
factory's own error, and a missing factory with `BIJOU_WEB_CANVAS_NO_FACTORY`.
Nothing is left in `container` after any rejection.

### Frames

The run's `SurfacePresenter` copies the target Surface's packed cells and ORs
the dirty words of both Surfaces into one pending frame, then asks the clock
for an animation frame. Every runtime frame before that animation frame lands
in the same pending frame, so a presenter draws at most once per repaint,
against the frame it showed last. The first frame of each presenter, and the
first after a grid change, carry `forceFullRefresh: true`.

A Surface without packed storage is refused with `BijouCanvasError`
`BIJOU_WEB_CANVAS_UNPACKED_SURFACE`, which puts the runtime in crash mode,
rather than reaching a presenter without its damage. A presenter that throws
while drawing is outside the runtime's crash mode: the mount ends the run and
`done` rejects with that error.

### Size, input and focus

The mount observes the container's content box, preferring the
device-pixel content box, and the device pixel ratio. The grid is the
physical size divided by `cellPx`, floored: physical size is the
device-pixel box when observed, else `round(css * dpr)`. Each new box calls
the presenter's `resize()` and resizes `ctx.runtime`, which sends the app a
resize message. A box with zero width or height is ignored, so a mount into a
hidden container waits, with nothing added, until the first box with area.

Setting a canvas's pixel size clears it. A box change that alters the grid
makes the app render at the new size, which paints it. A box change smaller
than one cell leaves the grid as it was, so the app is told nothing; the mount
then presents the last frame again, in full, on the next animation frame.
Several such changes before that frame produce one present.

`ctx` comes from `createWebInteractiveContext()`. Keys, IME and paste come
from the hidden textarea, and pointer and wheel events from the current
canvas, hit-tested over the cells the grid covers. A press on the canvas
focuses the textarea on `pointerdown` and again on `pointerup`, because a
browser's `mousedown` default action moves focus off the canvas in between. The canvas gets `display:block;width:100%;height:100%`
and the default textarea is visually hidden when they have an inline style.

### Handle

| Member | Contract |
| --- | --- |
| `backend`, `canvas` | The backend and canvas presenting now. |
| `fallbackReasons` | Why the first mount passed over each earlier backend. |
| `textarea`, `ctx` | The hidden textarea and the run's context. |
| `done` | Resolves when the run ends by `stop()` or app quit; rejects on a presenter fault. |
| `model()` | The app's latest model. |
| `cellFromPoint(x, y)` | The 0-based cell under a client point. |
| `switchBackend(next)` | Builds `next` on a fresh canvas while the old one still shows, then swaps the pointer listeners, re-presents the last frame with a full refresh, disposes the old presenter and removes the old canvas. The run, model and textarea stay, and focus stays on the textarea. Switches run one at a time. If `next` cannot start, it rejects and the current backend stays. After `stop()` it rejects with `BIJOU_WEB_CANVAS_STOPPED`. |
| `stop()` | Aborts pending switches, ends the run, and removes every listener, observer, frame, timer, presenter, canvas and textarea the mount added. Returns the same promise on every call. |

A switch still waiting on an async factory when `stop()` is called rejects
with `BIJOU_WEB_CANVAS_ABORTED`; its presenter is disposed and its canvas
removed when the factory settles. `stop()` does not wait for it.

The TUI runtime has no external stop. `stop()` sends a private message
through `io.onData()` that the mount's wrapper of the app answers with
`quit()`; after the app has thrown, the runtime is in crash mode and `stop()`
sends Enter instead, so `done` rejects with the crash error.

### Lowered modes

In `static`, `pipe` and `accessible` mode the mount adds nothing to
`container`. `run()` writes one text frame to the output sinks of
`options.context.output`; `backend`, `canvas` and `textarea` are `null` and
`switchBackend()` rejects with `BIJOU_WEB_CANVAS_NOT_INTERACTIVE`. Interactive
web accessibility belongs to the DOM host, not to a canvas.

### Verified in a browser

The [web-gpu showcase](../web-gpu-showcase/README.md) mounts example apps
with this function on Geordi's presenters in Chrome. Its browser suite holds
the default `ResizeObserver`, `devicePixelRatio` and `matchMedia` host, real
context binding on fresh canvases, `switchBackend()` across real canvases,
focus on a press, and the type compatibility of Geordi's factories under a
real build. Every other case above uses in-memory containers, canvases,
resize hosts and presenter factories. A change of device pixel ratio has not
been driven in a browser.
