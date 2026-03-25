# Low-Allocation Renderer

_Design note for reusable framebuffers and a low-garbage hot render path_

## Why this exists

The DOGFOOD title screen made a real renderer truth visible:

- app-side title-screen work was slow enough to optimize
- terminal paint cost still dominates at very large window sizes
- even after the title-screen perf pass, the core runtime and surface stack still generate a lot of temporary garbage every frame

That means the next performance step is not another one-off screen optimization. It is renderer architecture.

The question is not:

> "Can we make this one shader faster?"

The real question is:

> "Can the Bijou runtime render rich full-screen surfaces without allocating a storm of temporary objects every frame?"

The answer is:

- **we can get much closer**
- **but not with the current runtime/surface hot path**

## Evidence

### DOGFOOD title-screen benchmark

At `220x58`, the optimized DOGFOOD title screen now benchmarks at:

- `3.39 ms/frame` for update + view + normalize
- `3.98 ms/frame` for update + view + normalize + diff/write into test IO

That is a major improvement over the earlier path:

- `12.27 ms/frame` before for update + view + normalize
- `11.81 ms/frame` before for update + view + normalize + diff/write

So there was real waste in the title screen itself, and it was worth removing.

### Allocation profile

The remaining problem is not retained memory. It is temporary churn.

Measured over `600` DOGFOOD landing frames at `220x58`:

- transient heap delta: about `6.6 MB`
- retained heap delta after forced GC: about `213 KB`

So this is **not a leak**. It is **temporary garbage production**.

### GC behavior

The trace confirms that the runtime is feeding the collector frequently:

- repeated minor scavenges
- at least one old-space mark-compact pause around `24 ms`

That is enough to matter for animation smoothness and pacing.

## The current bottlenecks

### 1. `Surface` is object-heavy by design

The current `Surface` API is ergonomic, but not cheap:

- `get()` returns masked cell copies
- `set()` writes through `applyMask(...)`, which returns a fresh `Cell`
- `clear()` replaces every cell object
- `clone()` deep-copies the whole surface
- `getRow()` allocates both arrays and masked cell copies

This is fine for a friendly public API. It is not fine for a hot renderer.

### 2. The runtime allocates a fresh target surface every frame

Today the runtime:

- allocates a new `targetSurface` for every render
- diffs it against `currentSurface`
- then clones the target into `currentSurface`

That means the frame loop is paying for:

- one full-surface allocation
- one full-surface clone

on every frame, even before terminal paint cost is considered.

### 3. The diff path allocates while reading cells

`renderDiff(...)` currently walks the grid through `surface.get(...)`.

That means the diff hot loop allocates just to inspect cells. It also:

- builds temporary token objects
- builds `batchText` strings
- builds a growing `output` string

Some string allocation is unavoidable in an ANSI renderer. The per-cell object churn is not.

### 4. The style layer is string-oriented

The Node style adapter ultimately produces styled strings. That is expected, but it means the final bridge to the terminal will never be literally zero-allocation.

So the goal should be:

- **near-zero-allocation in the hot render loop**
- not a fantasy of zero allocation everywhere

## The decision

Bijou should pursue a **low-allocation renderer**, not promise a literally zero-allocation runtime.

The design decision is:

1. keep the current `Surface` API as the ergonomic public composition model
2. stop treating that API as the final hot-path framebuffer contract
3. introduce reusable framebuffers and direct-cell diffing in the runtime
4. move toward a dedicated internal mutable render buffer if the first stage proves worthwhile

In short:

> `Surface` remains the authoring/composition type.  
> The runtime grows a lower-allocation framebuffer path underneath it.

## Non-goals

This effort does **not** mean:

- rewriting the whole design system around typed arrays immediately
- removing all object allocation from every part of Bijou
- breaking the public `Surface` API in the first slice
- optimizing away terminal-emulator paint costs that live outside Bijou

Those would blur the work and make it much riskier than it needs to be.

## Principles

1. **Fix the hot path first**
   We should remove runtime/framebuffer churn before inventing a whole new render substrate.

2. **Preserve public ergonomics**
   App authors should not need to think in framebuffers just to build normal components.

3. **Make each step benchmarkable**
   Every stage should have before/after benchmarks and GC observations.

4. **Tests are the spec**
   Runtime, diff, and resize behavior must stay covered while the internals change.

5. **Avoid premature big-bang rewrites**
   The first slice should be a contained runtime improvement, not a wholesale new rendering engine.

## Proposed architecture

### Stage 1 — Runtime framebuffer reuse

Replace the current per-frame target allocation and post-diff clone with a double-buffer model:

- allocate `frontBuffer` once per viewport size
- allocate `backBuffer` once per viewport size
- render into the back buffer
- diff front vs back
- swap references

This removes the largest guaranteed per-frame allocations without changing public component APIs.

### Stage 2 — Direct-cell diff fast path

Teach `renderDiff(...)` to read cells directly from `surface.cells` in the hot loop instead of calling `surface.get(...)`.

That should eliminate:

- masked read allocations
- extra per-cell object copying during diff

It also creates a clearer path to style-run caching later.

### Stage 3 — Mutable/internal render buffer

If stages 1 and 2 are not enough, add an internal runtime type such as:

- `FrameBuffer`
- `MutableSurface`
- or `RenderSurface`

This type should:

- mutate cells in place
- support clear/fill/blit without per-cell object replacement
- expose direct array access for diffing

This is the likely bridge between the public `Surface` model and a truly lean renderer.

### Stage 4 — Packed style and glyph data

Longer-term, the renderer can move toward:

- compact style ids
- bitflags for modifiers
- glyph/string lookup tables
- packed arrays instead of per-cell object shapes

This is where the renderer starts behaving more like a real framebuffer instead of a grid of JS objects.

### Stage 5 — ANSI emission optimization

Once the buffer model is leaner, improve the terminal bridge itself:

- cache style runs
- reduce repeated SGR construction
- avoid unnecessary string concatenation churn
- write larger coherent chunks

That still will not be literal zero-allocation, but it will be much closer to the practical lower bound for ANSI output.

## Scope for the next implementation slice

### In scope

- reusable front/back surfaces in the runtime
- no per-frame `targetSurface = createSurface(...)`
- no per-frame `currentSurface = targetSurface.clone()`
- direct-buffer swap on successful output
- benchmarks and runtime tests proving equivalence

### Out of scope

- a new public `Surface` API
- packed typed-array cells
- changing component authoring patterns
- redesigning the style port
- terminal-specific output throttling or adaptive quality logic

## Acceptance criteria

The first slice should be considered successful if:

1. runtime behavior is unchanged from the app author's point of view
2. framebuffers are reused across steady-state renders
3. the per-frame allocation profile improves materially
4. render benchmarks and smoke suites stay green
5. resize behavior still replaces buffers correctly when dimensions change

## Open questions

1. Should the reusable back buffer be fully cleared each frame, or should some middleware rely on an already-empty surface contract that needs stronger enforcement?
2. Should the diff fast path be added to the existing `Surface` implementation, or should it be introduced only after a dedicated internal framebuffer exists?
3. How far can we push runtime reuse before the `Surface` object model itself becomes the dominant remaining cost?

## Recommendation

Proceed immediately with **Stage 1: runtime framebuffer reuse**.

It is the highest-leverage improvement because:

- it removes unavoidable per-frame allocations already visible in the runtime
- it does not require a public API break
- it sets up every later optimization
- it is easy to validate with benchmarks and tests

After that, take **Stage 2: direct-cell diff fast path** before deciding whether Stage 3 needs a new internal buffer type.
