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

The package only writes output. It attaches no keyboard, IME, or pointer
input, mounts no canvas, and renders nothing into the DOM.

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
