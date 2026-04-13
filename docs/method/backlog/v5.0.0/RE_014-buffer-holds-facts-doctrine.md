---
title: RE-014 — "The Buffer Holds Facts" Design Doctrine
lane: v5.0.0
legend: RE
---

# RE-014 — "The Buffer Holds Facts" Design Doctrine

Legend: [RE — Runtime Engine](../../legends/RE-runtime-engine.md)

## Idea

During the RE-007 buffer migration, James articulated a principle:

> "Keep buffered shell commands as plain discriminated data and
> interpret them explicitly. Use a handler table if you want to
> avoid a giant switch. The buffer should hold facts, not code."

This is a design doctrine that should be captured in the runtime
engine's architectural documentation. It applies beyond shell
commands — any buffer, queue, or event channel in the system should
carry data (what happened) not behavior (how to respond).

## Why

The initial design proposed classes with `apply()` methods — each
command knowing how to execute itself. The correction was: commands
are facts about intent. Interpretation is separate. Facts are
serializable, testable, inspectable, replayable. Behavior is
contextual.

This principle:
- Enables command logging and replay for debugging
- Keeps the handler table as the single place to audit all side
  effects
- Makes the command vocabulary inspectable without executing anything
- Aligns with event-sourcing and CQRS patterns

## Shape

Add a section to `docs/ARCHITECTURE.md` or a dedicated
`docs/invariants/buffer-holds-facts.md` that states the principle
and explains when it applies (command buffers, event channels,
message queues) and when it doesn't (hot-path render loops where
indirection costs matter).
