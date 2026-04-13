# Render Pipeline Guide

This guide explains the programmable render pipeline in `@flyingrobots/bijou-tui`
as it exists today.

The runtime renders each frame in a fixed stage order:

1. `Layout`
2. `Paint`
3. `PostProcess`
4. `Diff`
5. `Output`

`configurePipeline()` lets you append middleware to those stages. It does not
replace the built-in stages, and it does not change their order.

## Default Runtime Wiring

`run()` builds the pipeline like this:

1. `Layout`
   Converts `app.view(model)` into a localized layout root for the current
   viewport.
2. `Layout`
   Applies the built-in motion middleware.
3. `Layout`
   Applies BCSS middleware when `options.css` is present.
4. `Paint`
   Paints the localized layout tree into `targetSurface`.
5. `Diff`
   Computes and writes the terminal delta via `renderSurfaceFrame(...)`.
6. `Output`
   Swaps the runtime front/back framebuffers for the next render.
7. `configurePipeline(pipeline)`
   Appends your middleware after those defaults.

That means your custom middleware runs in the fixed global stage order, and
within a stage it runs after the built-ins already registered for that stage.

## When To Hook Which Stage

- Use `Layout` when you need to inspect or annotate frame-level layout state
  before paint.
- Use `Paint` only if you need to participate in painting itself. This stage is
  not the calm default extension point.
- Use `PostProcess` when you want to mutate `targetSurface` after paint but
  before terminal diffing. This is the usual hook for visual effects,
  instrumentation marks, and last-mile surface edits.
- Use `Diff` only when you need to observe the frame after paint and after the
  default diff/write path has already run.
- Use `Output` when you need a terminal-tail hook after the built-in framebuffer
  swap step has been scheduled.

## Worked Example

This is the same pattern exercised by the runtime tests: mutate the painted
surface in `PostProcess` so the default diff stage emits the result.

```typescript
import { run } from '@flyingrobots/bijou-tui';

run(app, {
  configurePipeline(pipeline) {
    pipeline.use('PostProcess', (state, next) => {
      state.targetSurface.set(0, 0, { char: 'X', empty: false });
      next();
    });
  },
});
```

Because `configurePipeline()` appends after the defaults, this middleware runs
after `paintMiddleware()` and before the built-in `Diff` stage.

## RenderState

The public `RenderState` contract gives middleware these fields:

- `model`
  The application model for the frame being rendered.
- `ctx`
  The active `BijouContext`.
- `dt`
  Seconds since the previous frame.
- `currentSurface`
  The surface currently visible on the terminal. Treat this as read-only.
- `targetSurface`
  The surface being painted for this frame. `Paint` and `PostProcess`
  middleware are expected to work here.
- `outBuf`
  Optional pooled UTF-8 output buffer used by the default diff path.
- `layoutMap`
  Public layout metadata map. The default runtime allocates it, but the current
  built-in middleware does not populate it yet.
- `data`
  Shared per-frame scratch bag for middleware coordination.

## Important Internal Wrinkle

The built-in `Layout`, motion, BCSS, and paint middleware currently pass the
localized root through an internal `layoutRoot` scratch field that is not part
of the typed public `RenderState` contract.

Treat that as runtime implementation detail, not stable extension API.

If you need to share your own state between middleware, use `state.data`.

## configurePipeline Semantics

- `configurePipeline` is called once during `run()` setup, after the built-in
  middleware is registered.
- `pipeline.use(stage, middleware)` appends to that stage.
- Stage order is fixed. You cannot insert a new stage between `Paint` and
  `PostProcess`, for example.
- There is no public API for removing or replacing built-in middleware.

## Limitations

- The pipeline is effectively synchronous. Middleware may return a `Promise`,
  but the runtime does not await it in frame order.
- There is no public stage replacement hook, only stage append.
- The default `Diff` stage writes terminal output immediately. If you need to
  mutate frame visuals, do it in `PostProcess`, not `Diff`.
- Middleware failures are logged through `ctx.io.writeError(...)`, then the
  pipeline continues to the next middleware instead of crashing the whole run
  loop immediately.

## Read Next

- [Layout Localization Pipeline](../strategy/layout-localization-pipeline.md)
- [packages/bijou-tui/ADVANCED_GUIDE.md](../../packages/bijou-tui/ADVANCED_GUIDE.md)
