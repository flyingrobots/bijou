---
title: WF-002 — Migrate Legacy Planning Artifacts
lane: retro
legend: WF
---

# WF-002 — Migrate Legacy Planning Artifacts

## Disposition

Legacy planning entrypoints now identify themselves honestly: ROADMAP is reference-only, docs/specs is a frozen legacy spec archive with an explicit migration rule, docs/strategy now has a directory index separating living doctrine from historical notes, and the older strategy notes that overlap newer signposts now point readers back to the canonical surfaces.

## Original Proposal

Legend: [WF — Workflow and Delivery](../legends/WF-workflow-and-delivery.md)

## Idea

The new Legends/Cycles workflow is adopted, but older planning surfaces still exist:

- `docs/ROADMAP.md`
- `docs/specs/`
- older `docs/strategy/` notes that are not legend docs

This cycle would decide what gets:

- migrated
- frozen
- archived
- rewritten as backlog/design docs

## Why

WF-001 intentionally adopted the new process without trying to convert the entire repo in one shot.

That was the right call, but it leaves migration debt behind.

## Status

Backlog spawned by the retrospective for WF-001.
