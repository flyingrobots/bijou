---
title: DL-009 — Formalize Layout and Viewport Rules
lane: retro
legend: DL
---

# DL-009 — Formalize Layout and Viewport Rules

## Disposition

Implemented on `release/v5.0.0` as explicit doctrine. The new
[`docs/strategy/layout-and-viewport-rules.md`](../strategy/layout-and-viewport-rules.md)
note now captures the canonical ownership rules for whitespace, fill versus
placement, resize semantics, overflow, viewport ownership, and scrollbar truth.
Those rules are also wired into the architecture signposts so they are part of
the normal reading path instead of trapped in backlog prose.

## Original Proposal

Legend: [DL — Design Language](../legends/DL-design-language.md)

## Idea

Bijou has accumulated strong local layout instincts, but the rules are still implicit and scattered:

- how children fill or center within a parent rect
- when parents vs children own whitespace
- how panes stretch and shrink on terminal resize
- when overflow should wrap, clip, or move into a viewport
- how viewport ownership should align keyboard focus, mouse hit-testing, and scrollbars

This cycle should turn those instincts into one formal layout-language pass instead of leaving them as bug fixes and scattered notes.
