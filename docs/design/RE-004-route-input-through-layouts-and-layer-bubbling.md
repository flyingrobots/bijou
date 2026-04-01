# RE-004 — Route Input Through Layouts and Layer Bubbling

_Cycle for making retained layouts the authoritative routing surface for input, topmost layer first_

Legend:

- [RE — Runtime Engine](/Users/james/git/bijou/docs/legends/RE-runtime-engine.md)

Depends on:

- [RE-001 — Define Runtime Engine Architecture](/Users/james/git/bijou/docs/design/RE-001-define-runtime-engine-architecture.md)
- [RE-002 — Promote First-Class State Machine and View Stack](/Users/james/git/bijou/docs/design/RE-002-promote-first-class-state-machine-and-view-stack.md)
- [RE-003 — Retain Layout Trees and Layout Invalidation](/Users/james/git/bijou/docs/design/RE-003-retain-layout-trees-and-layout-invalidation.md)

## Why this cycle exists

RE-003 made retained geometry first-class.

But the runtime still needs to answer the next question:

- given an input event and a view stack with retained layouts, who sees it first?
- when does it stop?
- when does it bubble downward?
- how does pointer routing know which node was actually hit?

This cycle exists to land a pure runtime-engine routing seam that:

- reads the retained layouts of the current view stack
- routes topmost view first
- uses layout-driven hit testing for pointer input
- respects blocking vs bubbling semantics by layer
- stays shell-agnostic instead of embedding framed-app branches into the runtime core

This is still intentionally smaller than full component contracts. It gives the runtime a routing spine before `RE-005` and `RE-006` deepen command/effect and component interaction semantics further.

## Human users / jobs / hills

### Primary human users

- framework maintainers evolving runtime interaction rules
- builders composing modal, palette, drawer, and workspace views
- shell authors who need pointer and key routing to stop depending on branch order

### Human jobs

1. Route key and pointer input through explicit topmost-first layer semantics.
2. Trust a blocking top layer to prevent lower views from accidentally seeing the same input.
3. Use retained geometry to tell which layout node a pointer event actually hit.

### Human hill

A human can explain why a given input was handled, blocked, or bubbled by pointing at the view stack, retained layouts, and routing result instead of reverse-engineering branch order.

## Agent users / jobs / hills

### Primary agent users

- agents inspecting why an input hit one view instead of another
- agents generating deterministic routing tests
- agents preparing future component-level interaction contracts

### Agent jobs

1. Read routing results and know which view and node received an input first.
2. Distinguish between “unhandled and bubbled” vs “stopped by a blocking layer.”
3. Inspect pointer hit paths without parsing painted frames heuristically.

### Agent hill

An agent can inspect the runtime routing result and explain which layers were visited, which node was hit, and why lower views did or did not receive the same input.

## Human playback

1. A user has a workspace view open with a non-blocking tooltip above it.
2. The tooltip does not handle a click.
3. Because the tooltip does not block lower views, the click bubbles to the workspace view.
4. Later, a blocking modal opens above the same workspace.
5. The user clicks outside the modal's actionable content.
6. The modal does not handle the click, but it still blocks lower views.
7. The workspace never receives that click.

## Agent playback

1. An agent inspects a runtime with `workspace -> search` in the view stack.
2. The search view is topmost and blocking.
3. A key event enters the runtime.
4. The runtime routes the event to `search` first.
5. The search handler emits one command and one effect.
6. The routing result reports:
   - visited layers in topmost-first order
   - `search` as the handling view
   - no lower-layer visitation after handling
7. For a pointer event, the routing result also exposes the hit path inside the retained layout tree.

## Linked invariants

- [Focus Owns Input](/Users/james/git/bijou/docs/invariants/focus-owns-input.md)
- [Topmost Layer Dismisses First](/Users/james/git/bijou/docs/invariants/topmost-layer-dismisses-first.md)
- [Layout Owns Interaction Geometry](/Users/james/git/bijou/docs/invariants/layout-owns-interaction-geometry.md)
- [Commands Change State, Effects Do Not](/Users/james/git/bijou/docs/invariants/commands-change-state-effects-do-not.md)
- [Tests Are the Spec](/Users/james/git/bijou/docs/invariants/tests-are-the-spec.md)

## Implementation outline

1. Add pure runtime-engine input types for shell-agnostic key and pointer input.
2. Add pure layout-hit testing over retained layout trees.
3. Add a pure input-routing helper that:
   - visits topmost view first
   - resolves retained layout for that view
   - computes pointer hit paths when geometry applies
   - calls a supplied per-view handler
   - stops on handled input
   - stops on unhandled input if the layer blocks below
   - bubbles otherwise
4. Return a structured routing result that records:
   - visited view ids
   - handled/stopped state
   - commands and effects emitted
   - hit path when pointer routing applies
5. Keep handler semantics generic in this cycle rather than formalizing full component interaction contracts yet.

## Tests to write first

- cycle test proving the legend now points at `RE-004` as the active cycle and leaves the remaining runtime-engine backlog in place
- package-local runtime tests proving:
  - deepest-node layout hit testing works
  - key routing is topmost-first
  - unhandled input bubbles through non-blocking views
  - unhandled input stops at blocking views
  - pointer routing exposes hit node ids from retained layout geometry
  - routing results preserve separate command/effect arrays

## Risks / unknowns

- detailed component-level interaction contracts are still deferred to `RE-006`
- the first routing seam should stay generic enough to work for framed shell, DOGFOOD, and future runtimes without hard-coding shell concepts
- some future views may need more nuanced propagation semantics than simple handled-or-blocked rules, but this cycle should land the clear baseline first

## Retrospective

What landed:

- pure runtime-engine input event types
- retained-layout hit testing
- topmost-first routing over the active view stack
- explicit bubbling vs blocking behavior
- structured routing results with visited views and emitted commands/effects

What did not land:

- no full command/effect buffering runtime yet
- no component-level interaction contract yet
- no framed-shell migration yet

Follow-on:

- [RE-005 — Buffer Commands and Effects Separately](/Users/james/git/bijou/docs/design/RE-005-buffer-commands-and-effects-separately.md)
- [RE-006 — Formalize Component Layout and Interaction Contracts](/Users/james/git/bijou/docs/BACKLOG/RE-006-formalize-component-layout-and-interaction-contracts.md)
- [RE-007 — Migrate Framed Shell Onto Runtime Engine Seams](/Users/james/git/bijou/docs/BACKLOG/RE-007-migrate-framed-shell-onto-runtime-engine-seams.md)
