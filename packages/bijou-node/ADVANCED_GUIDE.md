# Advanced Guide — @flyingrobots/bijou-node

Use [GUIDE.md](./GUIDE.md) for the common bootstrap path.

Use this guide when you are working on explicit context ownership, custom
adapter wiring, worker-thread runtime flows, recorder/capture workflows, or the
Node boundary between the pure packages and the real terminal process.

## Context Ownership

There are two distinct paths:

- `initDefaultContext()` when you want a convenient ambient default
- `createNodeContext()` when you want explicit ownership and explicit passing

Advanced rule of thumb:

- use the default only when the app really wants a shared ambient context
- prefer explicit `ctx` ownership when multiple surfaces, shell theme changes,
  or tests need deliberate context propagation
- do not let Node concerns leak back into the pure packages just because the
  process boundary is nearby

Read:

- [GUIDE basic setup](./GUIDE.md#basic-setup)
- [GUIDE custom context](./GUIDE.md#custom-context)
- [README](./README.md)

## Adapter-Level Construction

The individual Node adapters exist for cases where you need more than the
one-line bootstrap:

- `nodeRuntime()`
- `nodeIO()`
- `chalkStyle()`

That is the right lane for:

- custom process integration
- alternate lifecycle ownership
- explicit resize or stdin handling
- testing or debugging the process boundary itself

Read:

- [GUIDE individual adapters](./GUIDE.md#individual-adapters)
- [monorepo architecture guide](../../docs/ARCHITECTURE.md)

## Worker Runtime

Worker support belongs in `bijou-node`, not in the pure core or the TUI
package.

Use this lane when:

- update work is heavy enough to block the TTY thread
- you need a structured main-to-worker channel
- the worker should emit structured messages back into the app loop

Start here:

- [worker runtime spec](../../docs/specs/worker-runtime.spec.json)
- [v3 worker example](../../examples/v3-worker/README.md)
- [worker example source](../../examples/v3-worker/main.ts)
- [worker runtime implementation](./src/worker/worker.ts)

## Recorder And Capture Workflows

`bijou-node` also owns the native capture side of the terminal boundary.

That is the lane for:

- scripted surface capture
- turning recorded surface frames into GIF demos
- proving runtime behavior visually without hand-driving the terminal every time

Read:

- [v3 worker recorder example](../../examples/v3-worker/record.ts)
- [README feature summary](./README.md)

## Environment And Mode Forcing

The fast path explains the common environment variables. The advanced concern is
when to force or inspect them deliberately:

- `CI=true` to validate static lowering
- `TERM=dumb` or non-TTY output to validate pipe-safe behavior
- `NO_COLOR` to verify styling boundaries
- `BIJOU_ACCESSIBLE=1` to validate accessible lowering

Use Node-layer setup when you need deterministic runtime facts rather than
ambient process guessing.

## Boundary Rule

Keep the split clean:

- `@flyingrobots/bijou` owns pure rendering and prompt logic
- `@flyingrobots/bijou-tui` owns the fullscreen runtime
- `@flyingrobots/bijou-node` owns the actual process, terminal, worker, and
  recorder boundary

If a change starts depending on `process`, `readline`, Chalk, worker threads, or
terminal capture, it belongs here rather than in the pure packages.
