# The Buffer Holds Facts

Buffers, queues, and message channels should carry facts about what happened or
what should happen next. They should not carry executable behavior.

## Meaning

Good buffered values look like:

- `{ type: 'quit-requested' }`
- `{ type: 'notification-added', level: 'info', text: 'Saved' }`
- `{ type: 'frame-action', action: 'push-notification', notification }`

Bad buffered values look like:

- class instances with `apply()` or `run()` methods
- closures that capture ambient state and perform side effects later
- "smart" objects whose meaning only exists when executed

The rule is simple:

> the buffer should hold facts, not code

Interpretation belongs at the boundary that owns side effects.

## Why

Fact-shaped buffered values are:

- serializable
- inspectable
- loggable
- replayable
- testable without executing host effects

Behavior-shaped buffered values make the system harder to audit because the
meaning of the queue is hidden inside arbitrary executable code.

## Applies to

This invariant applies to:

- command buffers
- event channels
- queued frame actions
- cross-thread messages
- persisted or replayable runtime logs

It is especially important anywhere we may later want:

- diagnostics
- crash replay
- deterministic tests
- worker transport
- post-mortem inspection

## Does not mean

This invariant does **not** mean every internal helper must become data.

It does not apply to:

- direct hot-path loops where no queue/buffer boundary exists
- local strategy tables used only as implementation detail
- pure helper functions that never become buffered values

The rule is about what crosses a buffered or queued boundary, not about banning
functions from the codebase.

## Review questions

When adding a queue or buffered protocol, ask:

1. Could I print every buffered item as plain data and understand the system?
2. Could I serialize and replay this later?
3. Is the side-effect owner explicit and centralized?
4. Would a new engineer have to execute the object to learn what it means?

If the answer to the last question is yes, the design is probably violating
this invariant.

## Protected by

- [RE — Runtime Engine](../legends/RE-runtime-engine.md)
- [DX — Developer Experience](../legends/DX-developer-experience.md)
