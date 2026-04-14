---
title: RE-014 — "The Buffer Holds Facts" Design Doctrine
lane: retro
legend: RE
---

# RE-014 — "The Buffer Holds Facts" Design Doctrine

## Disposition

Implemented on `release/v5.0.0` as an explicit invariant. The new
[`docs/invariants/buffer-holds-facts.md`](../invariants/buffer-holds-facts.md)
captures the rule that queues, buffers, and message channels should carry facts
rather than executable behavior, and the architecture signposts now point at
that invariant from the root, core, and TUI runtime docs.

## Original Proposal

Legend: [RE — Runtime Engine](../legends/RE-runtime-engine.md)

## Idea

During the RE-007 buffer migration, James articulated a principle:

> "Keep buffered shell commands as plain discriminated data and
> interpret them explicitly. Use a handler table if you want to
> avoid a giant switch. The buffer should hold facts, not code."

This is a design doctrine that should be captured in the runtime
engine's architectural documentation. It applies beyond shell
commands — any buffer, queue, or event channel in the system should
carry data (what happened) not behavior (how to respond).
