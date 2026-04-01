# Current Plan

_Living execution plan for what Bijou should do next and in what order_

## Why this exists

`ROADMAP.md` is still useful as historical context and migration surface, but it is too broad and legacy-shaped to answer the simpler question:

**What are we doing next?**

This document is the shorter answer.

It reflects the current intended execution order across legends, not every idea in the repository.

## Current posture

Bijou is no longer proving whether it can exist.

It already has:

- a coherent design language
- a humane shell direction
- a complete DOGFOOD field guide for component-family coverage
- real localization groundwork
- a new runtime-engine legend that describes the intended architecture

So the work now should be narrower and more structural:

- finish the engine spine
- remove the biggest developer-friction seams while that work is active
- use DOGFOOD and design-language surfaces to prove whether the engine is actually good

## The main line

The primary legend now is:

- [RE — Runtime Engine](legends/RE-runtime-engine.md)

This is the center of gravity because the next major improvements all depend on it:

- retained layouts
- honest input routing
- command/effect buffering
- explicit component interaction contracts
- migrating the framed shell onto those seams

### Planned order

1. [RE-003 — Retain Layout Trees and Layout Invalidation](design/RE-003-retain-layout-trees-and-layout-invalidation.md)
2. [RE-004 — Route Input Through Layouts and Layer Bubbling](design/RE-004-route-input-through-layouts-and-layer-bubbling.md)
3. [RE-005 — Buffer Commands and Effects Separately](design/RE-005-buffer-commands-and-effects-separately.md)
4. [RE-006 — Formalize Component Layout and Interaction Contracts](design/RE-006-formalize-component-layout-and-interaction-contracts.md)
5. [RE-007 — Migrate Framed Shell Onto Runtime Engine Seams](BACKLOG/RE-007-migrate-framed-shell-onto-runtime-engine-seams.md)

### Why this order

- retained layouts must exist before layout-driven routing can be real
- routing must be real before command/effect handling can become clean
- component contracts should be formalized before large shell migration work depends on them
- the framed shell should migrate last, after the new seams are stable enough to trust

## The secondary line

The secondary legend is:

- [DX — Developer Experience](legends/DX-developer-experience.md)

This work should run alongside Runtime Engine work, but it should not derail it.

The rule is:

- take DX work early when it directly improves runtime migration and real app work
- defer smaller polish work until the engine seams settle

### Highest-priority DX slices

1. [DX-001 — Type Framed App Messages and Updates End-to-End](BACKLOG/DX-001-type-framed-app-messages-and-updates-end-to-end.md)
2. [DX-002 — Reconcile Cmd Typing With Cleanup and Effect Patterns](BACKLOG/DX-002-reconcile-cmd-typing-with-cleanup-and-effect-patterns.md)

These two should come early because they are actively hurting app work and they touch the same seams the runtime-engine work is already changing.

### Later DX slices

3. [DX-003 — Rationalize Table APIs and Public Table Types](BACKLOG/DX-003-rationalize-table-apis-and-public-table-types.md)
4. [DX-004 — Smooth Surface and String Composition Seams](BACKLOG/DX-004-smooth-surface-and-string-composition-seams.md)
5. [DX-005 — Polish Small Component and Import Ergonomics](BACKLOG/DX-005-polish-small-component-and-import-ergonomics.md)

## The proving surfaces

Two other legends matter right now, but mostly as proving surfaces instead of the main thrust:

- [DF — DOGFOOD Field Guide](legends/DF-dogfood-field-guide.md)
- [DL — Design Language](legends/DL-design-language.md)

### DOGFOOD

DOGFOOD is no longer a coverage problem.

It is now a depth-and-quality problem:

- [DF-020 — Deepen DOGFOOD Story Depth and Variant Quality](BACKLOG/DF-020-deepen-dogfood-story-depth-and-variant-quality.md)

Use DOGFOOD to prove:

- runtime behavior
- story quality
- layout and viewport behavior
- shell integration quality

### Design Language

The remaining important design-language follow-on is:

- [DL-009 — Formalize Layout and Viewport Rules](BACKLOG/DL-009-formalize-layout-and-viewport-rules.md)

That work should stay close to Runtime Engine work, because retained layout and viewport ownership are where those rules become real.

## What is intentionally not the main line right now

These are still valid, but they should not take the center of gravity unless a concrete need forces them up:

- [LX-007 — Service-Oriented Localization Adapters](BACKLOG/LX-007-service-oriented-localization-adapters.md)
- [LX-009 — Localize Shell Help, Notification, and Directional Surfaces](BACKLOG/LX-009-localize-shell-help-notification-and-directional-surfaces.md)
- [HT-005 — Promote Page-Provided Layer Registry and Shell Control Projection](BACKLOG/HT-005-promote-page-provided-layer-registry-and-shell-control-projection.md)
- [WF-002 — Migrate Legacy Planning Artifacts](BACKLOG/WF-002-migrate-legacy-planning-artifacts.md)

They are real backlog, but not the current execution spine.

## Working rules

### 1. Finish the engine spine before broadening surface area

Do not keep adding runtime-adjacent features while the architectural seams are still ambiguous.

### 2. Use DOGFOOD to prove quality, not to hide debt

If a behavior is awkward in DOGFOOD, treat that as framework feedback, not just a docs-app quirk.

### 3. Fix the worst DX pain where it intersects active architecture work

Do not let obvious typing/API pain block real usage while the relevant seam is already open.

### 4. Keep commands and effects conceptually clean

Runtime work should keep reinforcing:

- commands change state
- effects do not
- input routing and layout ownership stay explicit

### 5. Do not let legacy planning surfaces become the source of truth again

The current truth lives in:

- legends
- backlog items
- design docs
- tests

This document is a summary of that truth, not a replacement for it.

## Near-term recommendation

If choosing the next few cycles now, the intended sequence is:

1. `RE-006`
2. `DX-001`
3. `RE-007`
4. `DX-002`

Then reassess before `RE-006` / `RE-007` based on how much the new runtime seams changed the shell and public API surface.

## Living-document note

This should be updated whenever the center of gravity changes.

If a different legend becomes the primary line, this document should say so plainly instead of assuming people will infer it from scattered backlog files.
