# DL-005 — Prove Inspector and Guided Flow Rhythm

Legend: [DL — Design Language](/Users/james/git/bijou/docs/legends/DL-design-language.md)

## Why this cycle exists

DL-004 proved calmer drawer rhythm and structured notice rows in the shell notification center.

The next design-language proof should move into another likely future block candidate:

- guided flows
- explainability walkthroughs
- compact multi-section review surfaces with one obvious next action

Inspector panels are still part of the original idea, but they should not share a cycle with guided-flow proof if that forces us to invent two half-finished surfaces.

This cycle exists to prove the guided-flow side first by turning the [AI Explainability Standard](/Users/james/git/bijou/docs/strategy/ai-explainability-standard.md) into a canonical component instead of leaving it as doctrine only.

## Scope of this cycle

This cycle intentionally covers:

- one canonical `explainability()` component in `@flyingrobots/bijou`
- explicit `[AI]` labeling
- separated rationale, evidence, next action, and governance sections
- calm section rhythm for compact guided-flow review surfaces
- graceful lowering into pipe and accessible modes

It does **not** include:

- a generalized guided-flow block runtime
- inspector-panel implementation
- shell integration or notification-center changes
- service-backed AI integrations

## Human users

### Primary human user

A builder or app user reviewing an AI-mediated recommendation.

They need:

- visible `[AI]` labeling
- an explanation of why the recommendation exists
- evidence separated from the recommendation itself
- one clear next action
- a calm surface instead of a decorative wall of text

### Human hill

A user can read an AI-mediated recommendation and answer what it is, why it is here, what evidence supports it, and what they should do next without feeling like they are parsing marketing copy.

## Agent users

### Primary agent user

An agent generating or auditing guided-flow and explainability surfaces in Bijou.

It needs:

- one canonical explainability component to target
- explicit section structure rather than ad hoc copy blocks
- proof that guided-flow rhythm follows the design language and AI doctrine

### Agent hill

An agent can point to one reusable explainability surface and show that Bijou’s `[AI]`, rationale, evidence, and next-action doctrine is real code instead of only prose.

## Human playback

1. A user encounters an AI-mediated recommendation.
2. The surface marks itself visibly as `[AI]`.
3. The recommendation title appears before supporting explanation.
4. Rationale, evidence, and next action are separated into calm sections.
5. The user can see what to do next without guessing whether the recommendation is advisory or authoritative.

## Agent playback

1. An agent opens the DL-005 cycle doc.
2. It can identify the canonical proving seam as `explainability()` rather than a shell-specific one-off.
3. It can run cycle and package tests and see explicit assertions for `[AI]` labeling, section separation, and graceful lowering.
4. It can point to the next backlog item for inspector-panel proof work.

## Linked invariants

- [Tests Are the Spec](/Users/james/git/bijou/docs/invariants/tests-are-the-spec.md)
- [Graceful Lowering Preserves Meaning](/Users/james/git/bijou/docs/invariants/graceful-lowering-preserves-meaning.md)
- [Docs Are the Demo](/Users/james/git/bijou/docs/invariants/docs-are-the-demo.md)

## Invariants for this cycle

- AI-mediated explainability surfaces must mark themselves explicitly
- evidence must not be merged into recommendation copy
- the surface must present one obvious next action when that data exists
- pipe and accessible modes must preserve the same meaning without relying on borders or color
- this cycle must prove one canonical guided-flow surface before returning to inspector panels

## Implementation outline

1. Move DL-005 into the active cycle area and enrich it with playbacks and invariants.
2. Write failing cycle tests for the new explainability surface and its lowering behavior.
3. Implement `explainability()` in `@flyingrobots/bijou`.
4. Export it through the canonical component barrels.
5. Close the cycle and spawn the inspector-panel follow-on backlog item.

## Tests to write first

Under `tests/cycles/DL-005/`:

- the active cycle doc includes the required workflow sections
- `explainability()` marks AI visibly and separates rationale, evidence, and next action
- accessible lowering preserves the meaning of the same fields without visual-only cues
- the next design-language backlog item exists

## Risks

- making the component feel like AI decoration instead of explanation
- overfitting the component to one future product instead of a reusable pattern
- smuggling shell or service assumptions into a core component

## Out of scope

- inspector-panel proof work
- runtime agent integrations
- persistent review history
- generalized block promotion

## Retrospective

### What landed

- a new canonical `explainability()` component in `@flyingrobots/bijou`
- explicit `[AI]` labeling as part of the component instead of ad hoc copy
- calm section rhythm for rationale, evidence, next action, and governance
- graceful lowering that preserves the same meaning in pipe and accessible modes
- cycle and package tests that make the explainability doctrine executable instead of only descriptive

### Drift from ideal

Inspector-panel proof work did not land in this cycle.

That was intentional and correct.

Trying to prove guided-flow and inspector language in the same cycle would have forced two half-finished surfaces instead of one canonical explainability component.

### Debt spawned

Spawned:

- [DL-006 — Prove Inspector Panel Rhythm](/Users/james/git/bijou/docs/BACKLOG/DL-006-prove-inspector-panel-rhythm.md)
