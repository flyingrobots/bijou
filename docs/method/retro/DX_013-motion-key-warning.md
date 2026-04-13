---
title: DX-013 — Motion Key Lifecycle Warning
lane: retro
legend: DX
---

# DX-013 — Motion Key Lifecycle Warning

## Disposition

Shipped runtime warning for unstable motion key birth/death swaps in the motion reconciler, wired through the live runtime middleware, documented the stable-key rule, and covered the behavior with focused reconciler tests.

## Original Proposal

Legend: [DX — Developer Experience](../legends/DX-developer-experience.md)

## Idea

`motion({ key: 'id' }, ...)` requires a stable key to track
animation state across renders. If the key changes every render
(e.g., using an index that shifts), the motion system silently
creates new animations instead of interpolating. There is no warning.

Emit a runtime warning when a motion key appears for the first time
on a frame that also has a different key disappearing — this is a
strong signal that the developer is generating unstable keys.

## Why

The DX audit flagged this as a non-obvious behavior. The motion
system works correctly when keys are stable, but the failure mode
(new animation every render = no visible interpolation) looks like
"motion doesn't work" rather than "my key is wrong."

## Effort

Small — track key birth/death across frames in the motion middleware.
