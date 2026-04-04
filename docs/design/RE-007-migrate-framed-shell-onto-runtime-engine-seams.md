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

Follow-on inside this same cycle:

- migrate shell routing onto retained layouts
- migrate shell command/effect dispatch onto runtime buffers
