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
in. The package mounts no canvas and renders nothing into the DOM.

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
