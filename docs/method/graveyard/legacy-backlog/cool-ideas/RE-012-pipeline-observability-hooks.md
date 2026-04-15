# RE-012 — Pipeline Observability Hooks

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
- [DX-006](DX-006-debug-performance-overlay-component.md) from
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
