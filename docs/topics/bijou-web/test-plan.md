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

## Keyboard and shortcuts: `interactive-keys.test.ts`

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| WEB-57 | Navigation, function, Enter, Escape, Tab, and Backspace keys deliver the terminal host's key names and raw encodings, and prevent the default. | `delivers the %s key as %s and its raw encoding` | Implemented |
| WEB-58 | Ctrl+C delivers `c` with `ctrl`, and the byte `0x03` on raw input. | `delivers Ctrl+C as ctrl and c` | Implemented |
| WEB-59 | Shift+Tab sets `shift`, and Alt sets `alt`. | `delivers Shift+Tab, and Alt as the alt modifier` | Implemented |
| WEB-60 | Printable keys carry `text`; an uppercase ASCII letter is lowercase plus `shift`. | `delivers printable text with the text payload, and uppercase as shifted` | Implemented |
| WEB-61 | Modifier-only, dead, and unidentified keys deliver nothing and are not prevented. | `ignores the %s key without preventing it` | Implemented |
| WEB-62 | macOS Meta+R/W/T/L/C/V reach the browser. | `lets macOS Meta+%s reach the browser` | Implemented |
| WEB-63 | F12 and the non-interceptable chords on other platforms reach the browser. | `lets the non-macOS chord %o reach the browser` | Implemented |
| WEB-64 | Ctrl+R, Ctrl+L, and Ctrl+W reach the application on other platforms. | `delivers Ctrl+%s to the application on non-macOS` | Implemented |
| WEB-65 | A macOS Meta chord outside the list is delivered as `alt`. | `delivers macOS Meta chords outside the list as alt` | Implemented |
| WEB-66 | A caller-supplied predicate replaces the default policy. | `honors a caller-supplied pass-through predicate` | Implemented |

## IME and mobile input: `interactive-text.test.ts`

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| WEB-67 | A full composition delivers accented, CJK, and astral text once, on `compositionend`. | `delivers committed %s once after a full composition` | Implemented |
| WEB-68 | `compositionend` before `input` delivers once and empties the textarea. | `delivers once when compositionend arrives before input` | Implemented |
| WEB-69 | `input` before `compositionend` delivers once. | `delivers once when input arrives before compositionend` | Implemented |
| WEB-70 | `keydown` is ignored and not prevented while composing. | `suppresses keydown while composing, by state and by isComposing` | Implemented |
| WEB-71 | A cancelled composition delivers nothing. | `delivers nothing for a cancelled composition` | Implemented |
| WEB-72 | The duplicate guard is spent once, so later identical text is delivered. | `delivers a repeat of the same text typed after the composition settled` | Implemented |
| WEB-73 | `input` without a composition delivers its text. | `delivers input that has no composition, as on a mobile keyboard` | Implemented |
| WEB-74 | A mobile delete is the `backspace` key. | `delivers a mobile delete as the backspace key` | Implemented |

## Paste: `interactive-text.test.ts`

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| WEB-75 | Single-line paste delivers whole and prevents the default insert. | `delivers single-line paste text and prevents the default insert` | Implemented |
| WEB-76 | Paste reads `text/plain`. | `asks the clipboard for plain text` | Implemented |
| WEB-77 | One trailing line break is trimmed. | `trims one trailing line break from %j` | Implemented |
| WEB-78 | Multi-line paste is rejected and never produces an Enter key. | `rejects multi-line paste %j without an Enter key` | Implemented |
| WEB-79 | Missing clipboard data delivers nothing. | `delivers nothing when clipboardData is %s` | Implemented |
| WEB-80 | A paste of only a line break delivers nothing and is not reported as rejected. | `delivers nothing for a paste of only a line break` | Implemented |
| WEB-81 | Control characters are stripped from pasted text. | `strips control characters so paste cannot forge escape sequences` | Implemented |

## Pointer and wheel: `interactive-pointer.test.ts`

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| WEB-82 | `cellFromPoint()` returns 0-based cells. | `maps client (%f, %f) to the 0-based cell (%i, %i)` | Implemented |
| WEB-83 | Points outside the surface, and non-finite points, clamp to the grid. | `clamps client (%f, %f) to (%i, %i)` | Implemented |
| WEB-84 | A surface with no area maps to cell (0, 0). | `maps every point to cell (0, 0) when the surface has no area` | Implemented |
| WEB-85 | Hit-testing follows the runtime size. | `follows the runtime size after a resize` | Implemented |
| WEB-86 | Cell (0, 0) is `col: 0, row: 0` in the message and `1;1` in the SGR packet. | `emits 0-based cells in the structured message and 1-based cells only in the SGR packet` | Implemented |
| WEB-87 | The last cell is (79, 23) in the message and `80;24` on the wire. | `emits the last cell as (79, 23) and as 80;24 on the wire` | Implemented |
| WEB-88 | A drag is press, move, release with the left button. | `maps a left-button drag from press through move to release` | Implemented |
| WEB-89 | A move reports the held button and the motion code. | `maps a move with buttons %i to %s and code %i` | Implemented |
| WEB-90 | Left, middle, and right buttons press and release with their codes. | `maps pointer button %i to %s` | Implemented |
| WEB-91 | Other pointer buttons deliver nothing. | `ignores pointer buttons beyond the first three` | Implemented |
| WEB-92 | Shift, Alt or Meta, and Ctrl carry into the message and the packet. | `carries shift, alt (or meta), and ctrl into the message and the packet` | Implemented |
| WEB-93 | A drag that leaves the surface clamps to the edge cell. | `clamps a drag that leaves the surface to the edge cell` | Implemented |
| WEB-94 | Wheel up and down map to scroll codes; a zero delta is ignored; the wheel listener is not passive. | `maps wheel up and down, ignores a zero delta, and prevents page scroll` | Implemented |

## Lifecycle: `interactive-lifecycle.test.ts`

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| WEB-95 | No listener attaches until a stream is subscribed, and none remains after it is disposed. | `attaches no listener until something subscribes` | Implemented |
| WEB-96 | A disposed handle stops delivering at once, and a second `dispose()` is harmless. | `stops delivering at once on dispose, and a second dispose is harmless` | Implemented |
| WEB-97 | Disposing one subscriber leaves the others. | `keeps delivering to a second subscriber after the first disposes` | Implemented |
| WEB-98 | `io.dispose()` removes every listener and ends every stream, and is idempotent. | `removes every listener and stops every stream on io.dispose(), twice over` | Implemented |
| WEB-99 | A subscription after `io.dispose()` is inert. | `gives an inert handle to a subscription made after io.dispose()` | Implemented |
| WEB-100 | Resize columns and rows reach `onResize()` until disposed. | `forwards resize columns and rows to onResize until disposed` | Implemented |
| WEB-101 | `rawInput()` no longer refuses, and output still works. | `no longer refuses rawInput, and still writes output` | Implemented |
| WEB-102 | The adapter works without a textarea or a surface. | `works with no textarea and no surface` | Implemented |
| WEB-103 | 1,000 mixed events leave zero listeners after dispose. | `leaves zero listeners after 1,000 mixed resize, key, and pointer events` | Implemented |

## Interactive context: `context-interactive.test.ts`

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| WEB-104 | `createWebInteractiveContext()` reads the textarea through `io.rawInput()`, in `interactive` mode. | `composes a context whose io reads the textarea through rawInput` | Implemented |
| WEB-105 | Pointer input is hit-tested and SGR-encoded against the context runtime size. | `hit-tests and encodes pointer input against the context runtime size` | Implemented |
| WEB-106 | Runtime resizes reach `io.onResize()`. | `forwards runtime resizes to io.onResize` | Implemented |
| WEB-107 | `io.dispose()` removes every input listener. | `removes every input listener on io.dispose()` | Implemented |

## Canvas ladder: `canvas-ladder.test.ts`

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| WEB-108 | `'auto'` presents on WebGPU first and records no fallback. | `uses WebGPU first in auto mode and records no fallback` | Implemented |
| WEB-109 | `'auto'` tries `webgpu`, `webgl2`, `canvas2d` in strict order, each on its own canvas, with each exact reason. | `tries webgpu, then webgl2, then canvas2d in strict order and records each exact reason` | Implemented |
| WEB-110 | A backend that fails after binding a context is removed with its canvas; the next one gets a fresh canvas. | `mounts a fresh canvas after a backend fails once it has bound a context` | Implemented |
| WEB-111 | A backend without a factory is passed over with a recorded reason. | `skips a backend that has no factory in auto mode and says so` | Implemented |
| WEB-112 | A renderer fault stops `'auto'` loudly with no fallback and leaves nothing mounted. | `stops loudly on a renderer fault in auto mode and never falls back` | Implemented |
| WEB-113 | A forced backend's unavailability rejects with the typed error and no fallback. | `fails a forced backend loudly when it is unavailable, with no fallback` | Implemented |
| WEB-114 | A forced backend without a factory rejects. | `fails a forced backend that has no factory` | Implemented |
| WEB-115 | An exhausted ladder rejects with every reason and leaves nothing mounted. | `reports every reason when no backend in the ladder is available` | Implemented |
| WEB-116 | The unavailability predicate is injectable. | `accepts an injected predicate for unavailability` | Implemented |

## Canvas frames: `canvas-frames.test.ts`

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| WEB-117 | The first frame is a full refresh at the container's grid size. | `presents the first frame with a full refresh at the grid size of the container` | Implemented |
| WEB-118 | Runtime frames between two animation frames coalesce into one present. | `coalesces every runtime frame between two animation frames into one present` | Implemented |
| WEB-119 | A new container box resizes the presenter and the grid, then refreshes fully. | `resizes the presenter and the grid when the container box changes` | Implemented |
| WEB-120 | The device-pixel content box and DPR changes set the grid. | `uses the device-pixel content box and follows DPR changes` | Implemented |
| WEB-121 | A Surface without packed storage is refused with a typed error. | `refuses a Surface without packed storage instead of dropping its dirty bits` | Implemented |

## Canvas switching: `canvas-switch.test.ts`

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| WEB-122 | `switchBackend()` swaps canvas and presenter, keeping the model, focus and input wiring; the old canvas keeps no listener. | `swaps the canvas and presenter while keeping the TEA model, focus and input wiring` | Implemented |
| WEB-123 | The new presenter re-presents the last frame with a full refresh at once. | `re-presents the last frame on the new presenter at once` | Implemented |
| WEB-124 | An unavailable switch target rejects and keeps the current backend working. | `keeps the current backend when the switch target is unavailable` | Implemented |
| WEB-125 | Overlapping switches run one after another. | `runs overlapping switches one after another` | Implemented |
| WEB-126 | A switch after `stop()` is refused. | `refuses a switch after stop()` | Implemented |

## Canvas lifecycle: `canvas-lifecycle.test.ts`, `canvas-crash.test.ts`, `canvas-stress.test.ts`, `canvas-types.test.ts`

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| WEB-127 | `stop()` is idempotent and retains no listener, observer, timer, frame or presenter. | `stop() is idempotent and leaves no listener, observer, timer, frame or presenter` | Implemented |
| WEB-128 | A zero-width or zero-height container defers the mount until the first box with area. | `defers the mount while the container has zero width, until the first non-zero box` | Implemented |
| WEB-129 | Aborting during async WebGPU init rejects and disposes the late presenter. | `aborts a mount whose async WebGPU init is still pending, and disposes the late presenter` | Implemented |
| WEB-130 | Aborting while waiting for a box rejects and retains nothing. | `aborts a mount that is still waiting for a non-zero box` | Implemented |
| WEB-131 | An already aborted signal refuses before observing. | `refuses at once when the signal is already aborted` | Implemented |
| WEB-132 | `stop()` during an async WebGPU switch aborts it without leaking. | `stop() during an async WebGPU switch aborts it without leaking a canvas or presenter` | Implemented |
| WEB-133 | A presenter fault while drawing ends the run and rejects `done`. | `ends the run loudly when a presenter faults while presenting` | Implemented |
| WEB-134 | `stop()` after the app crashed ends the run and rejects `done` with the crash error. | `stop() after an app crash ends the run with the crash error` | Implemented |
| WEB-135 | `accessible` mode writes to the output sink and mounts no canvas. | `writes accessible output through the output sink and mounts no canvas` | Implemented |
| WEB-136 | A host without `ResizeObserver` refuses loudly. | `refuses loudly when the host has no ResizeObserver` | Implemented |
| WEB-137 | 50 mount, switch and stop cycles retain nothing. | `leaves zero listeners, observers, timers or presenters after 50 mount, switch and stop cycles` | Implemented |
| WEB-138 | Real DOM elements and a Geordi-shaped presenter satisfy the structural interfaces at compile time. | `accepts the real DOM elements and a Geordi-shaped presenter without a cast` | Implemented |
