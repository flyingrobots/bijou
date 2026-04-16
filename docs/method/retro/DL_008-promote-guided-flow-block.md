---
title: DL-008 — Promote Guided Flow Block
lane: retro
legend: DL
---

# DL-008 — Promote Guided Flow Block

## Disposition

Implemented on release/v4.5.0 by adding the reusable guidedFlow() block in @flyingrobots/bijou, refactoring explainability() onto the same guided-flow rhythm, proving the block in DOGFOOD, and capturing the work in the DL-008 cycle doc. This is now completed design-language work, not live backlog.

## Original Proposal

Legend: [DL — Design Language](../legends/DL-design-language.md)

## Idea

DL-007 promotes the inspector family into a real TUI block helper through `inspectorDrawer()`.

The next natural follow-on is to do the same kind of promotion work for the guided-flow side of the design language.

That likely means deciding whether `explainability()` is still just a component seam, or whether Bijou is ready for a higher-level guided-flow block that standardizes:

- section rhythm
- next-action treatment
- shell/workflow ownership
- calmer multi-step assistance patterns

## Why

The design-system blocks guide treats `Guided flow` as one of the first credible block candidates.

Inspector promotion should not strand guided-flow work one layer lower forever.

## Status

Backlog spawned by the retrospective for DL-007.
