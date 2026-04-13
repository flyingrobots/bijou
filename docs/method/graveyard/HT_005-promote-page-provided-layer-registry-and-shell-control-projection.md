---
title: HT-005 — Promote Page-Provided Layer Registry and Shell Control Projection
lane: graveyard
legend: HT
---

# HT-005 — Promote Page-Provided Layer Registry and Shell Control Projection

## Disposition

Landed in `release/v4.5.0`. `createFramedApp()` now lets pages publish a
bounded layer registry for `workspace` and `page-modal` metadata through
`FramePage.layers(model)`, and the frame exports `projectFrameControls()` so
footer/help/tooling all consume the same active-layer, underlying-layer, footer
hint, and help-source projection. The shell still owns shell layers like
settings, help, notifications, search, and quit confirm, but page-owned layer
metadata is no longer limited to the older `modalKeyMap` seam.

## Original Proposal

Legend:

- [HT — Humane Terminal](../legends/HT-humane-terminal.md)

Depends on:

- [HT-004 — Promote Explicit Layer Objects and Richer Shell Introspection](../design/HT-004-promote-explicit-layer-objects-and-richer-shell-introspection.md)

## Goal

Go beyond derived shell/page layer objects and promote a page-provided layer registry plus richer agent-facing control projection.

## Why this is on the backlog

HT-004 should make the current shell layers much richer, but it still stops short of a true page-provided layer model.

This follow-on should explore:

- page-defined layer objects beyond `modalKeyMap`
- explicit control-projection surfaces for humans and agents
- richer shell introspection than active/underlying layer helpers
- a cleaner path from layer objects to footer, help, and automation/tooling surfaces
