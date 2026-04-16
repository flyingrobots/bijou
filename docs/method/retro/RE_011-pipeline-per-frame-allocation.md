---
title: RE-011 — Eliminate Per-Frame Allocation in Render Pipeline
lane: retro
legend: RE
---

# RE-011 — Eliminate Per-Frame Allocation in Render Pipeline

## Disposition

Implemented on release/v4.5.0 by caching the flattened render middleware chain inside createPipeline(), marking it dirty only when use() mutates the stage registry, and covering cache reuse plus invalidation in pipeline tests. The per-frame chain allocation is no longer live backlog work.

## Original Proposal

Legend: [RE — Runtime Engine](../legends/RE-runtime-engine.md)

## Problem

`pipeline.execute()` in `packages/bijou-tui/src/pipeline/pipeline.ts`
allocates a new `chain[]` array every frame by spreading all stage
middleware into a flat list. At 60fps this is 60 array allocations
per second with no reuse.

## Fix

Cache the flattened chain array and only rebuild when middleware is
added (track a dirty flag on `use()`). The chain is static after
app initialization in most apps.

## Effort

Small — add a dirty flag and cached array.
