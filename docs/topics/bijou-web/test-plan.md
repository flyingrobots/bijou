# Test plan: browser host adapter

This ledger lists each requirement of the
[browser host adapter](./README.md), the test that holds it, and its status.
Every test is in `packages/bijou-web/src/`, in the file named in the
requirement's group heading. The oracle for each case is the assertion in the
named test. A name with `%s` is one parameterized test.

## Golden output: `context.test.ts`

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| WEB-01 | `alert`, `box`, and `table` give exact output in all four output modes with `NO_COLOR=1`, delivered to the output sink. | `renders alert, box, and table exactly in %s mode with NO_COLOR=1` | Implemented |
| WEB-02 | Colored `interactive` and `static` output strips back to the uncolored golden. | `colors %s output that strips back to the NO_COLOR golden` | Implemented |
| WEB-03 | A border token gives exact SGR sequences. | `emits the exact SGR sequences for an explicit border token` | Implemented |
| WEB-04 | `pipe` and `accessible` output has no escape sequences. | `keeps %s output free of escape sequences without NO_COLOR` | Implemented |
| WEB-05 | Lowered `static`, `pipe`, and `accessible` text reaches the in-memory buffer. | `delivers lowered %s text to the in-memory buffer when no sink is supplied` | Implemented |
| WEB-06 | The output mode is detected from the runtime when none is given. | `detects %s mode from the runtime when no mode is given` | Implemented |
| WEB-07 | The context works where `window` is undefined. | `works in a headless worker environment where window is undefined` | Implemented |
| WEB-08 | Runtime resizes reach `io.onResize()`, and dimensions clamp. | `connects runtime resizes to the I/O port and exposes mutable dimensions` | Implemented |
| WEB-09 | An unreadable `BIJOU_THEME` file gives the fallback theme. | `falls back to the default theme when BIJOU_THEME names a file it cannot read` | Implemented |
| WEB-10 | Error text and bytes go to their own sinks. | `routes error text and bytes to their own sinks` | Implemented |

## Clock: `clock.test.ts`, `clock-global.test.ts`, `clock-stress.test.ts`

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| WEB-11 | Time and dates come from the injected host. | `reads wall-clock time and builds dates from the host` | Implemented |
| WEB-12 | A timeout fires once and releases its handle. | `fires a timeout once and releases its handle` | Implemented |
| WEB-13 | `TimerHandle.dispose()` cancels a pending timeout. | `cancels a pending timeout when its TimerHandle is disposed` | Implemented |
| WEB-14 | An interval repeats until disposed. | `repeats an interval until its TimerHandle is disposed` | Implemented |
| WEB-15 | A negative or non-finite delay is zero. | `treats negative and non-finite delays as zero` | Implemented |
| WEB-16 | Microtasks queue on the host. | `queues microtasks on the host` | Implemented |
| WEB-17 | Frames use the host frame hook and cancel on dispose. | `schedules frames through the host frame hook and cancels them on dispose` | Implemented |
| WEB-18 | Frames fall back to a timer without a frame hook. | `falls back to a timer when the host has no frame hook` | Implemented |
| WEB-19 | The global host works without `window`, `document`, or `requestAnimationFrame`. | `runs where window, document, and requestAnimationFrame are undefined` | Implemented |
| WEB-20 | The global host fires real timers, microtasks, and fallback frames. | `fires real timeouts, intervals, microtasks, and fallback frames` | Implemented |
| WEB-21 | A global `requestAnimationFrame` is used when present. | `uses a global requestAnimationFrame when the host provides one` | Implemented |
| WEB-22 | 500 schedule and dispose cycles leak no handle on a fake host. | `leaves zero leaked handles after 500 rapid cycles on a fake host` | Implemented |
| WEB-23 | 500 schedule and dispose cycles leak no handle on the global host. | `leaves zero leaked handles after 500 rapid cycles on the global host` | Implemented |

## Runtime: `runtime.test.ts`

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| WEB-24 | Defaults are 80 by 24 at 60 FPS, with no input stream. | `defaults to an 80x24 output surface at 60 FPS with no input stream` | Implemented |
| WEB-25 | The environment is an in-memory map. | `keeps environment variables in an in-memory map` | Implemented |
| WEB-26 | Size, refresh rate, and TTY flags are configurable. | `accepts configured dimensions, refresh rate, and TTY flags` | Implemented |
| WEB-27 | Zero, negative, fractional, and non-finite dimensions clamp safely. | `clamps %s dimensions at creation, assignment, and resize` | Implemented |
| WEB-28 | An invalid refresh rate is 60. | `falls back to 60 FPS for refresh rate %s` | Implemented |
| WEB-29 | Resize listeners get clamped sizes until disposed. | `notifies resize listeners with clamped dimensions until disposed` | Implemented |

## Style: `style.test.ts`

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| WEB-30 | `rgb`, `hex`, `bgRgb`, and `bgHex` give exact 24-bit sequences. | `applies 24-bit foreground and background colors` | Implemented |
| WEB-31 | `bold` gives the exact sequence. | `applies bold weight` | Implemented |
| WEB-32 | `styled` orders foreground, modifiers, and background. | `styles a token with foreground, modifiers, and background` | Implemented |
| WEB-33 | Each modifier gives its sequence. | `applies the %s modifier` | Implemented |
| WEB-34 | Channels clamp, and an invalid hex color leaves text plain. | `clamps channels and leaves text plain for an invalid hex color` | Implemented |
| WEB-35 | An outer color reopens after a nested color. | `reopens the outer color after a nested color closes` | Implemented |
| WEB-36 | Styles close and reopen around line breaks. | `closes and reopens styles around line breaks` | Implemented |
| WEB-37 | Empty text is unchanged. | `returns empty text unchanged` | Implemented |
| WEB-38 | `noColor` returns every method unstyled. | `returns every method unstyled when noColor is set` | Implemented |
| WEB-39 | `NO_COLOR` is read from the runtime on every call. | `reads NO_COLOR from the runtime on every call` | Implemented |
| WEB-40 | An explicit `noColor` overrides the runtime. | `lets an explicit noColor option override the runtime` | Implemented |

## Output I/O: `output-io.test.ts`

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| WEB-41 | Output and error text have separate buffers. | `keeps output and error text in separate inspectable buffers` | Implemented |
| WEB-42 | Sinks receive text in place of the buffers. | `routes text to caller-supplied sinks instead of the buffers` | Implemented |
| WEB-43 | A buffer keeps only the most recent text. | `retains only the most recent text once the buffer limit is reached` | Implemented |
| WEB-44 | `writeBytes(buf, len)` respects `len < buf.length`. | `reads only len bytes when len is shorter than the buffer` | Implemented |
| WEB-45 | An out-of-range `len` clamps. | `clamps a len that is %s` | Implemented |
| WEB-46 | A character split across two writes decodes. | `decodes a multi-byte character split across two writes` | Implemented |
| WEB-47 | A byte sink gets exactly `len` bytes. | `hands exactly len bytes to a caller-supplied byte sink` | Implemented |
| WEB-48 | `readFile`, `readDir`, and `rawInput` throw a typed error, not a `ReferenceError`. | `refuses %s with a typed error` | Implemented |
| WEB-49 | `question` rejects with a typed error. | `rejects QueryPort.question with a typed error` | Implemented |
| WEB-50 | `joinPath` joins with `/` and keeps URL schemes. | `joins path segments with forward slashes and keeps URL schemes intact` | Implemented |
| WEB-51 | Intervals run on the injected clock. | `runs intervals on the injected clock` | Implemented |
| WEB-52 | Resize events come from the resize source. | `forwards resize events from the supplied resize source` | Implemented |
| WEB-53 | Without a resize source, callbacks never run. | `never fires resize callbacks when no resize source exists` | Implemented |

## Host purity: `purity.test.ts`

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| WEB-54 | The scan covers the package sources. | `ships source files to scan` | Implemented |
| WEB-55 | No source file imports Node.js or names `process` or `Buffer`. | `%s uses no Node.js import, process, or Buffer` | Implemented |
| WEB-56 | The manifest has no runtime dependencies, and the build uses no Node.js typings. | `declares zero runtime dependencies and no Node.js typings` | Implemented |
