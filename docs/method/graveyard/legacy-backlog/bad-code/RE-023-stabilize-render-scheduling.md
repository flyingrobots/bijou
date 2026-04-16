# RE-023 — Stabilize Render Scheduling in runtime.ts

Legend: [RE — Runtime Engine](../../legends/RE-runtime-engine.md)

## Idea

The current `render()` implementation in `runtime.ts` uses `setTimeout(..., 0)` and a `renderRequested` boolean. Under heavy input load or rapid async command resolution, this can lead to multiple overlapping render timeouts being scheduled if the boolean is reset at the wrong point in the microtask queue.

Refactor `render()` to use a single, stable `TimerHandle` (or a similar scheduling token) that is explicitly cleared and reset on every request. This ensures that only one render operation is ever pending or in flight at any given time.

## Why

1. **Determinism**: Ensures that the `view()` function always operates on the most current model snapshot.
2. **Performance**: Prevents redundant rendering work during high-frequency update bursts.
3. **Safety**: Neutralizes potential race conditions where front/back buffers might be swapped mid-render.

## Effort

Small — refactor the `renderRequested` logic to use a persistent `TimerHandle` from the context clock.
