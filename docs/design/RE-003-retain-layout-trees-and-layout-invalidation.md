# RE-003 — Retain Layout Trees and Layout Invalidation

_Cycle for turning layout from a transient render byproduct into an explicit retained runtime object_

Legend:

- [RE — Runtime Engine](/Users/james/git/bijou/docs/legends/RE-runtime-engine.md)

Depends on:

- [RE-001 — Define Runtime Engine Architecture](/Users/james/git/bijou/docs/design/RE-001-define-runtime-engine-architecture.md)
- [RE-002 — Promote First-Class State Machine and View Stack](/Users/james/git/bijou/docs/design/RE-002-promote-first-class-state-machine-and-view-stack.md)

## Why this cycle exists

RE-001 and RE-002 established that:

- the application owns explicit state
- the application owns an explicit view stack

But input routing, viewport ownership, and resize behavior still do not have one retained source of geometric truth.

Today, layout is still too easy to treat as a temporary rendering side effect.

This cycle exists to change that direction by landing a pure retained-layout seam that can answer:

- what layout tree belongs to each active view
- which retained layouts are stale
- why they became stale
- when stale layouts are replaced with newly retained geometry
- which layouts should disappear when views leave the stack

This is intentionally smaller than full layout-driven routing. It gives the runtime authoritative layout ownership before `RE-004` moves input over to it.

## Human users / jobs / hills

### Primary human users

- framework maintainers evolving the runtime
- builders working on modal, drawer, viewport, and pane-heavy apps
- shell authors who need layout ownership to stay stable as the visible stack changes

### Human jobs

1. Retain one layout tree per active view instead of recomputing geometry conceptually from scratch every time input arrives.
2. Mark layouts stale when resize, content, visibility, or overflow changes invalidate their geometry.
3. Drop layouts that no longer belong to the active view stack.

### Human hill

A human can point to one runtime object and answer which active views currently own retained geometry, which of those layouts are stale, and why.

## Agent users / jobs / hills

### Primary agent users

- agents inspecting runtime geometry during debugging
- agents generating view-stack tests and layout assertions
- agents preparing future routing work that depends on retained geometry

### Agent jobs

1. Read the retained layout tree for a specific view by stable id.
2. Determine whether a retained layout is still valid or is awaiting recomputation.
3. Tell whether a layout disappeared because the view was dismissed or because the geometry merely became stale.

### Agent hill

An agent can inspect retained layout state and answer which views have authoritative geometry and which invalidation causes are currently pending without inferring that from rendered frames.

## Human playback

1. A user is in a workspace root view with one retained layout tree.
2. The app opens a blocking modal and retains a second layout tree for that view.
3. The terminal is resized.
4. Both retained layouts are marked stale with a `terminal-resize` invalidation cause.
5. The runtime recomputes and re-retains the new layout trees.
6. Their stale flags clear, but their retained version numbers increase.
7. The modal is dismissed.
8. The modal layout disappears because its view is no longer in the active stack, while the workspace layout remains retained.

## Agent playback

1. An agent inspects the runtime while a workspace view and a help overlay are both active.
2. The retained-layout registry shows one layout for `workspace` and one for `help`.
3. A content change happens inside the help overlay.
4. The help layout is marked invalidated for `content-change`.
5. The workspace layout remains valid.
6. When the help overlay is dismissed, the retained-layout registry drops only the `help` layout because it is no longer part of the current view stack.

## Linked invariants

- [State Machine and View Stack Are Distinct](/Users/james/git/bijou/docs/invariants/state-machine-and-view-stack-are-distinct.md)
- [Layout Owns Interaction Geometry](/Users/james/git/bijou/docs/invariants/layout-owns-interaction-geometry.md)
- [Commands Change State, Effects Do Not](/Users/james/git/bijou/docs/invariants/commands-change-state-effects-do-not.md)
- [Tests Are the Spec](/Users/james/git/bijou/docs/invariants/tests-are-the-spec.md)

## Implementation outline

1. Extend the pure runtime-engine module with first-class retained-layout types.
2. Define an explicit invalidation-cause vocabulary for geometry changes, including:
   - terminal resize
   - view-stack change
   - content change
   - visibility change
   - enablement change
   - overflow change
3. Add pure helpers to:
   - create an empty retained-layout registry
   - retain or replace a layout tree for a given active view id
   - list and look up retained layouts
   - mark retained layouts stale with one or more invalidation causes
   - drop layouts whose views are no longer present in the active view stack
4. Keep the implementation shell-agnostic and avoid routing work in this cycle.
5. Leave detailed component sizing/anchoring contracts for [RE-006](/Users/james/git/bijou/docs/design/RE-006-formalize-component-layout-and-interaction-contracts.md).

## Tests to write first

- cycle test proving the legend now points at `RE-003` as the active cycle and leaves the remaining runtime-engine backlog in place
- package-local runtime tests proving:
  - retained layout trees are stored by active view id
  - retained layouts expose versioning and invalidation status
  - invalidation causes are explicit and deduplicated
  - re-retaining a layout clears invalidation and increments version
  - layouts for inactive views are dropped when the view stack changes

## Risks / unknowns

- there is already a `LayoutNode` tree in the core toolkit, so the runtime should reuse that concept instead of inventing a second layout language
- the cycle must not drift into full routing or component registration work yet
- detailed resize/stretch/shrink rules still need a stronger component-level contract later, so this cycle should retain geometry ownership without pretending every layout rule is solved

## Retrospective

What landed:

- a first-class retained-layout registry in the runtime engine
- explicit invalidation causes for stale geometry
- pure helpers for retaining, invalidating, listing, looking up, and dropping layouts by view ownership
- tests proving versioning, invalidation, and view-stack cleanup semantics

What did not land:

- no full input-routing migration yet
- no component-level stretch/shrink/anchor contract yet
- no framed-shell migration yet

Follow-on:

- [RE-004 — Route Input Through Layouts and Layer Bubbling](/Users/james/git/bijou/docs/design/RE-004-route-input-through-layouts-and-layer-bubbling.md)
- [RE-005 — Buffer Commands and Effects Separately](/Users/james/git/bijou/docs/design/RE-005-buffer-commands-and-effects-separately.md)
- [RE-006 — Formalize Component Layout and Interaction Contracts](/Users/james/git/bijou/docs/design/RE-006-formalize-component-layout-and-interaction-contracts.md)
- [RE-007 — Migrate Framed Shell Onto Runtime Engine Seams](/Users/james/git/bijou/docs/BACKLOG/RE-007-migrate-framed-shell-onto-runtime-engine-seams.md)
