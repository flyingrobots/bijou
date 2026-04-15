# DF-004 — Raise DOGFOOD Coverage Floor to the Next 5-Point Target

Legend:

- [DF — DOGFOOD Field Guide](../legends/DF-dogfood-field-guide.md)

Depends on:

- [DF-003 — Enforce DOGFOOD Coverage Floor](./DF-003-enforce-dogfood-coverage-floor.md)
- [DF-002 — Expand DOGFOOD Component Family Coverage](../method/graveyard/legacy-backlog/DF-002-expand-dogfood-component-family-coverage.md)

## Why this cycle exists

DF-003 made the current DOGFOOD coverage floor executable.

That was necessary, but it still left the honest next step untouched:

- DOGFOOD only documents 3 of 35 component families
- the enforced floor is 9%
- the next declared target is 14%

This cycle exists to earn that next target honestly by documenting enough additional component families that the floor can be raised without gaming the metric.

## Scope of this cycle

This cycle intentionally covers:

- adding enough real DOGFOOD component stories to move coverage from 3 to 5 families
- raising the enforced floor from 9% to 14%
- raising the next declared target from 14% to 19%
- proving the result through cycle tests and the existing gate script

It does **not** include:

- pretending every component now has full docs coverage
- changing the canonical family denominator
- inventing placeholder stories with no real use/avoid/lowering guidance
- broad DOGFOOD shell or navigation redesign

## Human users

### Primary human user

A builder evaluating whether DOGFOOD is becoming meaningfully more complete over time.

They need:

- the progress bar and ratio to move for a real reason
- newly documented families to be legitimate, not filler
- the CI gate to reflect actual content growth

### Human hill

A user can see that DOGFOOD is more complete than before, and the reported progress corresponds to real newly documented families they can browse.

## Agent users

### Primary agent user

An agent tasked with growing DOGFOOD coverage while preserving honesty.

It needs:

- an explicit target to hit
- a clear smallest honest route to that target
- tests that prove the new stories count toward canonical family coverage

### Agent hill

An agent can raise the DOGFOOD floor to the next target only by adding real story coverage that the gate and docs app both recognize.

## Human playback

1. A user enters DOGFOOD.
2. The docs pane reports a higher coverage percentage than before.
3. The higher value corresponds to newly browseable component stories instead of a policy-only change.
4. The user can open those new stories and see real usage guidance, variants, and lowering notes.

## Agent playback

1. An agent opens the DF-004 cycle doc.
2. It can see that the target is 14%, which requires 5 covered families out of the current 35.
3. It adds real stories for the smallest credible uncovered families.
4. The cycle tests and gate script both confirm that coverage is now 14% and the floor can be raised safely.
5. The next 5-point target is recorded for the following cycle.

## Linked invariants

- [Tests Are the Spec](../invariants/tests-are-the-spec.md)
- [Visible Controls Are a Promise](../invariants/visible-controls-are-a-promise.md)
- [Docs Are the Demo](../invariants/docs-are-the-demo.md)

## Invariants for this cycle

- the floor must only move after real coverage moves
- every newly counted family must have an actual DOGFOOD story with real docs guidance
- the gate must reflect the new floor and the next declared target
- the denominator must still come from the canonical component-family reference

## Implementation outline

1. Move DF-004 into the active cycle area and enrich it with playbacks and invariants.
2. Write failing cycle tests that demand:
   - 14% coverage
   - 5 documented families out of 35
   - two newly covered family ids
   - a raised floor of 14 with a next target of 19
3. Add the smallest honest new DOGFOOD stories needed to hit the target.
4. Update the coverage floor policy and keep the gate green.
5. Close the cycle and spawn the next ratchet backlog item.

## Tests to write first

Under `tests/cycles/DF-004/`:

- the active cycle doc includes the required workflow sections
- DOGFOOD coverage resolves to 5 of 35 families and 14%
- the story catalog now covers `Inline status` and `Inline shortcut cues`
- the enforced floor is 14 and the next target is 19
- the next DOGFOOD backlog item exists

## Risks

- adding superficial stories that technically count but do not teach
- bumping the floor before the content really exists
- choosing families that distort the docs app navigation without improving the field guide much

## Out of scope

- complete DOGFOOD component coverage
- localization work
- shell interaction redesign
- changing the coverage metric itself

## Retrospective

### What landed

- new DOGFOOD stories for `badge()` and `kbd()`
- canonical family coverage increased from `3/35` to `5/35`
- DOGFOOD docs coverage now resolves to `14%`
- the enforced floor moved from `9%` to `14%`
- the next declared target moved from `14%` to `19%`

### Drift from ideal

No material drift.

This cycle stayed intentionally narrow: two honest families, one ratchet step, and no fake breadth.

### Debt spawned

Spawned:

- [DF-005 — Raise DOGFOOD Coverage Floor to 19%](./DF-005-raise-dogfood-coverage-floor-to-19-percent.md)
