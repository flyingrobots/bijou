# RE-002 — Promote First-Class State Machine and View Stack

_Cycle for turning state machines and view stacks into explicit runtime objects instead of thin shell conventions_

Legend:

- [RE — Runtime Engine](/Users/james/git/bijou/docs/legends/RE-runtime-engine.md)

Depends on:

- [RE-001 — Define Runtime Engine Architecture](/Users/james/git/bijou/docs/design/RE-001-define-runtime-engine-architecture.md)

## Why this cycle exists

RE-001 defined the runtime direction:

- application state and visible views are distinct
- views/layers should be first-class runtime objects
- view-stack behavior should not be derived ad hoc from shell booleans

This cycle exists to land the first real implementation slice behind that doctrine:

- a first-class state-machine object
- a first-class view-stack object
- explicit root/base-view behavior
- explicit push/pop/replace/clear semantics

This is intentionally smaller than a shell migration. It gives the runtime a reusable foundation before routing, retained-layout invalidation, and command/effect buffering are moved onto it.

## Human users / jobs / hills

### Primary human users

- framework maintainers evolving the runtime
- builders writing layered applications with modals, drawers, and overlays
- shell authors who need something more honest than booleans plus branch order

### Human jobs

1. Represent durable application state separately from ephemeral or layered UI.
2. Push and dismiss views without pretending those operations are the same as state transitions.
3. Replace or clear visible views intentionally when a state transition requires it.

### Human hill

The first-class runtime objects are explicit enough that a human can point to one place for “current app state” and one place for “visible view stack” without hand-waving.

## Agent users / jobs / hills

### Primary agent users

- agents inspecting runtime objects
- agents generating tests against stack/state behavior
- agents authoring layered apps on top of Bijou

### Agent jobs

1. Read the current state machine without inferring it from visible shell layers.
2. Read the current view stack without inferring it from miscellaneous booleans.
3. Determine whether a top layer can be dismissed, whether it blocks below, and what the root/base view is.

### Agent hill

An agent can inspect the runtime objects and answer “what state is the app in?” separately from “what views are currently visible?” reliably enough to generate and validate layered behavior.

## Human playback

1. A user is in an active workspace session.
2. The app's state machine says `session.active`.
3. The view stack contains only the non-dismissible workspace root view.
4. The app pushes a dismissible blocking confirmation view.
5. The user dismisses it.
6. The state machine stays on `session.active`.
7. The view stack pops back to only the root view.
8. Later, the app transitions to `session.ended` and intentionally clears auxiliary views while replacing the base view with a post-session summary.

## Agent playback

1. An agent inspects runtime objects before and after a modal opens.
2. Before:
   - state machine current state is `docs.browsing`
   - view stack contains one root view
3. After:
   - state machine still reports `docs.browsing`
   - view stack contains root + modal
4. The agent can see that the modal is dismissible and blocking while the root is not dismissible.
5. When the modal is dismissed, the state machine remains unchanged while the view stack changes.

## Linked invariants

- [State Machine and View Stack Are Distinct](/Users/james/git/bijou/docs/invariants/state-machine-and-view-stack-are-distinct.md)
- [Layout Owns Interaction Geometry](/Users/james/git/bijou/docs/invariants/layout-owns-interaction-geometry.md)
- [Commands Change State, Effects Do Not](/Users/james/git/bijou/docs/invariants/commands-change-state-effects-do-not.md)
- [Tests Are the Spec](/Users/james/git/bijou/docs/invariants/tests-are-the-spec.md)

## Implementation outline

1. Add a pure runtime module in `bijou-tui` that exports:
   - a first-class state-machine type
   - a first-class view-layer type
   - a first-class view-stack type
2. Formalize view-layer semantics:
   - stable id
   - kind
   - dismissible
   - blocksBelow
   - root/base marker
3. Implement pure state-machine helpers:
   - create
   - transition
4. Implement pure view-stack helpers:
   - create with a root/base view
   - push
   - pop top dismissible view
   - replace top view
   - clear to root
   - replace root/base intentionally
5. Export the module publicly without migrating the shell yet.

## Tests to write first

- cycle test proving the legend, active cycle doc, and remaining backlog slices agree on the first-class runtime-object direction
- package-local runtime tests proving:
  - state-machine transitions track current and previous state
  - view stacks require a non-dismissible root/base view
  - pushing overlays does not alter state-machine state
  - popping never removes the root/base view
  - replacing the top view does not rewrite the root/base view
  - clearing to root preserves the root/base view
  - replacing the root/base view is explicit rather than an accidental pop/replace side effect

## Risks / unknowns

- existing shell code already has partial layer concepts that may overlap awkwardly with the new view-layer vocabulary until RE-007
- naming needs to stay generic enough for runtime use without becoming too abstract to migrate onto concrete shell objects later
- the first slice should stay pure and small; if it tries to absorb input routing or retained layouts now, the cycle will sprawl

## Retrospective

What landed:

- a pure first-class state-machine object
- a pure first-class view-stack object with explicit root/base semantics
- public runtime-engine exports for those objects
- tests proving the semantics without shell-specific coupling

What did not land:

- no retained layout implementation yet
- no input routing migration yet
- no command/effect buffers yet
- no framed-shell adoption yet

Follow-on:

- [RE-003 — Retain Layout Trees and Layout Invalidation](/Users/james/git/bijou/docs/design/RE-003-retain-layout-trees-and-layout-invalidation.md)
- [RE-004 — Route Input Through Layouts and Layer Bubbling](/Users/james/git/bijou/docs/design/RE-004-route-input-through-layouts-and-layer-bubbling.md)
- [RE-005 — Buffer Commands and Effects Separately](/Users/james/git/bijou/docs/design/RE-005-buffer-commands-and-effects-separately.md)
- [RE-006 — Formalize Component Layout and Interaction Contracts](/Users/james/git/bijou/docs/design/RE-006-formalize-component-layout-and-interaction-contracts.md)
- [RE-007 — Migrate Framed Shell Onto Runtime Engine Seams](/Users/james/git/bijou/docs/BACKLOG/RE-007-migrate-framed-shell-onto-runtime-engine-seams.md)
