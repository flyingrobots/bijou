---
title: DL-033 bijou-replay-event/1 Envelope and Ordering Rules
lane: cool-ideas
priority: medium
github_issue: 599
status: decided
keywords:
  - replay
  - capture
  - jsonl
  - determinism
  - recorder
  - v8.1.0
---

# bijou-replay-event/1 Envelope and Ordering Rules

## Linked Work

- Decision task: [#599](https://github.com/flyingrobots/bijou/issues/599)
- Parent container: [#456](https://github.com/flyingrobots/bijou/issues/456)
- Dependents, in order: [#600](https://github.com/flyingrobots/bijou/issues/600)
  ReplayOutbox, [#602](https://github.com/flyingrobots/bijou/issues/602)
  `runScript()` emission, [#605](https://github.com/flyingrobots/bijou/issues/605)
  `recordDemoGif()` as a subscriber, [#607](https://github.com/flyingrobots/bijou/issues/607)
  fixture that reproduces a GIF
- Recording pipeline evidence: PR #579, merged as 36a77614
  (`examples/hero/clip.ts` and `examples/hero/encoders/`)

## Sponsors

- **Human:** James Ross — capture must subscribe to an ordered event stream;
  GIF output must not be the source of truth.
- **Agent:** Claude — fix one small, facts-only envelope that the four
  dependent tasks can implement without reopening this decision.

## Decision Summary

`bijou-replay-event/1` is a JSONL stream of plain-data events. Each `kind` has
its own payload schema, and the stream has one total order given by `seq`.
Time is logical: `tick` counts delivered pulses and `atMs` is elapsed time on
the injected clock. Recorder-owned fields do not collect wall-clock dates,
random identifiers, environment or model state. Caller-supplied content is
not sanitized; the privacy boundary below applies.

Frame events carry the complete rendered Surface as resolved cell facts and a
content hash. They are the only synchronization barrier for capture consumers.
A consumer can therefore rebuild every frame from the stream alone, without the
app, the theme or a terminal.

The parent sketch is adopted with per-kind payloads (option 2 of #599). Its
random `eventId`, `sessionId` and `previousEventId` fields are removed because
`seq` already gives identity and order. Viewport and theme context are part of
v1 because the parent acceptance criteria need them.

This is a design contract for the open dependent tasks, not an implemented
replay API. The following grounding describes the existing runtime.

## Grounding In The Current Code

- `runScript()` (`packages/bijou-tui/src/driver-script.ts`) renders an initial
  frame, runs `init()` commands, drains, and then for each step calls
  `dispatchScriptStep()` and `bus.drain()`. Each message delivered to the bus
  handler runs `app.update()`, renders exactly one frame, pushes it to
  `frames`, calls `onFrame`, and then starts the returned commands.
- `dispatchScriptStep()` (`driver-runtime.ts`) sleeps `delay` ms on the
  resolved clock, then emits one message: `parseKey(key)`, `{ type: 'pulse',
  dt }`, `{ type: 'resize', columns, rows }`, a `MouseMsg`, or a custom `msg`.
- With `pulseFps` not `false`, `startEventBusPulse()` emits timer pulses with
  `dt` measured from `clock.now()`. Script-driven pulses carry the `dt` that
  the step gives.
- Commands get `emit`, `sleep`, `defer`, `now` and `onPulse` capabilities.
  `drain()` waits until no commands are pending. A command that sleeps on a
  mock clock that only pulses advance never settles, so `drain()` blocks the
  script. `examples/hero/clip.ts` works around this by running commands
  detached and advancing the mock clock by `dt` inside `update()`.
- `recordDemoGif()` (`packages/bijou-node/src/recorder.part03.ts`) calls
  `runScript()` and passes `result.frames` to `writeSurfaceGif()`, which scales
  frames to the largest size, rasterizes them from cell facts (`fgRGB`/`bgRGB`,
  resolved colours, modifiers, `empty`), and uses one fixed frame delay.
- The hero encoder port (`examples/hero/encoders/port.ts`) takes RGBA frames
  in display order. It never sees app state, which matches this design.

## The Envelope

Every line is one object with exactly these top-level fields:

```ts
type ReplayEvent = {
  /** Format and major version. Readers reject any other value. */
  schema: 'bijou-replay-event/1';
  /** Position in the total order: 0, 1, 2, ... with no gaps. */
  seq: number;
  /** Pulses delivered before this event. Starts at 0. */
  tick: number;
  /** Elapsed milliseconds on the run's clock since the run started, integer. */
  atMs: number;
  kind: ReplayEventKind;
  payload: ReplayPayload[kind];
};
```

`seq`, `tick` and `atMs` are non-negative integers (`atMs` is rounded down).
The ReplayOutbox assigns `seq`. Emitters supply `tick`, `atMs`, `kind` and
`payload`. No other top-level field is allowed in v1.

### Event kinds and payloads

All payload values are JSON values: `null`, booleans, finite numbers, strings,
arrays and plain objects. `undefined`, functions, symbols, bigints, class
instances, `Date`, `Map`, `Set`, typed arrays, `NaN`, infinities and cycles
are rejected at append time.

| kind | payload | Emitted |
| --- | --- | --- |
| `session` | `{ source, label, claim, viewport, context, clock, pulses }` | Once, `seq` 0 |
| `input` | `{ origin, cmd?, msg }` | Each key, mouse or custom message delivered to `update()` |
| `resize` | `{ origin, cmd?, columns, rows }` | Each resize delivered to `update()` |
| `pulse` | `{ origin, cmd?, dt }` | Each pulse delivered to `update()` |
| `command` | `{ cmd, phase, outcome? }` | Command start and settle |
| `debug-fact` | `{ name, value }` | Opt-in facts from the emitter |
| `frame` | `{ index, width, height, hash, styles, cells }` | After each render |
| `end` | `{ frames, pendingCommands, reason }` | Once, last line |

Field details:

- `session.source`: `'script' | 'test' | 'dogfood'`. `'terminal'` is reserved
  for a later version and is not emitted in v1.
- `session.label`: a caller-supplied string, for example the demo name. It
  replaces `sessionId`. Default `""`.
- `session.viewport`: `{ columns, rows }`, the initial size from
  `initialSize(ctx)`.
- `session.context`: `{ mode, theme, colorLevel }`. `mode` is the output mode
  (`interactive`, `static`, `pipe`, `accessible`). `theme` is the theme name
  or `null`. `colorLevel` is the style port's colour level or `null`.
- `session.clock`: `'mock' | 'system'`. The determinism rules below apply only
  to `'mock'`.
- `session.pulses`: `'script'` when `pulseFps` is `false`, otherwise
  `{ timerFps: number }`.
- `session.claim`: `'frame-playback'`. It is the only value v1 emitters write.
  `'re-execution'` is reserved; see Two Claims below.
- `origin`: `'script'` for a message from a script step, `'command'` for a
  message that a command emitted or returned, `'timer'` for a bus timer pulse.
  For `input`, `resize` and `pulse`, `cmd` is required exactly when `origin`
  is `'command'`; it gives the ordinal assigned to that command. It is absent
  for script and timer origins.
- `input.msg`: the delivered message as plain data. For a key step this is the
  parsed `KeyMsg`, not the raw string. A custom `msg` that is not plain JSON is
  rejected; the run fails and does not drop the message silently.
- `command.cmd`: an ordinal assigned when the command starts, counted from 0
  across the run. `phase` is `'start' | 'settle'`. On settle, `outcome` is
  `'message' | 'quit' | 'cleanup' | 'empty' | 'error'`. Only the outcome
  class is recorded. Error messages and stacks are not recorded, because they
  can hold paths and data.
- `debug-fact`: `name` is a dotted string such as `focus.target`; `value` is
  any JSON value.
- `frame.index`: the same index `onFrame` receives (0 is the initial frame).
- `frame.styles`: a table of distinct cell styles in first-use order. Each
  entry is `{ fg?, bg?, modifiers?, empty?, opacity? }`. `fg` and `bg` are
  resolved `[r, g, b]` tuples (from `fgRGB`/`bgRGB` or a resolved colour) and
  are left out for the terminal default. `modifiers` is sorted. Keys with
  default values are left out.
- `frame.cells`: row-major, `width * height` entries, each `[char, style]`
  where `style` indexes `styles`.
- `frame.hash`: `"sha256:<hex>"` of the canonical JSON of
  `{ width, height, styles, cells }`.
- `end.reason`: `'steps-complete' | 'quit' | 'error'`. `pendingCommands` is
  the bus's pending count when the run stops.

### Framing and serialization

- UTF-8, no byte-order mark, one event per line, every line ends with `\n`,
  including the last.
- Canonical JSON: object keys sorted by code point, no insignificant
  whitespace, `-0` written as `0`, strings escaped as `JSON.stringify` does.
- The first line is `session` with `seq` 0. The last line is `end`. A file
  without `end` is a truncated recording; readers report it and do not invent
  frames.

### Versioning

- The major version is in `schema`. Readers reject a major version they do not
  know.
- Within `/1`, a new `kind` or a new optional payload field is allowed.
  Readers skip unknown kinds and ignore unknown payload fields.
- Removing a field, changing a type or meaning, or changing ordering or hash
  rules requires `bijou-replay-event/2`.
- Kinds reserved for later minor additions: `update`, `effect`,
  `surface-diff`, `focus`.

## Ordering Rules

1. **One total order.** `seq` is the only order. The outbox appends
   synchronously in call order and never reorders events. Consumers must not
   sort by `atMs` or `tick`.
2. **Cause before effect.** For each delivered message the emitter appends, in
   this order: the `input`, `resize` or `pulse` event; the `frame` event for
   the render that `update()` caused; then start each returned command in
   array order, appending its `command` `start` immediately before invoking it.
   A synchronous command emission may deliver a nested message and frame
   before the next sibling command starts; do not batch start events ahead
   of actual invocation. A `frame` event therefore comes after
   every event that produced the frame (#602 acceptance).
3. **Command messages.** A message that a command emits or returns is appended
   as `input`, `resize` or `pulse` with `origin: 'command'` when the bus
   delivers it. The `command` `settle` event is appended when the command
   promise settles. Byte stability also requires every condition in the
   determinism guarantee below; the clock alone does not establish it.
4. **Frame barrier.** A `frame` event closes a frame. Events between barriers
   describe intervening activity; a command settlement need not cause the
   next frame. Consumers emit output only at frame events. A consumer never
   renders between barriers or merges two barriers.
5. **Initial frame.** After `session`, the initial render is `frame` index 0,
   followed by `command` `start` events for the `init()` commands.
6. **Logical time.** `tick` increases by one after each `pulse` event, so the
   pulse event carries the tick count before it. `atMs` is
   `floor(clock.now() - start)`. A completed script `delay` advances `atMs`
   but not `tick`; on the mock clock the sleep needs explicit clock advancement
   and does not advance time itself. `pulse.dt` is recorded exactly as
   delivered, in seconds.
7. **No implicit wall time.** Recorder-owned timing fields use elapsed time,
   not absolute dates or the mock clock's epoch. This does not filter dates
   that callers put in messages, labels, debug facts or rendered text.

### Determinism guarantee

Byte identity requires the same app version, initial state, script, replay
label, viewport, output mode, theme, colour level and rendering configuration.
Every executed path in `init()`, `update()`, `view()`, commands and callbacks
must use deterministic inputs and scheduling. They must not read uncontrolled
randomness, environment, external mutable state, real timers or I/O. The mock
clock must have the same initial value and explicit advancement schedule;
`pulseFps` must be `false`. A mock clock alone cannot make arbitrary app code
deterministic. With system time or timer pulses, order remains defined but
byte stability is not promised.

The known drain hazard remains: a command sleeping on a mock clock waits for
explicit advancement and can block `drain()`. v1 does not change drain
semantics. The detached pattern in `examples/hero/clip.ts` returns
`undefined` from a wrapper while retaining the underlying promise. The bus
therefore settles the **wrapper command** as `empty`; it does not observe the
underlying promise's settlement, errors or remaining work. A later message
through that wrapper's captured emitter keeps the wrapper's command ordinal,
including after its recorded settle event. `pendingCommands` counts bus-owned
wrappers only, not detached promises. This is limited evidence, not a complete
effect lifecycle or a re-execution claim.

The recording ends when the existing scripted run stops. Ignore late detached
emissions after `end`; never append beyond it. A caller needing a detached
result in the recording must arrange for delivery before that boundary. A
pending detached result does not extend the recording or hold `drain()` open.

## What Is And Is Not Recorded

Recorded: script inputs after parsing, resize and pulse facts, command
lifecycle classes, opt-in debug facts, resolved frame cells and hashes, the
initial viewport, the output mode, the theme name and the colour level.

Not automatically collected by recorder instrumentation:

- environment variables, `argv`, the working directory, file paths, host or
  user names;
- the app model, closures, command functions, cleanup handles or `ctx`
  objects;
- error messages and stack traces;
- absolute timestamps or random identifiers;
- raw terminal output or escape sequences (no terminal scrape is replay truth).

This is a collection boundary, not a redaction or confidentiality guarantee.
Plain JSON validation checks representation, not sensitivity. Messages,
`session.label`, debug facts and rendered cell text are recorded as supplied;
they can contain paths, user names, timestamps or secrets. Callers must use
non-sensitive fixtures or sanitize those values before recording. v1 performs
no heuristic redaction, because it would alter the recorded facts. It does not
record live terminal sessions.

## Directions Considered

1. **Parent sketch as-is** (`payload: unknown`, random `eventId` and
   `sessionId`, `previousEventId`). Rejected. `unknown` lets callbacks and
   class instances into the artifact, against the Buffer Holds Facts
   invariant. Random identifiers make two runs differ, so the "identical
   JSONL" acceptance check in #602 cannot pass. `previousEventId` repeats what
   `seq` gives and can disagree with it.
2. **Inputs-only replay.** Record only the script steps and re-run the app to
   reproduce frames. Rejected. The fixture in #607 must reproduce a GIF "from
   the fixture alone"; this direction needs the app code and breaks every
   fixture when the app changes. `recordDemoGif()` would stay the source of
   truth, which is the problem #456 states.
3. **Surface diffs in v1.** Record only changed cells after a keyframe.
   Deferred, not adopted. Streams are smaller, but each frame depends on all
   earlier frames, a truncated or skipped line damages the rest of the file,
   and the hash rule becomes more complex. `surface-diff` is reserved for a
   later minor version as an optional addition next to full frames.
4. **Wall-clock timestamps.** Rejected. They break byte stability, and they
   record when a person ran something, which is not a fact about the
   app.
5. **Defer viewport and theme context.** Rejected. The parent acceptance
   criteria need viewport and theme context, and the cost is one `session`
   line.

## Consequences

- Replay files are larger than input logs because each frame holds every cell.
  Even 1,920 blank cells (80 by 24) take about 15 KiB as JSON tuples, before
  the style table and event fields. The
  style table limits repetition. Long recordings should use the file-backed
  outbox, and `surface-diff` is the planned size reduction.
- Colours are resolved at record time, so a replay keeps the theme that was
  in use. To render another theme, record again.
- Custom messages must be plain data to be recordable. Apps with class-based
  messages cannot record until they change.
- The frame barrier makes the GIF path simple: one GIF frame per `frame`
  event.
- The decision can be changed until #600 merges. After that, a change is a
  migration with a new `schema` major version.

## Artifact Layers

Three issues name replay or capture formats: #301 (`.bijoucap` / `.bjcap`),
#306 (`.bijouplay`) and #456 (replay JSONL). They describe four separate
layers. Each layer depends only on the layers above it in this list.

| Layer | Holds | Format | Owner |
| --- | --- | --- | --- |
| (a) Event stream | Ordered inputs, command lifecycle and results, context, and the frame boundaries that the declared claim needs | `bijou-replay-event/1` JSONL | #456, decided here (#599) |
| (b) Captured frames | The output that was actually captured: full frames, later deltas, frame timing | `.bijoucap` / `.bjcap` (name open) | #301 |
| (c) Session manifest | Binds (a) and (b) to source, assets, profiles and package versions, each with an identity (hash or version) | `.bijouplay` | #306 |
| (d) Media export | GIF, video, stills, rendered from (b) only | `.gif`, `.mp4`, `.webp`, `.png` | #605 (GIF); encoders from PR #579 |

Rules:

- Media export (d) reads captured frames only. It never reads app code or
  re-runs the app.
- In v1, (b) does not exist yet. Each `frame` event therefore carries the full
  captured Surface inline, so that a v1 stream alone is enough for frame
  playback. This is layer (b) data carried inside layer (a), and it is
  temporary. When #301 defines `.bijoucap`, it decides if `frame` events keep
  inline cells or reference captured frames by `hash`. The `hash` rule in this
  record is the join key between the two layers in both cases.
- The manifest (c) is the only layer that records source, asset, profile and
  version identities. The event stream never records them, so that it stays
  free of paths and environment.

## Two Claims

The format keeps two claims separate, and a stream states its claim in
`session.claim`.

- **Frame playback** (`'frame-playback'`): the recorded frames can be shown
  again, in order, exactly as captured. Full `frame` events are sufficient.
- **Re-execution** (`'re-execution'`, reserved): the app's history can be run
  again and gives the same frames. This needs sufficient initial state, the
  recorded results of every effect and command, and every nondeterministic
  input (time, randomness, I/O). v1 records only the outcome class of
  commands and no initial model, so a v1 stream cannot support this claim.
  A later version that adds these facts can emit `'re-execution'`, and readers
  must not infer it from the presence of `input` events.

The recorded inputs in a v1 stream are evidence of what caused each frame.
They are not a promise that the frames can be reproduced from them.

| Dependent | Claim it supports |
| --- | --- |
| #600 ReplayOutbox | Neither. It is transport: order, validation, serialization. |
| #602 `runScript()` emission | Frame playback. It also records inputs as causal evidence. |
| #605 `recordDemoGif()` subscriber | Frame playback, exported to layer (d). |
| #607 Fixture | Frame playback only. A stable GIF hash checks captured frames under fixed rasterizer options and encoder version. It proves neither universal pixel equivalence nor re-execution. |

## Contracts For Dependents

### #600 ReplayOutbox

- Lives in `@flyingrobots/bijou-node`. Exposes `append({ tick, atMs, kind,
  payload })`, assigns `seq` starting at 0, and adds `schema`.
- Validates plain data deeply at append time and throws on any value listed
  as rejected above. Validation happens before `seq` is used, so a rejected
  append leaves no gap.
- Two modes: in-memory (`events()` and `toJSONL()`) and file-backed (appends
  lines to a path). Both use one canonical serializer, so the output is
  byte-identical.
- An empty session (only `session` and `end`) is valid.
- Provides `canonicalJson(value)` and `surfaceFrameHash(frame)` for #602 and
  #605 to share. Implements no ordering logic other than append order.

### #602 runScript emission

- `RunScriptOptions` gains an optional `replay` sink (structural, so
  `bijou-tui` does not import `bijou-node`) and an optional `replayLabel`.
  Without it, behaviour and frames do not change.
- Places replay setup and `app.init()` within the recording failure boundary.
  Emits `session` before invoking `init()`, then frame 0 and init command
  starts. Delivered messages follow Ordering Rules 2 to 5; `end` is last.
- A replay validation, serialization or append failure is sticky: retain the
  first failure, stop further replay deliveries, and reject the recording
  call. Do not rely on throwing inside a bus subscriber: current
  `eventbus-report.ts` catches subscriber exceptions, and command failures
  also have a reporting path. The replay-aware driver must surface the saved
  failure across those boundaries and interrupt its wait for `drain()` if
  necessary. This requirement changes only the opt-in recording path.
- On a failed recording, append `end` with `reason: 'error'` only if the
  session was written and the sink can still accept it. If writing fails,
  preserve the partial artifact as incomplete and reject; never report a
  successful recording or fabricate a completed stream. No error text is
  added to the artifact. With no replay sink, existing error/drain behavior
  remains unchanged.
- Builds `frame` payloads from the same Surface passed to `onFrame`, and copies
  the cell facts at once (apps may reuse one Surface).
- Writes `session.claim: 'frame-playback'`.
- Does not change `drain()` semantics.
- Tests: golden JSONL for a small app on a mock clock with `pulseFps: false`;
  two runs satisfying all deterministic prerequisites are byte-identical;
  command-origin input/resize/pulse retain their ordinals; synchronous nested
  emissions preserve invocation order; a non-plain custom message or a sink
  failure inside a subscriber rejects the recording; init failure and a
  failed error-end append remain failures; detached late emissions cannot
  append after `end`; a run without a sink is unchanged.

### #605 recordDemoGif as a subscriber

- Adds a path that takes a replay stream (an event list or JSONL text) and
  writes a GIF with no app and no terminal: decode each `frame` event into a
  Surface, check its `hash`, and pass the frames to `writeSurfaceGif()`.
- One GIF frame per `frame` event, in `seq` order. Size is the largest frame,
  as today. Frame delay comes from `frameDelayMs`, not from `atMs`, so the
  legacy golden still matches.
- `recordDemoGif(spec)` keeps its signature. It records through an in-memory
  outbox and renders from the stream, retaining the spec's `cellWidth`,
  `cellHeight`, `foreground`, `background` and `frameDelayMs` options.
- Frame facts determine cell playback, not unique GIF bytes. Rasterizer
  options and encoder version also determine those bytes. The v1 JSONL does
  not embed an export configuration; replay callers supply it.
- A stream without `frame` events fails with the same error as an empty frame
  list today. A hash mismatch fails, and the frame is not skipped.

### #607 Fixture

- Checks in one replay JSONL fixture made by #602 from a small app (mock
  clock, script pulses, at least one key, one resize and one command-emitted
  message), plus the expected `sha256` of the GIF bytes.
- The test uses the fixture as its only app/run data, renders through #605,
  and compares the hash. It does not import the app. It fixes rasterizer
  options explicitly and uses the lockfile-pinned encoder version; the hash
  is scoped to that configuration, not arbitrary consumer defaults.
- A second test checks that the fixture is canonical: parse and re-serialize
  each line and compare bytes.
- If the GIF encoder changes its output bytes, update the expected hash in the
  same change and give the reason. The fixture JSONL stays the same.

## Non-Goals

- Live terminal recording, a WARP TTD adapter, video encoders, or pixel
  equivalence across terminal, browser and Geordi targets.
- Changing how `runScript()` drains commands.
- Recording `update` or `effect` internals.

## Accessibility And Assistive Posture

Frame events record cells, not pixels, so a replay can also be lowered to text
for the `accessible` output mode. v1 does not add that consumer.

## Localization And Directionality Posture

Cells record the graphemes already rendered, so a localized run replays as it
was recorded. Frames are stored in visual order, as the Surface holds them.

## Agent Inspectability And Explainability Posture

JSONL with sorted keys and frame hashes is easy to compare with standard tools.
An agent can find the first frame where two runs differ without rendering any
pixels.
