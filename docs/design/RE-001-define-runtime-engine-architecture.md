# RE-001 — Define Runtime Engine Architecture

_Cycle for formalizing Bijou's hexagonal runtime around state machines, view stacks, retained layouts, and buffered command/effect routing_

Legend:

- [RE — Runtime Engine](../legends/RE-runtime-engine.md)

Depends on:

- [HT-004 — Promote Explicit Layer Objects and Richer Shell Introspection](./HT-004-promote-explicit-layer-objects-and-richer-shell-introspection.md)
- [DL-009 — Formalize Layout and Viewport Rules](../BACKLOG/DL-009-formalize-layout-and-viewport-rules.md)

## Why this cycle exists

Recent shell and DOGFOOD work exposed that Bijou still mixes several concerns together:

- stateful application logic
- visible shell/view layering
- layout ownership
- input routing
- side effects

That mixing was survivable while the framework was smaller, but it is now making the architecture harder to explain than it should be.

This cycle exists to write down the intended engine model before the implementation drifts further:

- the application owns a state machine
- the application owns a view stack
- the runtime retains layouts for those views
- input is routed through those retained layouts from the topmost view downward
- components may emit commands and effects
- commands and effects are buffered separately
- terminal, clock, audio, filesystem, and other integrations stay outside the hexagon as adapters

## Human users / jobs / hills

### Primary human users

- framework maintainers evolving the runtime
- builders composing real applications with multiple overlapping surfaces
- shell and DOGFOOD authors who need predictable interaction and layout rules

### Human jobs

1. Explain whether a behavior belongs to state, view stack, layout, routing, command handling, or an adapter.
2. Add a new modal, drawer, or workspace view without rewriting routing rules from scratch.
3. Resize the terminal or change a component's content without letting geometry and interaction ownership drift apart.

### Human hill

The runtime model is explicit enough that a human can describe how one input becomes zero-or-more commands and effects without hand-waving over shell-specific branch order.

## Agent users / jobs / hills

### Primary agent users

- agents generating Bijou apps
- agents inspecting runtime state during test/debug loops
- agents validating whether routing and effects match the visible UI

### Agent jobs

1. Inspect state machine state separately from the current view stack.
2. Read retained layout ownership and predict which view/component should receive a pointer or key event.
3. Distinguish between commands that change state and effects that leave state alone.

### Agent hill

An agent can inspect the runtime model and answer what is visible, what is interactive, what blocks lower layers, and what commands/effects an input may emit without parsing ANSI output heuristically.

## Human playback

1. A user is in a workspace view with an active session state.
2. The app pushes a modal confirmation view onto the view stack without destroying the underlying workspace state.
3. The modal's retained layout is placed above the workspace layout and blocks lower interaction.
4. The user clicks the modal's confirm button.
5. The input system routes the click to the topmost view's layout.
6. The button emits:
   - a command to continue the operation
   - an effect to play a click sound
7. The runtime buffers the command and effect separately.
8. The command updates app state and may pop or replace views.
9. The effect runs through an adapter without pretending it changed state.

## Agent playback

1. An agent inspects the runtime while a search palette sits above a workspace view.
2. The runtime exposes:
   - current application state
   - ordered view stack
   - retained layouts for each active view
3. The agent can see that the search view blocks lower interaction.
4. A key input enters the runtime.
5. The runtime routes it through the search view's input path first.
6. The search view emits one command to select a result and one effect to announce the match count.
7. The workspace view never receives the key because the upper view handled it and blocks lower layers.

## Linked invariants

- [Focus Owns Input](../invariants/focus-owns-input.md)
- [Topmost Layer Dismisses First](../invariants/topmost-layer-dismisses-first.md)
- [State Machine and View Stack Are Distinct](../invariants/state-machine-and-view-stack-are-distinct.md)
- [Layout Owns Interaction Geometry](../invariants/layout-owns-interaction-geometry.md)
- [Commands Change State, Effects Do Not](../invariants/commands-change-state-effects-do-not.md)
- [Tests Are the Spec](../invariants/tests-are-the-spec.md)

## Implementation outline

1. Formalize core runtime nouns:
   - `ApplicationStateMachine`
   - `ViewStack`
   - `ViewLayer`
   - `RetainedLayoutTree`
   - `InputEvent`
   - `Command`
   - `Effect`
2. Promote the view stack into first-class runtime state instead of deriving it from booleans and shell-specific branches.
3. Move layout ownership to retained runtime objects that are invalidated on:
   - terminal resize
   - view push/pop
   - content-size changes
   - visibility/enablement changes
   - scrollbar/overflow changes
4. Route input against retained layouts, topmost view first, with explicit block/pass-through semantics.
5. Let components contribute interaction behavior through layout-owned nodes instead of global registration churn.
6. Buffer emitted commands separately from emitted effects.
7. Migrate existing framed-shell behavior onto those seams once the contracts are explicit.

## Tests to write first

- cycle test proving the legend, invariants, active design doc, and follow-on backlog items all describe the same runtime model
- future runtime unit tests proving:
  - one input may emit multiple commands
  - one input may emit multiple effects
  - commands and effects stay distinct
  - topmost blocking views prevent lower layouts from seeing the same input
  - retained layouts update interaction geometry when invalidated

## Risks / unknowns

- Bijou's current TEA-style update flow may need a transitional compatibility layer while commands/effects become buffered first-class runtime outputs.
- Existing framed-shell code still derives layers from booleans instead of owning a first-class view stack.
- Layout invalidation boundaries may need careful tuning so the retained model is simpler than per-render recomputation rather than more confusing.
- Some existing components may not yet have explicit enough layout contracts to participate cleanly in layout-driven routing.

## Retrospective

What landed:

- a new [RE — Runtime Engine](../legends/RE-runtime-engine.md) legend
- explicit invariants for state/view separation, layout-owned interaction geometry, and command/effect separation
- this cycle doc capturing the runtime model as the design source of truth
- a decomposition backlog for implementation slices

What did not land:

- no runtime code changes yet
- no new engine objects yet
- no shell migration yet

Follow-on:

- [RE-002 — Promote First-Class State Machine and View Stack](./RE-002-promote-first-class-state-machine-and-view-stack.md)
- [RE-003 — Retain Layout Trees and Layout Invalidation](./RE-003-retain-layout-trees-and-layout-invalidation.md)
- [RE-004 — Route Input Through Layouts and Layer Bubbling](./RE-004-route-input-through-layouts-and-layer-bubbling.md)
- [RE-005 — Buffer Commands and Effects Separately](./RE-005-buffer-commands-and-effects-separately.md)
- [RE-006 — Formalize Component Layout and Interaction Contracts](./RE-006-formalize-component-layout-and-interaction-contracts.md)
- [RE-007 — Migrate Framed Shell Onto Runtime Engine Seams](../BACKLOG/RE-007-migrate-framed-shell-onto-runtime-engine-seams.md)
