# Layout Localization Pipeline

_Strategy note for how Bijou turns `LayoutNode` trees into local render roots_

## Why this exists

The `LayoutNode` path in `@flyingrobots/bijou-tui` is easy to use from the app
side, but the runtime ownership model is easy to misunderstand.

The important distinction is:

- **layout localization** decides what coordinate space the tree owns
- **paint** only blits already-positioned surfaces into a target surface

If those two stages get blurred together, it becomes difficult to reason about:

- negative coordinates and off-origin roots
- where width and height are measured
- when layout is recomputed
- where retained-layout reuse should fit later

This note exists to make that path explicit.

## The current runtime path

For a TUI render driven by `run(...)`, the flow is:

1. `app.view(model)` returns either a `Surface` or a `LayoutNode`.
2. `wrapViewOutputAsLayoutRoot(...)` converts the view output into a runtime
   `layoutRoot`.
3. If the output was a `LayoutNode`, `localizeLayoutNode(...)` shifts the whole
   tree into a local non-negative coordinate space.
4. Layout-stage middleware such as motion and BCSS operate on that localized
   root.
5. The paint middleware blits `node.surface` values into the target surface at
   the node's already-localized `rect.x` / `rect.y`.
6. Diff and output stages serialize the target surface to terminal bytes.

The relevant seams today are:

- `packages/bijou-tui/src/view-output.ts`
- `packages/bijou-tui/src/layout-node-surface.ts`
- `packages/bijou-tui/src/runtime.ts`
- `packages/bijou-tui/src/pipeline/middleware/paint.ts`

## Coordinate spaces

There are three distinct coordinate spaces in play.

### 1. Author space

This is the coordinate space returned by `app.view(model)`.

In author space:

- a root node may start at negative `x` or `y`
- siblings may be positioned relative to a parent origin that is not `(0, 0)`
- the bounds of the full tree may extend outside the root node's own rect

That is legal input. The runtime does not require app authors to hand-normalize
it.

### 2. Local root space

This is the coordinate space owned by the runtime pipeline.

`localizeLayout(...)` recursively measures the tree bounds and computes:

- `width = maxX - minX`
- `height = maxY - minY`
- `dx = -minX`
- `dy = -minY`

`localizeLayoutNode(...)` then translates the whole tree by `(dx, dy)` so the
localized root and every descendant sit in a non-negative local coordinate
space.

The important rule is:

> Paint should never have to rediscover where the root begins.

By the time the pipeline reaches paint, the root already owns a local origin.

### 3. Target-surface space

This is the actual framebuffer for the current render.

The target surface may be larger than the localized tree because the runtime
normalizes to at least the current viewport size:

- `width = max(viewport.width, localized.width)`
- `height = max(viewport.height, localized.height)`

That means localization decides the tree's own bounds, while normalization
decides the backing framebuffer size.

## Localization is not paint

Localization and paint are separate responsibilities.

### Localization does:

- recursive bounds measurement
- ownership of root translation
- conversion from author coordinates to local runtime coordinates
- reporting the minimal localized width and height

### Paint does:

- walk the already-localized tree
- blit `node.surface` into the target surface
- trust the rects it is given

The paint middleware in `packages/bijou-tui/src/pipeline/middleware/paint.ts`
is intentionally simple because localization already happened upstream.

If paint ever needs to reason about negative roots, accumulated offsets, or
tree rebasing, the ownership boundary has already been violated.

## The recursion model

`measureLayoutBounds(...)` and `paintLayoutNodeWithOffset(...)` are both
recursive, but they solve different problems.

### Bounds recursion

`measureLayoutBounds(...)` walks the whole tree and accumulates:

- smallest `x`
- smallest `y`
- largest `x + width`
- largest `y + height`

This is the phase that determines the translation and final localized size.

### Paint recursion

`paintLayoutNodeWithOffset(...)` or the paint middleware then walks the tree
again and blits node surfaces into the already-sized target surface.

That recursion is intentionally dumb:

- no geometry solving
- no bounds discovery
- no re-localization

It is only applying the results of earlier layout ownership.

## When layout is recomputed today

In the base `run(...)` runtime, layout localization is recomputed on every
render.

That happens because the Layout stage does this every frame:

1. call `app.view(model)`
2. call `wrapViewOutputAsLayoutRoot(...)`
3. store the result on `state.layoutRoot`

So today there is no shared retained-layout cache inside the generic runtime
render path.

Other paths follow the same basic rule:

- `normalizeViewOutput(...)` recomputes localization when a scripted driver or
  test harness needs a `Surface`
- `wrapViewOutputAsLayoutRoot(...)` recomputes localization when the pipeline
  needs a runtime-owned root tree

That is correct today, but it is not the final word on performance.

## Where retained layouts fit

Bijou already has retained-layout primitives in `runtime-engine.ts`, and the
framed shell uses retained trees for input routing and hit testing.

The important current truth is:

- **retained layouts exist**
- **the generic render pipeline does not yet retain and reuse `layoutRoot`**

So retained layout work should not be described as if the base runtime already
paints from a persistent layout cache.

The likely future fit is:

1. `view(model)` produces a logical tree in author space
2. localization establishes a runtime-owned local root
3. that localized root becomes the retained artifact
4. invalidation determines when it must be rebuilt
5. paint and hit testing both consume the same retained localized tree

The key design pressure is consistency. A future retained-layout system should
not make paint use one coordinate contract while hit testing uses another.

## Rule of thumb

If you are working in this area:

- treat localization as the handoff from author coordinates to runtime
  coordinates
- keep paint dumb
- keep target-surface sizing separate from tree localization
- describe retained layouts as a future reuse seam unless you are explicitly in
  the shell/runtime-engine retained-layout code

## Read this with

- `packages/bijou-tui/src/view-output.ts`
- `packages/bijou-tui/src/layout-node-surface.ts`
- `packages/bijou-tui/src/runtime.ts`
- `packages/bijou-tui/src/pipeline/middleware/paint.ts`
- `packages/bijou-tui/src/runtime-engine.ts`
- `packages/bijou-tui/ARCHITECTURE.md`
- `packages/bijou-tui/ADVANCED_GUIDE.md`
