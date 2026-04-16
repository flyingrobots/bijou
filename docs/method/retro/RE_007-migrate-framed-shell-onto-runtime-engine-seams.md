---
title: RE-007 — Migrate Framed Shell Onto Runtime Engine Seams
lane: retro
legend: RE
---

# RE-007 — Migrate Framed Shell Onto Runtime Engine Seams

## Disposition

Completed earlier and already shipped. The framed shell migration landed in the runtime-engine work that shipped in v4.2.0, and the current repo truth already reflects that through app-frame runtime routing/buffering code, release notes, BEARING, and COMPLETED.md. This METHOD backlog note was stale duplicate tracking.

Replacement: `docs/design/RE-007-migrate-framed-shell-onto-runtime-engine-seams.md`

## Original Proposal

Legend: [RE — Runtime Engine](../legends/RE-runtime-engine.md)

## Status

Promoted into the active cycle doc:

- [RE-007 — Migrate Framed Shell Onto Runtime Engine Seams](../../design/RE-007-migrate-framed-shell-onto-runtime-engine-seams.md)

## Idea

Move the current framed shell onto the new runtime-engine seams once the first-class objects exist.

## Why

The shell is where the current architectural debt is most visible:

- derived layer stacks
- branchy mouse routing
- mixed layout and routing concerns
- help/footer/control projection tied to shell-specific branches

## Likely scope

- migrate framed-app layers onto the explicit view stack
- migrate shell routing onto retained layouts
- migrate shell commands/effects onto the new buffers
- use the shell as the proving surface before broader runtime adoption
