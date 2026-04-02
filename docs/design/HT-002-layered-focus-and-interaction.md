# HT-002 — Layered Focus and Interaction

_Cycle for defining how Bijou shells should treat focus layers, dismiss order, and input ownership as one coherent stack_

Legend:

- [HT — Humane Terminal](../legends/HT-humane-terminal.md)

## Why this cycle exists

Bijou has accumulated multiple shell-owned surfaces:

- help
- search
- command palette
- settings
- notifications
- quit confirm
- page-owned modals

They currently route input by branch order. That is workable until it is not: the moment two layers disagree about `Esc`, footer hints, or control ownership, the shell starts feeling brittle.

This cycle exists to define a calmer model:

- layers behave like a stack
- the topmost layer owns input
- the topmost layer owns the visible controls
- dismiss actions pop layers before they trigger broader shell behavior

The purpose of this cycle is design, not implementation. The follow-on runtime refactor will come in the next cycle.

## Human users / jobs / hills

### Primary human users

- operators inside framed Bijou apps
- first-time DOGFOOD users who open layered shell surfaces
- builders trying to understand why `Esc`, `Tab`, and footer hints behave the way they do

### Human jobs

1. Understand which layer currently owns input.
2. Dismiss the thing in front of me without accidentally quitting the app.
3. Trust the footer and help hints to describe the active controls truthfully.
4. Move back to the underlying pane without guessing whether hidden controls are still live.

### Human hill

A user can open and close layered shell surfaces without ever feeling that `Esc` or the footer lied about what would happen next.

## Agent users / jobs / hills

### Primary agent users

- agents navigating framed apps through deterministic key sequences
- agents inspecting shell state for playbacks, tests, or UI generation
- agents trying to decide which controls are valid without scraping visual chrome heuristically

### Agent jobs

1. Determine the active interaction layer without reconstructing branch order from source.
2. Read the active input map for the topmost layer.
3. Predict what `Esc`, navigation keys, and shell shortcuts will do right now.
4. Derive truthful control hints from the same source that governs routing.

### Agent hill

An agent can inspect or infer a single active layer stack and know which input map is live, what controls are truthful, and what dismissal will do next.

## Human playback

1. A user is in DOGFOOD docs and opens component search with `/`.
2. Search pushes a search layer onto the shell stack.
3. The search layer's input map becomes active, and the footer updates to search-specific controls.
4. The underlying pane controls disappear from the footer because they are no longer truthful.
5. The user presses `Esc`.
6. The search layer dismisses and pops off the stack.
7. The previously focused docs pane becomes active again, along with its pane controls.
8. The user presses `Esc` again.
9. No dismissible overlay remains, so the shell now interprets `Esc` as a quit request and opens quit confirm.

## Agent playback

1. An agent enters a framed app and requests the current shell layer state.
2. The shell reports a base workspace layer plus one topmost settings drawer layer.
3. The active input map is the settings drawer map, not the underlying pane map.
4. The agent derives visible controls from that topmost input map and ignores stale pane-local hints.
5. The agent sends `Esc`.
6. The shell pops the settings layer and restores the workspace layer and its active pane input map.
7. The agent sends `Esc` again.
8. With no dismissible overlay left, the shell opens quit confirm instead of silently quitting or dispatching to a stale pane action.

## Linked invariants

- [Focus Owns Input](../invariants/focus-owns-input.md)
- [Topmost Layer Dismisses First](../invariants/topmost-layer-dismisses-first.md)
- [Visible Controls Are a Promise](../invariants/visible-controls-are-a-promise.md)
- [Shell Owns Shell Concerns](../invariants/shell-owns-shell-concerns.md)

## Proposed direction

### Layer model

Treat shell and page interaction surfaces as a stack of explicit layers:

- base workspace layer
- pane-local modal layer
- shell search/palette layer
- shell help layer
- shell settings layer
- shell notification center layer
- shell quit-confirm layer

The stack is logical, not merely visual. Only the topmost layer owns input.

### Input maps

Each layer should provide or select an input map that describes:

- the keys it handles
- the dismissal behavior it owns
- the controls that can be shown in the footer/help
- whether it is dismissible, blocking, or review-only

This makes the input map do three jobs from one source of truth:

- routing
- visible controls
- agent-readable interaction state

### Dismiss order

Dismissal should be top-down and unsurprising:

1. If a dismissible layer is open, `Esc` dismisses that layer.
2. If the topmost layer is not dismissible, `Esc` does nothing or follows that layer's explicit contract.
3. Only when no dismissible layer remains should `Esc` fall back to the shell quit request.

`q` and `Ctrl+C` can remain explicit quit affordances, but they should still respect text-entry exceptions and shell-owned quit policy.

### Visible controls

Footer and help hints should be derived from the topmost input map, not copied from whichever branch happened to handle the last render.

This means:

- a search layer shows search controls
- a modal shows modal controls
- an inactive pane does not keep advertising its keys when covered
- when a layer pops, the previous active map becomes visible again

### Agent-visible semantics

The shell should eventually expose enough structured layer state that tests, playbacks, and agents do not need to infer ownership from rendered text alone.

Candidate shape:

- ordered active layers
- topmost input map id
- dismissibility
- active control hints
- owning region or surface id

## Implementation outline

This cycle is design-only. The intended implementation follow-on is:

1. Introduce a shell layer model in `createFramedApp()`.
2. Convert search/help/settings/notifications/quit confirm into explicit layer descriptors.
3. Promote or adapt input maps so each layer drives both routing and visible controls.
4. Make `Esc` follow top-down dismiss semantics.
5. Prove the behavior through DOGFOOD and shell regressions.

## Tests to write first

- cycle doc regression asserting the new Humane Terminal cycle, invariant, and doctrine links exist
- shell behavior regressions proving top-down dismiss order once implementation begins
- footer/help regressions proving visible controls come from the topmost input map
- DOGFOOD playback proving search dismissal restores the underlying pane controls before quit is possible

## Risks / unknowns

- page-owned modals and shell-owned layers currently live in different conceptual buckets
- not every existing key path is modeled as an input map yet
- some layers may want special `Esc` behavior beyond simple dismissal
- the eventual public API for agent-readable layer state needs to be useful without overfitting the current shell internals

## Retrospective

This cycle deliberately stops at doctrine and interaction model definition.

What it clarified:

- `Esc` bugs are symptoms of missing layer semantics, not isolated routing accidents
- the shell needs a topmost-layer model, not more special-case branch ordering
- input maps are a promising shared seam for routing, footer truth, and agent visibility

Drift and follow-on:

- the runtime still routes most shell layers ad hoc today
- that follow-on has now landed as [HT-003 — Implement Layer Stack and Input Map Routing](./HT-003-implement-layer-stack-and-input-map-routing.md)
