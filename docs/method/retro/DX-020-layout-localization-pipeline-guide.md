---
title: "DX-020 — Layout Localization Pipeline Guide"
legend: DX
lane: retro
---

# DX-020 — Layout Localization Pipeline Guide

Completed on `release/v5.0.0`. The dedicated strategy note now lives at
`docs/strategy/layout-localization-pipeline.md`, and the advanced/runtime docs
link to it from `packages/bijou-tui/ARCHITECTURE.md`,
`packages/bijou-tui/ADVANCED_GUIDE.md`, and `docs/guides/render-pipeline.md`.
The repo now has an explicit deep guide for localization vs painting,
coordinate accumulation, and retained-layout fit.

## Original Proposal

Legend: [DX — Developer Experience](../legends/DX-developer-experience.md)

## Problem

The layout/localization path around `layout-node-surface.ts` is
important to both performance and correctness, but the repo does not
yet have a dedicated strategy doc explaining:

- localization vs painting
- how offsets accumulate
- when layout is recomputed
- where retained-layout work would fit

The 2026-04-11 documentation audit called this out as a missing deep
guide for advanced users and maintainers.

## Desired outcome

1. Write a dedicated strategy doc for the layout-localization pipeline.
2. Explain the recursion model, coordinate spaces, and relationship
   between localization and paint/output stages.
3. Link it from the advanced guide and relevant architecture docs.

## Effort

Small to medium — mostly documentation, but it may expose naming or API
cleanup opportunities along the way.
