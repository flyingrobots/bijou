# RE-007 — Migrate Framed Shell Onto Runtime Engine Seams

_Cycle for proving the runtime engine through the framed shell instead of leaving the most visible shell state on ad hoc branch structure_

Legend:

- [RE — Runtime Engine](../legends/RE-runtime-engine.md)

Depends on:

- [RE-001 — Define Runtime Engine Architecture](./RE-001-define-runtime-engine-architecture.md)
- [RE-002 — Promote First-Class State Machine and View Stack](./RE-002-promote-first-class-state-machine-and-view-stack.md)
- [RE-003 — Retain Layout Trees and Layout Invalidation](./RE-003-retain-layout-trees-and-layout-invalidation.md)
- [RE-004 — Route Input Through Layouts and Layer Bubbling](./RE-004-route-input-through-layouts-and-layer-bubbling.md)
- [RE-005 — Buffer Commands and Effects Separately](./RE-005-buffer-commands-and-effects-separately.md)
- [RE-006 — Formalize Component Layout and Interaction Contracts](./RE-006-formalize-component-layout-and-interaction-contracts.md)

## Sponsor human

A maintainer evolving the framed shell who needs to explain layer
ownership, routing, and command dispatch in runtime-engine terms instead
of tracing ad hoc branch order.

## Sponsor agent

An agent inspecting or testing the framed shell that needs to recover
runtime-backed view stacks, retained layout geometry, and buffered
command/effect truth through the same vocabulary the runtime engine
exposes everywhere else.

## Non-goals

- Rewriting shell rendering or visual output. This cycle migrates
  ownership and routing, not painting.
- Changing outward shell behavior. The shell should act the same after
  each slice; only the internal truth source changes.
- Migrating non-shell runtime consumers. Other runtime adopters are
  separate cycles.

## Accessibility / assistive reading posture

Not directly affected. This cycle changes internal ownership, not
user-facing output. Assistive reading contracts remain wherever the
shell already honors them.

## Localization / directionality posture

Not directly affected. Shell localization surfaces are unchanged by
this migration. Directionality remains the responsibility of the
rendering layer, which this cycle does not touch.

## Agent inspectability / explainability posture

Central to this cycle. Every slice must leave the shell's runtime
state inspectable through the same `RuntimeViewStack`,
`RuntimeRetainedLayouts`, and runtime buffer vocabulary that agents
already use for non-shell runtime work. The agent hill is the
primary proof surface.

## Why this cycle exists

The runtime engine now has explicit seams for:

- state machines
- view stacks
- retained layouts
- layout-driven input routing
- buffered commands and effects

But the framed shell still carries its own most visible runtime truths in older shell-local structures. The shell can already describe a layer stack, but that stack is still reconstructed as a plain descriptor array rather than living as a first-class runtime object.

This cycle exists to stop leaving the highest-visibility shell behavior outside the runtime engine. The shell should become the proving surface for the engine seams rather than the place where those seams get bypassed.

## Human users / jobs / hills

### Primary human users

- maintainers evolving the framed shell
- builders inspecting layered shell behavior
- contributors debugging shell routing, footer truth, and overlay ownership

### Human jobs

1. Inspect the shell's visible layers as a real runtime-backed stack.
2. Explain which shell layer is active and which layer sits underneath it without reverse-engineering branch order.
3. Move shell routing and command/effect dispatch onto the runtime seams in later slices without re-inventing shell-local state models.

### Human hill

A maintainer can point at the framed shell and explain its active layer stack in runtime-engine terms instead of saying “the shell works because these branches happen in this order.”

## Agent users / jobs / hills

### Primary agent users

- agents reading shell state to explain focus or overlay ownership
- agents writing tests around shell layering
- agents preparing later shell migration slices for routing and buffered shell work

### Agent jobs

1. Read the framed shell's view stack through the same `RuntimeViewStack` vocabulary used elsewhere in the runtime engine.
2. Distinguish the workspace root from dismissible overlays without re-deriving shell semantics.
3. Prepare later migration slices for retained-layout-driven shell routing and runtime-buffer-backed shell command/effect dispatch.

### Agent hill

An agent can inspect the framed shell and recover a root-based runtime view stack whose active layer, underlying layer, and blocking semantics match the shell's real behavior.

## Human playback

1. A workspace is open in a framed app.
2. The workspace is the root runtime view.
3. The user opens settings.
4. The shell pushes a dismissible settings overlay onto the runtime view stack.
5. The user opens search on top of settings.
6. The shell pushes a dismissible search overlay onto the same runtime view stack.
7. The active runtime view now truthfully describes the search layer, while the underlying view is still settings.
8. Footer hints and help surfaces can inspect that same stack instead of rediscovering shell state from separate branches.

## Agent playback

1. An agent inspects a framed shell model with settings and search open.
2. The agent asks for the shell's runtime-backed view stack.
3. The stack returns:
   - a non-dismissible workspace root
   - a dismissible settings overlay
   - a dismissible search overlay
4. The active runtime view reports the same metadata that shell help/footer introspection already uses.
5. The agent can now reason about shell overlay ownership with the same runtime vocabulary used by retained layouts and buffered runtime work.

## Linked invariants

- [Runtime Truth Wins](../invariants/runtime-truth-wins.md)
- [State Machine and View Stack Are Distinct](../invariants/state-machine-and-view-stack-are-distinct.md)
- [Topmost Layer Dismisses First](../invariants/topmost-layer-dismisses-first.md)
- [Layout Owns Interaction Geometry](../invariants/layout-owns-interaction-geometry.md)
- [Commands Change State, Effects Do Not](../invariants/commands-change-state-effects-do-not.md)
- [Tests Are the Spec](../invariants/tests-are-the-spec.md)

## First slice in this cycle

The first honest slice is not “rewrite the whole shell.” It is:

- make the framed shell layer stack a real `RuntimeViewStack`
- keep the existing `describeFrameLayerStack(...)`, `activeFrameLayer(...)`, and `underlyingFrameLayer(...)` helpers as compatibility surfaces
- expose a runtime-backed `describeFrameRuntimeViewStack(...)` helper so tests, humans, and agents can inspect the shell directly in runtime terms

This slice proves that the shell can adopt runtime-backed view ownership without changing outward shell behavior first.

## Implementation outline

1. Promote shell layer descriptors into runtime-backed view layers with stable ids, blocking semantics, dismissibility, and attached descriptor models.
2. Make the workspace the root runtime view.
3. Push page-modal, settings, help, notification-center, search/command-palette, and quit-confirm overlays onto the runtime stack in the shell's existing order.
4. Derive the legacy descriptor helpers from that runtime view stack instead of rebuilding plain arrays separately.
5. Export the runtime-backed helper through the public framed-app API and the package index.

## Later slices still in this cycle

- retained-layout-driven shell routing
- runtime-buffer-backed shell command/effect dispatch
- removing remaining shell-local branch structures that duplicate runtime ownership

## Tests to write first

- cycle test proving `RE-007` is now the active runtime-engine cycle
- app-frame regression proving the framed shell layer stack is now backed by `RuntimeViewStack`
- export regression proving the new helper is public through `@flyingrobots/bijou-tui`
- signpost regression proving `PLAN.md`, `BEARING.md`, and the RE legend stop treating `RE-007` like a backlog stub

## Risks / unknowns

- the shell still mixes routing, layout, and command/effect concerns, so this first slice must stay narrow instead of pretending the whole migration is done
- keeping the compatibility descriptor helpers is necessary now, but later slices should avoid duplicating runtime truth unnecessarily
- retained-layout-driven shell routing may want richer view metadata than the first runtime-backed stack carries here

## Retrospective

What this first slice lands:

- a runtime-backed shell layer stack
- a public `describeFrameRuntimeViewStack(...)` helper
- compatibility descriptor helpers derived from runtime truth
- signposts that say `RE-007` is active instead of merely queued

What this first slice does not land:

- no retained-layout-driven shell routing yet
- no runtime-buffer-backed shell command/effect dispatch yet
- no removal of every shell-local branch

What the second slice lands:

- route key ownership through the runtime view stack instead of
  choosing shell owners from ad hoc top-layer branches
- use retained shell drawer layouts so pointer ownership for settings
  and notification center comes from runtime hit-testing instead of
  drawer-specific inside/outside helpers alone

What the third slice lands:

- a workspace retained layout tree with header tab and pane children
  so sub-layer hit-testing uses the same retained layout infrastructure
- settings row children in the settings retained layout so row click
  resolution uses layout path inspection instead of scroll-offset math
- `paneHitAtPosition`, `settingsRowAtPosition`, and
  `isInsideSettingsDrawer` removed — all replaced by retained layout
  path inspection through `routedHit`
- `resolveWorkspacePaneRects` extracted as a shared pane geometry
  resolver for both the workspace layout tree and the mouse handler

What the fourth slice lands:

- `FrameShellCommand<Msg>` discriminated union in `app-frame-types.ts`
  covering every shell mutation and command emission as plain data facts
- a handler table inside `createFramedApp` that interprets each command
  variant through model mutation and TEA command accumulation
- `drainShellCommandBuffer` using `bufferRuntimeRouteResult` and
  `applyRuntimeCommandBuffer` to process route results
- mouse routing handler produces shell commands directly instead of
  delegating to a separate `handleFrameMouse` function
- key routing handler produces shell commands through per-layer helper
  functions (`handlePaletteLayerKeyCommands`,
  `handleSettingsLayerKeyCommands`, `handleWorkspaceLayerKeyCommands`,
  etc.) instead of a 280-line if-chain in `update()`
- `update()` key and mouse branches reduced to single-line buffer
  drains
- removed: `handleFrameMouse`, `withObservedKey`, `applyQuitRequest`,
  `observedRouteForLayer`, `applyHelpScrollAction`

What this cycle does not address:

- notification toast hit-testing stays outside the retained layout
  system (viewport-positioned overlays managed by notification.ts)
- FrameScopedMsg branches (timers, transitions, notification ticks)
  stay as special cases in update() — they are frame-owned state
  mutations, not routed input events

## Runtime-buffer-backed command/effect dispatch — design intent

This section captures the architectural intent for the final slice so it
is not lost across sessions.

### Current pattern

The shell's `update()` function has two separate steps:

1. **Routing**: `resolveRoutedKeyLayer()` / `resolveRoutedMouseLayer()`
   calls `routeRuntimeInput()` to determine which layer owns the input.
   The routing handler callback returns `{ handled: true }` or
   `{ stop: true }` — it never produces commands or effects.

2. **Command production**: After routing, the `update()` function
   matches on `routedLayer.kind` through a long chain of `if` branches,
   each producing `[model, Cmd<FramedAppMsg<Msg>>[]]` tuples with
   manually accumulated command arrays.

These are decoupled: routing decides ownership, then entirely separate
code produces commands. The runtime buffer API
(`RuntimeCommandBuffer`, `RuntimeEffectBuffer`, `bufferRuntimeRouteResult`,
`applyRuntimeCommandBuffer`) exists but the shell does not use it.

### Target pattern

Input is routed through the runtime view stack. Instead of routing
handlers returning bare `{ handled: true }`, they return commands and
effects as part of the route outcome:

```
routeRuntimeInput(stack, layouts, event, ({ layer, hit }) => {
  // Layer-specific command production happens HERE,
  // inside the routing callback
  return {
    handled: true,
    commands: [emitMsgForPage(pageId, action)],
    effects: [],
  };
});
```

The route result carries accumulated commands and effects from all
visited layers. The shell then buffers them:

```
const buffers = bufferRuntimeRouteResult(
  createRuntimeBuffers(),
  routeResult,
);
```

And applies them after routing completes:

```
const { state, applied } = applyRuntimeCommandBuffer(
  model,
  buffers.commands,
  applyCommand,
);
```

### Why this matters

- Routing and command production become one step instead of two. The
  layer that handles the input also says what should happen, inside the
  same callback.
- The long `if (routedLayer.kind === ...)` chain in `update()` moves
  into the routing handler, which already knows the layer context.
- Commands are collected through the same buffer mechanism the runtime
  engine uses for component-level input handling, instead of through
  ad-hoc array accumulation.
- Effects become a first-class channel. The shell currently has no
  explicit effect separation — everything is a command. The buffer API
  gives effects their own lane without changing the TEA return type.

### Scope

This is a structural refactoring of the shell's update function. It
touches ~20 functions across `app-frame.ts`, `app-frame-actions.ts`,
and `app-frame-palette.ts`. The change is repetitive but mechanical:
every `[model, cmds]` return site moves into a routing handler that
returns `{ handled: true, commands: [...] }`.

Outward shell behavior must not change. The same inputs must produce
the same model transitions and the same commands.

### Risks

- The routing handler closure becomes large because it absorbs all
  layer-specific logic. May need to extract per-layer handler functions
  to keep readability.
- The TEA `update()` return type (`[Model, Cmd[]]`) is consumed by
  the event bus. The buffer API produces `RuntimeBuffers`, which must
  be drained back into `Cmd[]` at the boundary. This is a seam, not a
  full TEA replacement.
- Key priority logic (`frame-first` vs `page-first`) currently lives
  outside routing. It needs to move into the routing handler or be
  resolved before routing begins.
