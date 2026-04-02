# RE-005 — Buffer Commands and Effects Separately

_Cycle for formalizing buffered runtime outputs so routing can emit many commands and many effects without immediate consumption_

Legend:

- [RE — Runtime Engine](../legends/RE-runtime-engine.md)

Depends on:

- [RE-001 — Define Runtime Engine Architecture](./RE-001-define-runtime-engine-architecture.md)
- [RE-002 — Promote First-Class State Machine and View Stack](./RE-002-promote-first-class-state-machine-and-view-stack.md)
- [RE-003 — Retain Layout Trees and Layout Invalidation](./RE-003-retain-layout-trees-and-layout-invalidation.md)
- [RE-004 — Route Input Through Layouts and Layer Bubbling](./RE-004-route-input-through-layouts-and-layer-bubbling.md)

## Why this cycle exists

RE-004 proved that layout-driven routing can emit distinct command and effect outputs.

These command and effect outputs are still only loose arrays. The runtime still needs an explicit answer to:

- how route outputs accumulate across multiple handled inputs
- how to append multiple route results in order
- how commands are applied later in FIFO order
- how effects are executed later in FIFO order
- how a handled input can still emit nothing
- how buffered outputs drain deterministically for tests

This cycle exists to land a pure runtime-engine buffering seam that keeps commands and effects distinct without dragging the live shell runtime over yet.

## Human users / jobs / hills

### Primary human users

- framework maintainers evolving runtime ownership rules
- builders composing complex inputs that may emit multiple commands or multiple effects
- shell authors who need deterministic batching without immediate one-input-one-message assumptions

### Human jobs

1. Buffer command and effect outputs separately after routing.
2. Append multiple route results in order without losing which outputs are stateful commands vs non-stateful effects.
3. Apply buffered commands later in FIFO order while leaving effect execution separate.
4. Execute buffered effects later in FIFO order without pretending they mutate app state.

### Human hill

A human can point to one runtime object for pending commands and one for pending effects, explain their order, and drain them deterministically without inventing shell-specific behavior.

## Agent users / jobs / hills

### Primary agent users

- agents inspecting why one input emitted several stateful actions
- agents testing batched runtime semantics without live shell coupling
- agents preparing the later command/effect migration into framed runtime code

### Agent jobs

1. Read buffered commands and buffered effects separately.
2. Append outputs from multiple route results without losing FIFO order.
3. Apply buffered commands and execute buffered effects in deterministic order while proving the buffers drain cleanly.

### Agent hill

An agent can inspect runtime buffers and explain which stateful commands remain pending, which effects remain pending, and in what order they will be drained.

## Human playback

1. A user presses `Enter` in a blocking search layer.
2. The search layer handles the input and emits two commands:
   - `search.select`
   - `workspace.focus`
3. The same input also emits one effect:
   - `announce.selection`
4. The runtime appends those outputs into separate command and effect buffers.
5. No state transition happens yet just because routing returned.
6. Later, the runtime applies the buffered commands in FIFO order.
7. Later, the runtime executes the buffered effects in FIFO order.
8. Both buffers end empty after they are drained.

## Agent playback

1. An agent routes two inputs through the runtime.
2. The first input emits:
   - commands: `['open-modal']`
   - effects: `['play-click']`
3. The second input emits:
   - commands: `['focus-confirm', 'track-selection']`
   - effects: `['announce-confirm']`
4. The runtime buffers those outputs without immediately applying them.
5. The command buffer now contains:
   - `open-modal`
   - `focus-confirm`
   - `track-selection`
6. The effect buffer now contains:
   - `play-click`
   - `announce-confirm`
7. When the runtime drains them, commands are applied later in FIFO order and effects are executed later in FIFO order.

## Linked invariants

- [Commands Change State, Effects Do Not](../invariants/commands-change-state-effects-do-not.md)
- [State Machine and View Stack Are Distinct](../invariants/state-machine-and-view-stack-are-distinct.md)
- [Layout Owns Interaction Geometry](../invariants/layout-owns-interaction-geometry.md)
- [Tests Are the Spec](../invariants/tests-are-the-spec.md)

## Implementation outline

1. Extend the pure runtime-engine module with first-class:
   - command buffer types
   - effect buffer types
   - combined runtime buffer helpers
2. Keep handlers free to emit plain command/effect arrays while routing, but buffer route outputs explicitly afterward.
3. Add pure helpers to:
   - create empty command/effect buffers
   - append commands or effects while preserving order
   - buffer route outputs from `routeRuntimeInput(...)`
   - apply buffered commands with a supplied reducer-style function
   - execute buffered effects with a supplied executor function
4. Make draining deterministic:
   - commands drain in FIFO order
   - effects drain in FIFO order
   - the drained buffer returns empty afterward
5. Keep the live runtime/event-bus migration out of scope for this cycle.

## Tests to write first

- cycle test proving the legend now points at `RE-005` as the active cycle and leaves the remaining runtime-engine backlog in place
- package-local runtime tests proving:
  - empty command/effect buffers can be created explicitly
  - route outputs can be buffered without collapsing commands and effects together
  - appending multiple route results preserves FIFO order
  - handled inputs that emit nothing leave buffers unchanged
  - buffered commands are applied later in FIFO order and the command buffer drains empty
  - buffered effects are executed later in FIFO order and the effect buffer drains empty

## Risks / unknowns

- the later live runtime migration may want adapter-specific effect executors, but this cycle should keep the pure contract generic
- route handlers still emit arrays today, so the buffering seam should avoid forcing a second immediate migration on component-level code
- the runtime should stay explicit about commands changing state and effects not changing state rather than building a vague shared “message queue”

## Retrospective

What landed:

- first-class command and effect buffers in the runtime engine
- pure helpers for buffering route outputs
- deterministic FIFO command application and FIFO effect execution helpers
- tests proving buffers drain cleanly without shell-specific coupling

What did not land:

- no live `runtime.ts` migration yet
- no event-bus command/effect split yet
- no component-level interaction contract yet
- no framed-shell migration yet

Follow-on:

- [RE-006 — Formalize Component Layout and Interaction Contracts](./RE-006-formalize-component-layout-and-interaction-contracts.md)
- [RE-007 — Migrate Framed Shell Onto Runtime Engine Seams](../BACKLOG/RE-007-migrate-framed-shell-onto-runtime-engine-seams.md)
