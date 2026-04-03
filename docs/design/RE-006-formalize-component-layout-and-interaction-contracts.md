# RE-006 — Formalize Component Layout and Interaction Contracts

_Cycle for turning retained layout nodes into honest component contracts with explicit sizing, overflow, and interaction participation_

Legend:

- [RE — Runtime Engine](../legends/RE-runtime-engine.md)

Depends on:

- [RE-001 — Define Runtime Engine Architecture](./RE-001-define-runtime-engine-architecture.md)
- [RE-002 — Promote First-Class State Machine and View Stack](./RE-002-promote-first-class-state-machine-and-view-stack.md)
- [RE-003 — Retain Layout Trees and Layout Invalidation](./RE-003-retain-layout-trees-and-layout-invalidation.md)
- [RE-004 — Route Input Through Layouts and Layer Bubbling](./RE-004-route-input-through-layouts-and-layer-bubbling.md)
- [RE-005 — Buffer Commands and Effects Separately](./RE-005-buffer-commands-and-effects-separately.md)

## Why this cycle exists

RE-003 through RE-005 gave the runtime:

- retained layouts
- layout-driven routing
- buffered commands and effects

But retained layout nodes are still just geometry plus painted content. The runtime still needs a first-class way for components to say:

- their explicit layout rules
- how they align and anchor inside a parent-assigned rect
- how they own overflow
- whether they participate in input
- what component-level handlers can emit commands and effects

This cycle exists to formalize those component contracts without dragging the framed shell migration in yet.

## Human users / jobs / hills

### Primary human users

- framework maintainers evolving the runtime tree
- builders composing real interactive components instead of anonymous layout rectangles
- shell authors who need component ownership to stay honest under resize, overflow, and modal layering

### Human jobs

1. Attach explicit layout rules to retained layout nodes.
2. Describe overflow ownership instead of improvising wrap vs clip vs viewport behavior.
3. Mark components enabled or disabled for interaction without stale registration side effects.
4. Resolve the deepest enabled interactive node from a retained hit path.

### Human hill

A human can inspect a retained component node and answer how it sizes, how it aligns, how it overflows, and whether it can currently accept input.

## Agent users / jobs / hills

### Primary agent users

- agents inspecting retained trees for real component semantics
- agents generating routing tests against enabled and disabled components
- agents preparing later shell migration and component-family adoption work

### Agent jobs

1. Read explicit layout rules and overflow ownership from a retained component contract.
2. Resolve the deepest enabled interactive node inside a retained hit path.
3. Invoke component-level handlers that emit multiple commands and effects without bypassing runtime buffers.

### Agent hill

An agent can inspect a retained layout hit and explain which component would receive input, why disabled descendants were skipped, and whether scroll ownership aligns with viewport overflow.

## Human playback

1. A user clicks inside a confirmation card rendered as a retained component tree.
2. The hit path contains:
   - card shell
   - disabled secondary action
   - enabled primary action
3. The runtime resolves the deepest enabled interactive node, which is the primary action.
4. The primary action's component handler emits:
   - `confirm.accept`
   - `modal.dismiss`
5. It also emits one effect:
   - `play-click`
6. In a separate pane, a viewport-owned list component claims wheel scrolling because its block overflow is `viewport`.
7. A non-viewport note block does not claim the same scroll input.

## Agent playback

1. An agent inspects a retained layout hit path with three nested component nodes.
2. The deepest node is disabled, so it should not receive input.
3. Its parent is enabled and accepts pointer presses.
4. The runtime resolves that parent as the deepest enabled interactive node.
5. The agent then invokes the component handler through the runtime contract seam.
6. The handler emits multiple commands and one effect.
7. The runtime keeps those commands and effects separate for later buffering and draining.

## Linked invariants

- [Layout Owns Interaction Geometry](../invariants/layout-owns-interaction-geometry.md)
- [Commands Change State, Effects Do Not](../invariants/commands-change-state-effects-do-not.md)
- [Focus Owns Input](../invariants/focus-owns-input.md)
- [Tests Are the Spec](../invariants/tests-are-the-spec.md)

## Implementation outline

1. Extend the pure runtime-engine module with first-class component contracts for:
   - explicit layout rules
   - explicit overflow ownership
   - explicit interaction participation
2. Keep the layout contract small but honest:
   - width and height behavior
   - alignment and anchoring
   - min/max or fixed sizing hooks where needed
3. Keep overflow ownership explicit:
   - inline overflow for clip/truncate/viewport
   - block overflow for wrap/stack/clip/viewport
4. Add pure helpers to:
   - create retained component nodes with attached contracts
   - read component contracts back from retained nodes
   - resolve the deepest enabled interactive node from a retained hit path
   - invoke component-level handlers that emit commands and effects
5. Formalize the rule that scroll ownership aligns with viewport overflow instead of arbitrary wheel handlers.
6. Identify first migration candidates without performing the shell migration yet.

## First migration candidates

- collection rows in command palettes and browsable lists
- button-like activators in confirmation or guided-flow surfaces
- viewport-owned panes where wheel/scroll ownership must stay truthful

## Tests to write first

- cycle test proving the legend now points at `RE-006` as the active cycle and leaves `RE-007` as the remaining runtime-engine backlog slice
- package-local runtime tests proving:
  - component contracts can carry explicit layout rules and overflow ownership
  - deepest enabled interactive node resolution prefers the deepest eligible node
  - disabled or unsupported descendants fall back to an enabled ancestor
  - component-level handlers can emit multiple commands and effects
  - scroll ownership aligns with viewport overflow instead of ordinary block content

## Risks / unknowns

- the real shell migration may want richer layout rules than the first contract vocabulary here, so the initial contract should stay small and composable
- some component families may need higher-level semantics later, but this cycle should land the common runtime contract first
- the runtime should keep this retained-layout-first instead of drifting into ad hoc registration or shell-local shortcuts again

## Retrospective

What landed:

- retained component nodes with explicit layout, overflow, and interaction contracts
- pure helpers for resolving the deepest enabled interactive node
- component-level handler dispatch that emits commands and effects
- tests proving disabled/unsupported nodes are skipped honestly

What did not land:

- no framed-shell migration yet
- no app-frame routing rewrite yet
- no wholesale component-family migration yet

Follow-on:

- [RE-007 — Migrate Framed Shell Onto Runtime Engine Seams](../BACKLOG/asap/RE-007-migrate-framed-shell-onto-runtime-engine-seams.md)
