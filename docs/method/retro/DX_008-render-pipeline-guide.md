---
title: DX-008 — Render Pipeline Documentation Guide
lane: retro
legend: DX
---

# DX-008 — Render Pipeline Documentation Guide

## Disposition

Published docs/guides/render-pipeline.md covering the fixed render stage order, default runtime wiring, RenderState lifecycle, configurePipeline semantics, and current limitations. Linked the guide from the bijou-tui README, the repo docs map, and the bijou-tui advanced guide, and corrected the stale `Post-Process` stage spelling in the advanced guide example.

## Original Proposal

Legend: [DX — Developer Experience](../legends/DX-developer-experience.md)

## Problem

The render pipeline (Layout → Paint → PostProcess → Diff → Output)
is a powerful extension point but has zero documentation beyond type
definitions. `configurePipeline` appears in RunOptions but there is
no guide showing how to write middleware, what RenderState fields are
available, or how stages interact.

The perf-gradient demo proved this gap — we could not instrument the
pipeline from outside to measure per-stage timing.

## Desired outcome

A guide at `docs/guides/render-pipeline.md` covering:

1. The five render stages and what each does
2. How to write a custom RenderMiddleware (worked example)
3. RenderState fields and their lifecycle
4. How configurePipeline interacts with default stages
5. Limitations (sync-only, no stage replacement, no timing hooks)

Link from the bijou-tui README's "Building Blocks" section.

## Effort

Medium — requires explaining internal architecture to external
audience.
