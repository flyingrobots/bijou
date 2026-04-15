# HT-004 — Promote Explicit Layer Objects and Richer Shell Introspection

_Cycle for turning the shell layer stack into richer explicit layer objects that own more than just branch order_

Legend:

- [HT — Humane Terminal](../legends/HT-humane-terminal.md)

Depends on:

- [HT-003 — Implement Layer Stack and Input Map Routing](./HT-003-implement-layer-stack-and-input-map-routing.md)

## Why this cycle exists

HT-003 made the shell stack real enough for routing, dismissal, and truthful footer hints.

But the layer model was still intentionally thin:

- most layer objects were inferred from booleans
- layer titles still lived in overlay render helpers
- footer hints still came from separate shell branches
- help overlay content still special-cased underlying layer kinds instead of consuming richer layer metadata

This cycle exists to make the layer object itself a better unit of truth for humans, agents, and shared shell code.

## Human users / jobs / hills

### Primary human users

- framed-app operators moving between workspace, settings, help, notification review, palette search, and quit confirm
- DOGFOOD users relying on the shell to explain what is active
- builders expecting shell overlays to feel coherent instead of pieced together

### Human jobs

1. Trust a shell layer to own its own title and controls instead of seeing mismatched chrome.
2. Open help and get the controls for the layer beneath it without stale workspace leakage.
3. Move between shell layers without the footer and overlay titles feeling like they come from different systems.

### Human hill

Each shell layer feels like a real object with its own identity and controls, not a boolean plus a pile of helper branches.

## Agent users / jobs / hills

### Primary agent users

- agents inspecting framed-app model state
- agents generating deterministic playbacks for shell layers
- agents that need to know which controls belong to the active or underlying layer

### Agent jobs

1. Inspect the active and underlying layer objects directly instead of reverse-engineering footer/help logic.
2. Read a layer title and control ownership from the same place the shell uses.
3. Determine whether a layer has its own help source, hint source, and dismissal semantics.

### Agent hill

An agent can inspect a frame model and obtain richer explicit layer objects with enough metadata to reason about titles, controls, and help ownership without parsing rendered chrome heuristically.

## Human playback

1. A user opens settings in a framed app.
2. The shell creates a settings layer object with the settings title, footer hint, and help bindings.
3. The user opens help from within settings.
4. Help becomes the active layer, but the underlying settings layer still carries the controls help needs to show.
5. The help overlay lists settings controls instead of falling back to stale workspace bindings.
6. The user dismisses help and returns to settings.
7. The settings drawer title and footer still agree because both come from the same explicit layer model.

## Agent playback

1. An agent inspects a framed app with settings open and a search layer above it.
2. The stack exposes explicit layer objects:
   - workspace
   - settings
   - search
3. The search layer object includes its title and hint source.
4. The underlying settings layer object includes its help source.
5. The agent can predict both the visible footer controls and the help overlay content from those layer objects.

## Linked invariants

- [Focus Owns Input](../invariants/focus-owns-input.md)
- [Topmost Layer Dismisses First](../invariants/topmost-layer-dismisses-first.md)
- [Visible Controls Are a Promise](../invariants/visible-controls-are-a-promise.md)
- [Shell Owns Shell Concerns](../invariants/shell-owns-shell-concerns.md)

## Implementation outline

1. Promote the public layer descriptor into a richer explicit layer object with:
   - stable id
   - title
   - hint source
   - help source
2. Let `describeFrameLayerStack()` accept metadata overrides for individual layers.
3. Export richer active/underlying layer helpers for shell introspection.
4. Drive shell footer hints from the active layer object instead of a separate footer-branch helper.
5. Drive help-overlay content from the underlying layer object's help source instead of hard-coded kind branching.
6. Route shell overlay titles through the same layer metadata where feasible.

## Tests to write first

- cycle doc regression for HT-004 and its follow-on backlog item
- unit regression proving `describeFrameLayerStack()` returns richer layer metadata when supplied
- regression proving active/underlying layer helpers expose that richer metadata
- shell regression proving help opened over settings renders settings controls, not stale workspace controls

## Risks / unknowns

- page-owned layers are still limited to the existing `modalKeyMap` seam rather than a full page-provided layer registry
- shell overlay bodies may still have some layout-specific logic even after titles and control metadata move onto layer objects
- the first explicit layer object model may still be derived rather than literally pushed/popped as runtime objects

## Retrospective

What landed:

- richer explicit layer objects with title, hint-source, and help-source metadata
- exported active/underlying layer helpers for shell introspection
- footer and help resolution driven from layer metadata instead of ad hoc branching
- overlay titles routed through explicit layer objects where the shell owns the surface

What did not land:

- a full page-provided layer registry beyond `modalKeyMap`
- a literal pushed/popped runtime collection of first-class layer instances stored on the frame model
- agent-facing control projection beyond the richer exported layer helpers

Follow-on:

- [HT-005 — Promote Page-Provided Layer Registry and Shell Control Projection](../method/graveyard/legacy-backlog/HT-005-promote-page-provided-layer-registry-and-shell-control-projection.md)
