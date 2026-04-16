# DX-018 — Runtime Test Harness for TEA Apps

Legend: [DX — Developer Experience](../../legends/DX-developer-experience.md)

## Problem

Testing nontrivial apps still leaks internal runtime knowledge. Async
commands, emitted messages, and lifecycle ordering can be tested today,
but the path often requires understanding `EventBus` details instead of
staying at the app boundary.

The 2026-04-11 code-quality audit called for a `testRuntime(app)`-style
helper that behaves like a first-class harness rather than a bag of
internal seams.

## Desired outcome

1. Provide a `testRuntime(app, options)` helper that returns a
   `TestHarness`.
2. Support assertions on state snapshots, emitted messages, command
   resolution, and teardown behavior without hand-wiring the bus.
3. Use it in at least one runtime-facing example or test so the public
   testing story is obvious.

## Effort

Medium — test API design plus migration of at least one real suite.
