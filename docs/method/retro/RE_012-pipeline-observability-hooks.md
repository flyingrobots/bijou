---
title: RE-012 — Pipeline Observability Hooks
lane: retro
legend: RE
---

# RE-012 — Pipeline Observability Hooks

## Disposition

Completed on `release/v4.5.0`. The programmable render pipeline now exposes
`pipeline.onStageComplete(...)` observers, records per-stage timing samples in
`RenderState.data`, and ships `getRenderStageTimings(state)` as the typed read
path for middleware and apps. Stage timings are emitted in global stage order,
include empty stages as zero-duration samples, and are visible both through the
observer callback and the shared per-frame metadata bag.

## Original Proposal

Legend: [RE — Runtime Engine](../../legends/RE-runtime-engine.md)

## Idea

Expose per-stage timing hooks in the render pipeline so apps and
middleware can measure Layout, Paint, PostProcess, Diff, and Output
phases individually.

```typescript
run(app, {
  configurePipeline(pipeline) {
    pipeline.onStageComplete((stage, durationMs) => {
      perfOverlay.recordPhase(stage, durationMs);
    });
  },
});
```

## Why

The perf-gradient demo proved that 92% of frame time is spent in the
pipeline (diff + ANSI encode + stdout.write), but we could not
measure the breakdown from the app side. `configurePipeline` can
only append middleware after the default stages — it cannot wrap
them for timing.

This blocks:
- [DX-006](../../retro/DX_006-debug-performance-overlay-component.md) from
  showing a full phase breakdown
- Any app from diagnosing whether their bottleneck is layout, paint,
  or diff

## Shape

Either:
1. A callback-based hook (`onStageComplete`) on the pipeline
2. Timing metadata added to `RenderState.data` by the pipeline
   itself
3. A `wrapStage(stage, fn)` API that lets middleware run before AND
   after a stage's default middleware

Option 3 is the most general but also the most complex.
