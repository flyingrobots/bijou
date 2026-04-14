---
title: "RE-026 — Drain runtime commands before shutdown"
legend: RE
lane: asap
---

# RE-026 — Drain runtime commands before shutdown

The runtime still exits without awaiting `bus.drain()`, which leaves async
command cleanup timing less deterministic than it should be.

## Problem

`packages/bijou-tui/src/runtime.ts` tears down the session and disposes the bus
after quit, but it does not explicitly wait for pending command work to drain.
`packages/bijou-tui/src/eventbus.ts` already exposes `drain()`, and the driver
uses it, but the production runtime does not.

This creates a gap between test/runtime semantics:
- tests can wait for pending command work deterministically
- the real runtime can dispose while cleanup work is still in flight

## Desired outcome

1. Make runtime shutdown await `bus.drain()` before final disposal.
2. Keep shutdown bounded with a timeout or other guard so the app cannot hang
   forever on a misbehaving command.
3. Add focused tests for long-lived commands that register cleanups
   asynchronously.
4. Preserve the current fast path for already-idle apps.

## Why ASAP

- This is one of the last concrete ship-readiness concerns left after the
  release gauntlet turned green.
- The code already has most of the needed primitives; the gap is mostly runtime
  integration and proof.

## Hill

Quit semantics are deterministic: pending commands either drain cleanly before
teardown or fail through one explicit, observable timeout path.
