# DF-006 — Raise DOGFOOD Coverage Floor to 24%

Legend:

- [DF — DOGFOOD Field Guide](../legends/DF-dogfood-field-guide.md)

Depends on:

- [DF-005 — Raise DOGFOOD Coverage Floor to 19%](./DF-005-raise-dogfood-coverage-floor-to-19-percent.md)

## Why this cycle exists

DF-005 proved the coverage ratchet can keep moving without padding the docs with fake content.

The next promised step is now explicit:

- DOGFOOD currently documents 7 of 35 component families
- the enforced floor is 19%
- the next declared target is 24%

This cycle exists to earn that next target with real field-guide coverage for structural grouping and inspector surfaces.

## Scope of this cycle

This cycle intentionally covers:

- adding enough real DOGFOOD component stories to move coverage from 7 to 9 families
- documenting `box()` as the canonical containment/grouping family
- documenting `inspector()` as the canonical side-panel inspection family
- raising the enforced floor from 19% to 24%
- raising the next declared target from 24% to 29%

It does **not** include:

- broad DOGFOOD navigation redesign
- generalized docs-side inspector tooling beyond real component stories
- pretending either family is exhaustively documented after one cycle
- changing the canonical component-family denominator

## Human users

### Primary human user

A builder evaluating whether DOGFOOD can now teach the structural surfaces that shape real Bijou apps instead of only status, loading, and overlays.

They need:

- one story that makes `box()` and `headerBox()` feel like honest grouping primitives instead of generic chrome
- one story that makes `inspector()` feel like the right side-panel summary surface rather than another arbitrary box
- coverage progress that rises only because those new families are genuinely documented

### Human hill

A user can open DOGFOOD, find real `box()` and `inspector()` stories, and see the documentation-coverage percentage rise because those two families are now honestly represented.

## Agent users

### Primary agent user

An agent tasked with continuing the DOGFOOD ratchet without gaming the number or introducing shallow filler stories.

It needs:

- a clear smallest honest route from 19% to 24%
- tests that prove exactly which two new families were added
- a content slice that uses canonical componentry instead of bespoke DOGFOOD-only display hacks

### Agent hill

An agent can raise DOGFOOD to the 24% floor only by adding real stories for `Framed grouping` and `Inspector panels`, and the cycle tests prove both the coverage increase and the new floor policy.

## Human playback

1. A user enters DOGFOOD and opens the new structural grouping story.
2. They can see both plain containment and titled panel usage through `box()` / `headerBox()`.
3. They open the new inspector story and see a calm side-panel summary with one obvious current selection and structured supporting sections.
4. The docs coverage card reports a higher percentage that corresponds to those real new stories.

## Agent playback

1. An agent opens the DF-006 cycle doc.
2. It can see that the target is 24%, which requires 9 covered families out of 35.
3. It adds real stories for `Framed grouping` and `Inspector panels`.
4. It updates the coverage policy only after those stories exist.
5. The cycle tests and gate confirm that coverage is now 26%, which safely clears the 24% floor, and the next target is recorded as 29%.

## Linked invariants

- [Tests Are the Spec](../invariants/tests-are-the-spec.md)
- [Docs Are the Demo](../invariants/docs-are-the-demo.md)
- [Visible Controls Are a Promise](../invariants/visible-controls-are-a-promise.md)

## Invariants for this cycle

- the floor must move only after real coverage moves
- `box()` coverage must teach grouping/containment, not just decorative borders
- `inspector()` coverage must teach current-selection emphasis plus calmer supporting sections
- the two new families must be backed by real stories, not only design docs or app usage elsewhere
- the denominator must still come from the canonical component-family reference

## Implementation outline

1. Move DF-006 into the active cycle area and enrich it with playbacks and invariants.
2. Write failing cycle tests that demand:
   - 9 of 35 documented families and 26% real coverage
   - coverage of `Framed grouping` and `Inspector panels`
   - an enforced floor of 24 with a next target of 29
   - real `box()` and `inspector()` stories in DOGFOOD
3. Add the smallest honest DOGFOOD stories needed to hit the target.
4. Raise the floor policy and spawn the next ratchet backlog item.
5. Close the cycle with retrospective notes describing what actually landed.

## Tests to write first

Under `tests/cycles/DF-006/`:

- the active cycle doc includes the required workflow sections
- DOGFOOD coverage resolves to 9 of 35 families and 26%
- the story catalog now covers `Framed grouping` and `Inspector panels`
- the enforced floor is 24 and the next target is 29
- the next DOGFOOD backlog item exists

And in the DOGFOOD preview integration bar:

- the new stories are reachable in the docs app and render recognizable `box()` / `inspector()` content

## Risks

- adding a grouping story that looks decorative instead of teaching real containment choices
- making `inspector()` feel redundant with the existing docs-side variant panel instead of explaining the family clearly
- moving the policy first and treating the content as catch-up instead of earned progress

## Out of scope

- complete DOGFOOD coverage
- shell-layer registry work
- localization follow-on work
- guided-flow block promotion

## Retrospective

### What landed

- new real `box()` DOGFOOD story teaching grouped containment and titled detail panels
- new real `inspector()` DOGFOOD story teaching calm side-panel summary rhythm
- canonical family coverage increased from `7/35` to `9/35`
- DOGFOOD docs coverage now resolves to `26%`, which safely clears the `24%` floor
- the enforced floor moved from `19%` to `24%`
- the next declared target moved from `24%` to `29%`

### Drift from ideal

No material drift.

The cycle stayed intentionally narrow: two real structural stories, one ratchet update, and one docs-preview integration proof that the new inspector story is reachable through DOGFOOD itself.

### Debt spawned

Spawned:

- [DF-007 — Raise DOGFOOD Coverage Floor to 29%](./DF-007-raise-dogfood-coverage-floor-to-29-percent.md)
