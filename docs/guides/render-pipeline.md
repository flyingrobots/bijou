# Render Pipeline Guide

The render pipeline in `@flyingrobots/bijou-tui` is a deterministic, stage-ordered execution chain.

It runs as:

1. `Layout`
2. `Paint`
3. `PostProcess`
4. `Diff`
5. `Output`

## Default Runtime Wiring

`run()` installs middleware in this fixed stage order:

1. `Layout`: call `app.view(model)` and produce the layout output.
2. `Layout`: apply motion reconciliation.
3. `Layout`: apply BCSS middleware when `options.css` is present.
4. `Paint`: paint the resolved layout tree into `targetSurface`.
5. `Diff`: compute terminal diff and fill `outBuf`.
6. `Output`: emit diff and swap framebuffers.
7. `configurePipeline(pipeline)` if provided by the caller.

Custom middleware runs after the built-ins in the same stage and cannot change stage ordering.

## Default and Custom Stage Contract

Use `configurePipeline()` when your middleware belongs to one of these five stages:

- `Layout`: inspect or rewrite `LayoutNode` trees.
- `Paint`: mutate `targetSurface` by painting extra marks directly.
- `PostProcess`: apply surface-wide shaders or instrumentation before diff.
- `Diff`: adjust output encoding just before emit (advanced usage).
- `Output`: run end-of-frame side-effects after terminal write and swap.

## Inter-Stage Data Contracts

A `RenderState` instance is shared across all middleware for a single frame. The key shared state channels are:

- `model`: current model value for this frame.
- `layoutMap`: geometry metadata for resolved nodes.
- `data`: unstructured scratchbag intended for middleware communication.

### `layoutRoot` via `RenderState.data`

In current runtime code, the `Layout` stage places the resolved layout tree in
`state.data['__bijou:layoutRoot']`.

That object is then consumed by `motionMiddleware()` and `paintMiddleware()` in
later stages.

Recommended access pattern for custom middleware:

- Read and write your own namespaced keys, for example:
  - `state.data['my-app:focusState']`
  - `state.data['my-app:trace:enabled']`

This avoids private runtime keys and avoids coupling across feature layers.

The built-in layout keys are intentionally not part of your public app contract.

### LayoutMap Semantics

`layoutMap` is currently populated with keyed geometry for internal systems such as
a11y overlays, layout debugging, and event routing.

If you need layout geometry from custom middleware, guard key lookups and treat
missing values as an expected pre-layout state.

## Framebuffer Flip Model (Current Surface Truth)

`Diff` compares:

- `state.currentSurface`: the previous visible surface
- `state.targetSurface`: the next surface under construction

After `Output` runs, the runtime flips the internal buffers.

The conceptual model is:

```text
before Output:   currentSurface is frame N, targetSurface is frame N+1
after Output:    currentSurface is frame N+1, targetSurface becomes previous frame N
```

That means middleware appended to `Output` after swap must not assume that `state.currentSurface` still points at the old frame unless it reads it before invoking default output semantics.

In practical terms:

- Use `currentSurface` for diff inputs and visibility of the previous frame.
- Use `targetSurface` as the paint target for the frame currently being built.
- Do not retain references across frames outside `Layout`/`Paint` middleware.

## Why the Pipeline Is Synchronous

The pipeline is synchronous by design to keep frame cost measurable and predictable.

If each stage can run with bounded synchronous cost, the frame time budget is:

```text
frameCost = layout + paint + postProcess + diff + output + middlewareOverhead
```

If an asynchronous stage is inserted without careful partitioning, total frame cost becomes:

```text
frameCost = layout + paint + postProcess + await(someAsyncIO) + diff + output
```

That removes a strict per-frame budget and can stall rendering on unrelated IO.

The architectural rule is therefore:

- Keep rendering synchronous and deterministic.
- Move async work into commands.
- Receive async results as messages, then update model and re-render.

## Worked Example

The runtime pipeline supports middleware insertion points that preserve the fixed stage ordering.

```ts
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

Because this middleware is registered before app execution, it runs on every frame after all built-ins for `PostProcess` and before default diffing.

## Timing Hooks

You can observe per-stage timings from middleware.

```ts
import { getRenderStageTimings, run } from '@flyingrobots/bijou-tui';

run(app, {
  configurePipeline(pipeline) {
    pipeline.onStageComplete((stage, durationMs, state) => {
      console.log(stage, durationMs);
      console.log(getRenderStageTimings(state));
    });
  },
});
```

Notes:

- `onStageComplete(...)` fires once per stage, in fixed stage order.
- `getRenderStageTimings(state)` returns timings captured for that frame.
- The timings array is replaced on every `pipeline.execute(state)` call.
- Empty stages are represented in timing output.

## `RenderState` Reference

The public shape is:

- `model`: read by convention in rendering.
- `ctx`: active `BijouContext`.
- `dt`: wall time delta in seconds.
- `currentSurface`: previous frame surface, normally treated as read-only.
- `targetSurface`: current frame paint surface.
- `outBuf`: optional UTF-8 output buffer for default diff stage.
- `layoutMap`: geometry metadata map.
- `data`: middleware coordination bag.

`data` is also where layout root and per-frame timing metadata are held.

## Stage Failure Semantics

A middleware exception does not kill the app immediately.

- The exception is routed through the same diagnostics path as other runtime faults.
- The frame may render partially or degrade for that tick.
- Rendering continues so the app remains recoverable and operational.

If your custom middleware must fail fast, emit a command or message to transition into an intentional error state during `update()`.

## Read Next

- [Layout Localization Pipeline](../strategy/layout-localization-pipeline.md)
- [packages/bijou-tui/ADVANCED_GUIDE.md](../../packages/bijou-tui/ADVANCED_GUIDE.md)
