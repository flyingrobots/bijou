# DL-002 — Canonicalize Patterns and Blocks

Legend: [DL — Design Language](/Users/james/git/bijou/docs/legends/DL-design-language.md)

## Why this cycle exists

DL-001 captured the doctrine layer.

That was necessary, but it still leaves Bijou with a gap between:

- doctrine
- component families
- shell/product work

This cycle exists to bridge that gap by making the most proven Bijou interaction language explicit:

- selection treatment
- active-region treatment
- drawer and panel rhythm
- preference-row/value layout
- the difference between patterns and future blocks

## Scope of this cycle

This cycle intentionally covers:

- documenting canonical patterns in the design-system layer
- explicitly defining what Bijou means by a block
- identifying the first credible block candidates
- updating the Design System read order so patterns and blocks are both first-class
- spawning the next backlog slice for proving these patterns in shared surfaces

It does **not** include:

- shipping a full blocks library
- replacing the app frame with a new block system
- inventing new shell behavior
- reworking notification center polish, which remains parked on the Humane Terminal backlog

## Human users

### Primary human user

A Bijou builder or maintainer trying to turn doctrine into reusable interface decisions.

They need to know:

- which interaction treatments are canonical
- what visual language means selection versus focus versus support text
- how future blocks should be composed without inventing a parallel design language

### Human hill

A builder can point to concrete Bijou patterns and block rules instead of translating abstract doctrine into ad hoc component choices.

## Agent users

### Primary agent user

An agent reviewing or generating Bijou UI work.

It needs to:

- identify whether a surface follows canonical selection and spacing rules
- distinguish a reusable pattern from a future reusable block
- know which next cycle should turn the documented patterns into more shared code

### Agent hill

An agent can evaluate or propose Bijou surfaces against explicit pattern language instead of inferring those rules from scattered shell code.

## Human playback

1. A maintainer opens the Design System docs.
2. They can find an explicit explanation of canonical selection treatment, active-region treatment, drawer rhythm, and value-overflow behavior.
3. They can tell what counts as a block and why blocks come after patterns and components.
4. They can see the next backlog item for turning those documented patterns into more shared product surfaces.

## Agent playback

1. An agent reads the DL legend and DL-002 cycle doc.
2. It can locate the design-system docs that define canonical patterns and block rules.
3. It can determine whether selection, focus, and spacing treatments are now documented in one place.
4. It can point to the next backlog item for implementation-oriented follow-through.

## Linked invariants

- [Tests Are the Spec](/Users/james/git/bijou/docs/invariants/tests-are-the-spec.md)
- [Focus Owns Input](/Users/james/git/bijou/docs/invariants/focus-owns-input.md)
- [Visible Controls Are a Promise](/Users/james/git/bijou/docs/invariants/visible-controls-are-a-promise.md)
- [Graceful Lowering Preserves Meaning](/Users/james/git/bijou/docs/invariants/graceful-lowering-preserves-meaning.md)
- [Docs Are the Demo](/Users/james/git/bijou/docs/invariants/docs-are-the-demo.md)

## Invariants for this cycle

- background fill should remain the canonical selected-item treatment
- structural accents such as gutters should remain the canonical active-region treatment
- values should stack or reflow before truncating into ambiguity
- blocks should be downstream of doctrine, patterns, and components
- notification work remains parked while the design-language bridge is made explicit

## Implementation outline

1. Move DL-002 into the active cycle area and enrich it with playbacks and invariants.
2. Write cycle tests that demand:
   - canonical pattern language in the design-system docs
   - an explicit blocks document
   - updated design-system read order
   - a spawned follow-on backlog item
3. Update the design-system docs so the canonical patterns are written down where builders will actually read them.
4. Close the cycle with a retrospective and next-step backlog item.

## Tests to write first

Under `tests/cycles/DL-002/`:

- the active cycle doc includes the required workflow sections
- the design-system docs explicitly define canonical selection, active-region, spacing, and overflow patterns
- the design-system docs explicitly define what a block is and name the first block candidates
- the Design Language legend points at DL-002 as the latest completed cycle and spawns the next backlog item

## Risks

- documenting patterns too vaguely to guide implementation reviews
- duplicating doctrine without actually bridging it into builder-facing docs
- overcommitting to blocks before the component/pattern vocabulary is stable

## Out of scope

- implementation of a reusable blocks runtime
- service-level notification work
- localization adapters or other legend work

## Retrospective

### What landed

- explicit canonical-pattern guidance in `docs/design-system/patterns.md` for:
  - selected rows
  - active regions
  - truthful visible controls
  - spacing rhythm
  - value-overflow behavior
- a new `docs/design-system/blocks.md` document that defines what a block is, where it sits in the design-system stack, and which first candidates are credible
- updated design-system read order in `docs/design-system/README.md`

### Drift from ideal

No material drift.

This cycle stayed documentation-first on purpose. It names the canonical patterns and block layer clearly, but it does not yet prove those rules in more shared implementation surfaces.

### Debt spawned

Spawned:

- [DL-003 — Prove Canonical Patterns in Shared Surfaces](/Users/james/git/bijou/docs/BACKLOG/DL-003-prove-canonical-patterns-in-shared-surfaces.md)
