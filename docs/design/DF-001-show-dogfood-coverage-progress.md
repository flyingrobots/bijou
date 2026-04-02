# DF-001 — Show DOGFOOD Coverage Progress

Legend: [DF — DOGFOOD Field Guide](../legends/DF-dogfood-field-guide.md)

## Why this cycle exists

We want to release Bijou without pretending DOGFOOD is already a complete reference.

The honest answer is not to block release forever. It is to make DOGFOOD visibly truthful about its current documentation coverage.

This cycle exists to put that truth directly into the initial docs experience:

- a progress indicator
- an explicit ratio
- a defensible denominator tied to the canonical component-family reference

## Scope of this cycle

This cycle intentionally covers:

- a canonical DOGFOOD coverage metric based on documented component families
- mapping current DOGFOOD stories onto that coverage model
- a docs-pane progress bar and ratio
- tests that prove the landing surface reflects real coverage instead of a hand-wavy claim

It does **not** include:

- expanding story coverage itself
- claiming feature completeness
- a broader release-management dashboard
- automatic release gating

## Human users

### Primary human user

A user opening DOGFOOD to decide how complete and trustworthy the field guide currently is.

They need:

- a clear signal that DOGFOOD is still in progress
- an honest coverage ratio
- enough context to understand that the metric is about documented component families

### Human hill

A user can open DOGFOOD and immediately see that it is a living field guide with explicit progress, not a silently incomplete reference pretending to be finished.

## Agent users

### Primary agent user

An agent maintaining DOGFOOD story coverage over time.

It needs:

- a stable coverage model
- a defensible denominator
- a way to add stories later and have the landing progress move automatically

### Agent hill

An agent can add or remove DOGFOOD story coverage and see the docs-pane progress update from real source data rather than manual copy edits.

## Human playback

1. A user launches DOGFOOD.
2. The landing screen shows the normal hero treatment.
3. The initial docs content pane shows a progress bar and ratio for current DOGFOOD documentation coverage.
4. The user understands that DOGFOOD is in progress and can see how much of the canonical family map is currently covered.

## Agent playback

1. An agent opens the DF-001 cycle doc.
2. It sees that the denominator is the canonical component-family reference, not a vague export count.
3. It runs the cycle and app tests.
4. It can verify that the docs-pane copy and progress bar are driven from real story coverage data.
5. It can point to the next backlog item for actually expanding coverage.

## Linked invariants

- [Tests Are the Spec](../invariants/tests-are-the-spec.md)
- [Visible Controls Are a Promise](../invariants/visible-controls-are-a-promise.md)
- [Docs Are the Demo](../invariants/docs-are-the-demo.md)

## Invariants for this cycle

- DOGFOOD must not imply fuller coverage than it actually has
- the coverage denominator must be explicit and stable
- adding story coverage later should update the progress metric automatically
- the title screen must not present documentation coverage as though it were a loading state
- the docs-pane coverage UI must remain secondary to the primary onboarding content

## Implementation outline

1. Create a DOGFOOD legend and coverage-focused cycle doc.
2. Define the canonical coverage denominator from the design-system component-family reference.
3. Map current DOGFOOD stories onto that family coverage model.
4. Write failing cycle and app tests for the new landing progress treatment.
5. Render a progress bar and ratio in the initial docs content pane.
6. Close the cycle and spawn the next DOGFOOD coverage backlog item.

## Tests to write first

Under `tests/cycles/DF-001/`:

- the active cycle doc includes the required workflow sections
- DOGFOOD coverage resolves from canonical family reference data
- the initial docs content surface shows the coverage ratio and percent
- the next DOGFOOD backlog item exists

## Risks

- choosing a denominator that feels arbitrary or magical
- making the title screen feel like a loading screen when it is actually a title screen
- hardcoding a number that will drift the moment a new story lands

## Out of scope

- story authoring for additional families
- docs completeness gating in CI
- release automation

## Retrospective

### What landed

- a new DOGFOOD legend
- a real coverage model based on canonical component families
- story-to-family coverage mapping
- a docs-pane progress bar and ratio that update from the current story set

### Drift from ideal

This cycle does not improve DOGFOOD coverage itself.

That is intentional. The goal here is honesty first, not pretending that a progress indicator is the same thing as documentation work.

### Debt spawned

Spawned:

- [DF-002 — Expand DOGFOOD Component Family Coverage](../BACKLOG/DF-002-expand-dogfood-component-family-coverage.md)
