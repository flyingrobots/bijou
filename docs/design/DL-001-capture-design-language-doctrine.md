# DL-001 — Capture Design Language Doctrine

Legend: [DL — Design Language](../legends/DL-design-language.md)

## Why this cycle exists

Bijou already has strong local instincts:

- truthful controls
- focus ownership
- humane shell behavior
- canonical preference-list treatment
- localization and accessibility ambition

But those instincts are still split across:

- shell work
- DOGFOOD polish
- scattered strategy notes
- conversation context

This cycle exists to turn those instincts into explicit design language.

## Scope of this cycle

This cycle intentionally covers:

- creating a dedicated Design Language legend
- capturing doctrine for:
  - mouse input
  - cognitive load
  - accessibility and assistive posture
  - localization and bidirectionality
  - AI explainability
  - content style
- parking notification polish explicitly on the Humane Terminal backlog so doctrine work can lead

It does **not** include:

- implementing notification polish
- shipping new shell or component behavior
- creating the full blocks library

The point is to make the north star explicit before more product surfaces drift.

## Human users

### Primary human user

A Bijou builder or maintainer deciding how new shell and component work should feel.

They need to:

- reason about product quality above the component level
- know which UX choices are canonical
- understand how accessibility, i18n, copy, and explainability fit together

### Human hill

A builder can describe Bijou’s design language as a coherent system rather than a pile of good-looking exceptions.

## Agent users

### Primary agent user

An agent generating, auditing, or reviewing Bijou UX work.

It needs to:

- evaluate UX changes against written doctrine
- distinguish invariant violations from taste disagreements
- reason about humans and agents as separate first-class audiences

### Agent hill

An agent can review or propose Bijou UX with explicit doctrine, playbacks, and backlog direction instead of inferring unwritten norms.

## Human playback

1. A maintainer opens the design-language docs.
2. They can identify the relevant doctrine for shell behavior, accessibility, localization, AI, and copy.
3. They can see why notifications are parked on the backlog rather than being the next reactive polish slice.
4. They can point to a next backlog item for turning doctrine into reusable patterns and blocks.

## Agent playback

1. An agent reads the design-language legend and cycle doc.
2. It can locate the doctrine docs that govern shell and component UX.
3. It can locate the parked notification backlog item.
4. It can identify the next follow-on cycle for patterns/blocks.

## Linked invariants

- [Tests Are the Spec](../invariants/tests-are-the-spec.md)
- [Focus Owns Input](../invariants/focus-owns-input.md)
- [Visible Controls Are a Promise](../invariants/visible-controls-are-a-promise.md)
- [Graceful Lowering Preserves Meaning](../invariants/graceful-lowering-preserves-meaning.md)
- [Docs Are the Demo](../invariants/docs-are-the-demo.md)

## Invariants for this cycle

- doctrine should remain above component inventory
- agents remain first-class users in design thinking, not an afterthought
- notification work should stay parked as backlog while doctrine is captured
- future blocks should follow doctrine and patterns, not precede them

## Deliverable

Land a design-language legend and enrich the doctrine set so Bijou has explicit guidance for:

- humane interaction
- accessibility
- localization
- AI explainability
- content

Then park notification polish on the backlog and spawn the next design-language backlog item for patterns and blocks.

## Tests to write first

Under `tests/cycles/DL-001/`:

- the Design Language legend exists and links to the doctrine set
- the active cycle doc includes human/agent playbacks and linked invariants
- the doctrine docs explicitly mention the newly captured concerns:
  - mouse input
  - cognitive load
  - localization catalogs / references / spreadsheet reality
  - `[AI]` labeling
  - future blocks
- notification polish is explicitly parked on the Humane Terminal backlog

## Risks

- creating a second doctrine layer that duplicates existing notes without clarifying them
- keeping the design language too abstract to guide actual reviews
- letting notification work stay implied instead of explicitly parked

## Out of scope

- implementing notification-center improvements
- blocks library implementation
- new shell or component code

## Retrospective

### What landed

- a dedicated Design Language legend:
  - `docs/legends/DL-design-language.md`
- enriched doctrine across:
  - `docs/strategy/bijou-ux-doctrine.md`
  - `docs/strategy/accessibility-and-assistive-modes.md`
  - `docs/strategy/localization-and-bidirectionality.md`
  - `docs/strategy/ai-explainability-standard.md`
  - `docs/strategy/content-guide.md`
- an explicit Humane Terminal backlog item for notification polish:
  - `docs/method/retro/HT_001-notification-center-polish-and-discoverability.md`

### Drift from ideal

No material drift.

This cycle intentionally stayed documentation-only and did not try to fold the doctrine into code or new shell surfaces yet.

### Debt spawned

Spawned:

- [DL-002 — Canonicalize Patterns and Blocks](../method/graveyard/legacy-backlog/DL-002-canonicalize-patterns-and-blocks.md)
