# RE-021 — Frame Owns the Pump

Legend: [RE — Runtime Engine](../../legends/RE-runtime-engine.md)

## Idea

Invert the runtime/frame relationship so `createFramedApp` owns the
render loop, timing, and frame budget — not just the TEA model/view
mapping. The frame becomes the "batteries included" entry point that
handles everything: input acquisition, update dispatch, view rendering,
diffing, performance measurement, and frame budget management.

Raw `App` + `run()` stays as the low-level TEA contract for users who
want full control. The framed app is the path for everyone else.

## Completed (2026-04-14)

Landed on `release/v5.0.0` as a composition-based runner instead of a
runtime fork. `createFramedApp()` now returns a self-running framed shell
with `app.run(...)`, `runFramedApp(...)` provides the one-call hosted
entry point, and the framed runner delegates to the shared runtime while
folding committed pipeline timings back into the frame model.

Repo truth after the landing:

- `createFramedApp()` remains App-compatible for tests and wrappers, but
  now also owns the hosted runner path
- `runFramedApp(options, runOptions)` is the batteries-included shell
  entry point
- framed runners default mouse input on for retained shell hit-testing
- `FrameModel` now carries `frameTimeMs`, `viewTimeMs`, `diffTimeMs`,
  `frameBudgetMs`, and `frameOverBudget`
- the frame budget currently drives shell telemetry and view-state
  decisions; the shared runtime loop still owns diff/output execution
  through composition

Validation included targeted runtime/app-frame coverage, `npm run lint`,
`npm run docs:inventory`, and a full `npm run release:readiness` pass.

## Current architecture

```text
runtime (owns loop, surfaces, differ, IO)
  → App.update(msg, model)    ← frame returns [model, cmds]
  → App.view(model)           ← frame returns Surface
  → renderDiff(current, target, io, style)
```

The runtime owns timing and the differ. The frame is a plain `App`
that maps model → Surface. It has no visibility into render timing,
frame budget, or memory pressure.

## Proposed architecture

```text
FramedApp (owns loop, timing, perf stats, frame budget)
  → acquires input from IO
  → page.update(msg, model)
  → measures view() wall time
  → renderDiff with timing
  → perf overlay reads its own bookkeeping
  → frame budget: skip non-essential overlays if overrunning
```

## Why

- **Perf overlay is natural**: the frame knows render time, FPS, memory
  because it measures them. No message threading or capability injection.
- **Frame budget management**: the frame can skip expensive overlays,
  reduce animation fidelity, or batch notification renders when behind.
- **Simpler app authoring**: users write pages, not apps. The frame
  handles everything they'd otherwise copy from examples.
- **Pipeline observability**: update phase, view phase, diff phase, and
  output phase can all be timed and exposed — answering DX-006's open
  question about native phase timing.

## What stays the same

- `App` interface — unchanged, still the TEA contract
- `run(app)` — unchanged, still boots a raw TEA app
- Component APIs — unchanged, still pure functions
- `Scenario` interface — unchanged, bench harness still works

## What changes

- `createFramedApp` returns a self-running object while remaining `App`-compatible
- New entry point: `await framedApp.run({ ctx })` or `await runFramedApp(options)`
- The runtime's event loop, surface management, and differ invocation
  stay in the shared runtime, with the framed shell composing that engine
- Frame model gains timing fields: `frameTimeMs`, `viewTimeMs`, `diffTimeMs`
- Built-in perf overlay becomes trivial (reads frame's own timing state)

## Open questions

- Should the framed app delegate to `run()` internally (composition) or
  replace it (fork)? Composition is safer but may over-abstract.
- How does the dogfood app's landing page (custom `App` wrapping a
  `FramedApp`) work? It currently calls `explorer.update()` and
  `explorer.view()` directly.
- Should frame budget management be automatic or opt-in?
- Test story: framed apps currently test via the `App` interface. If
  the frame owns the loop, testing needs a different harness.

## Related

- [DX-006 Debug Performance Overlay](../../retro/DX_006-debug-performance-overlay-component.md) — becomes trivial once the frame owns timing
- RE-017 byte pipeline — the zero-alloc differ stays, frame just orchestrates it
- The soak runner rewrite (this session) proved the framed app pattern works well for real apps
