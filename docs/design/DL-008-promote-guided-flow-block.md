# DL-008 — Promote Guided Flow Block

Legend: [DL — Design Language](../legends/DL-design-language.md)

## Why this cycle exists

DL-005 proved the guided-flow side of the design language through
`explainability()`.

That gave Bijou one canonical component seam, but not yet a reusable
block for calmer non-AI assistance surfaces.

The design-system block acceptance bar says a structure is ready to
become a canonical block when:

- it recurs across more than one surface or product need
- its interaction ownership is stable
- its patterns are already canonical elsewhere
- its lowering story is explicit

This cycle exists to clear that next bar by promoting guided-flow
language into a reusable block helper instead of leaving explainability
to carry every calm recommendation or setup surface by itself.

## Scope of this cycle

This cycle intentionally covers:

- one reusable `guidedFlow()` block helper in `@flyingrobots/bijou`
- block-level section rhythm, multi-step assistance, and next-action treatment
- reuse of the same block rhythm by `explainability()`
- proof of the block in DOGFOOD

It does **not** include:

- a wizard runtime or step-routing subsystem
- shell-owned guided-flow overlays or drawer state
- AI/service integrations beyond existing explainability work
- layout and viewport formalization

## Human users

### Primary human user

A builder composing one calm guided recommendation, setup brief, or
review path without inventing a full wizard or hiding the action inside
generic prose.

They need:

- one reusable block that separates summary, steps, supporting context,
  and next action
- a calmer default than another titled box with ad hoc copy
- a path that works for both AI and non-AI guided assistance
- lowering that preserves the same meaning in pipe and accessible modes

### Human hill

A builder can render one guided recommendation or setup path with a
clear next action and calmer multi-step structure without hand-rolling
the same section rhythm again.

## Agent users

### Primary agent user

An agent generating or auditing guided-assistance surfaces in Bijou.

It needs:

- one block-level helper to target instead of reconstructing section
  rhythm from raw strings
- proof that explainability is now one specialization of a broader
  guided-flow block language
- explicit boundaries between content-block ownership and shell/workflow
  ownership

### Agent hill

An agent can point to one canonical `guidedFlow()` helper, show that
`explainability()` now rides the same block rhythm, and prove the block
in DOGFOOD.

## Human playback

1. A builder opens DOGFOOD and inspects the `guidedFlow()` story.
2. The story shows summary, steps, supporting context, and one obvious
   next action inside one calm grouped surface.
3. The builder compares that story with `explainability()`.
4. The shared rhythm is visible, but explainability still keeps its AI
   provenance and evidence semantics.
5. The builder can now choose between a generic guided flow and an AI
   explainability surface instead of forcing everything through one
   specialized component.

## Agent playback

1. An agent opens the DL-008 cycle doc.
2. It can identify the promoted seam as `guidedFlow()` in the core
   package.
3. It can run cycle and package tests and see proof for direct
   guided-flow rendering, explainability reuse, and DOGFOOD presence.
4. It can point to the next design-language backlog item once the cycle
   is closed.

## Linked invariants

- [Tests Are the Spec](../invariants/tests-are-the-spec.md)
- [Graceful Lowering Preserves Meaning](../invariants/graceful-lowering-preserves-meaning.md)
- [Visible Controls Are a Promise](../invariants/visible-controls-are-a-promise.md)
- [Docs Are the Demo](../invariants/docs-are-the-demo.md)

## Invariants for this cycle

- guided-flow promotion must not force shell ownership into a core block
- `explainability()` must remain AI-specific even while sharing block rhythm
- one obvious next action must stay more visible than supporting prose
- pipe and accessible modes must preserve summary, steps, sections, and
  next action without decorative chrome
- the promoted block must be proven in at least one non-AI surface

## Implementation outline

1. Move DL-008 into the active cycle area and enrich it with playbacks
   and invariants.
2. Write failing cycle and package tests for a reusable `guidedFlow()`
   block plus explainability reuse.
3. Implement `guidedFlow()` in `@flyingrobots/bijou`.
4. Refactor `explainability()` onto the shared guided-flow rhythm.
5. Prove the block in DOGFOOD and update the design-system language.
6. Close the cycle and point the legend at the next live design-language
   item.

## Tests to write first

Under `tests/cycles/DL-008/`:

- the active cycle doc includes the required workflow sections
- `guidedFlow()` renders calmer multi-step assistance and one explicit
  next action
- `explainability()` still preserves AI-specific guided-flow semantics
- DOGFOOD proves the promoted block
- the next design-language backlog item exists

## Risks

- making the block so generic that it loses the rhythm it is meant to
  standardize
- letting explainability collapse into generic guidance and lose AI
  specificity
- overreaching into shell routing or wizard ownership before the block
  itself is stable

## Out of scope

- generalized workflow state machines
- shell-owned guided-flow overlays
- editable step state
- layout and viewport doctrine work

## Retrospective

### What landed

- a new `guidedFlow()` block helper in `@flyingrobots/bijou`
- shared guided-flow rhythm between the new block and `explainability()`
- DOGFOOD proof for the generic non-AI guided-flow case
- cycle and package tests that make the block promotion executable

### Drift from ideal

This cycle did not introduce a wizard runtime or shell-owned workflow
surface.

That was intentional and correct.

The right promotion step was the calmer content block first, not a
larger shell workflow subsystem.

### Debt spawned

Next:

- [DL-009 — Formalize Layout and Viewport Rules](../method/graveyard/legacy-backlog/v5.0.0/DL-009-formalize-layout-and-viewport-rules.md)
