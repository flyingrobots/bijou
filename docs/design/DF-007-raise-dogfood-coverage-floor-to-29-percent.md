# DF-007 — Raise DOGFOOD Coverage Floor to 29%

Legend:

- [DF — DOGFOOD Field Guide](../legends/DF-dogfood-field-guide.md)

Depends on:

- [DF-006 — Raise DOGFOOD Coverage Floor to 24%](./DF-006-raise-dogfood-coverage-floor-to-24-percent.md)

## Why this cycle exists

DF-006 proved DOGFOOD can keep ratcheting upward without cheating and while still documenting real, important families.

The next promised step is now explicit:

- DOGFOOD currently documents 9 of 35 component families
- the enforced floor is 24%
- the next declared target is 29%

This cycle exists to earn that next target through real feedback-history coverage: one low-level transient overlay family and one activity-stream family.

## Scope of this cycle

This cycle intentionally covers:

- adding enough real DOGFOOD component stories to move coverage from 9 to 11 families
- documenting `toast()` as the low-level transient overlay primitive
- documenting `log()` as the canonical activity stream primitive
- raising the enforced floor from 24% to 29%
- raising the next declared target from 29% to 34%

It does **not** include:

- notification-center redesign
- shell-level history workflow changes
- pretending DOGFOOD is now complete
- changing the canonical component-family denominator

## Human users

### Primary human user

A builder evaluating whether DOGFOOD now teaches transient feedback and chronological status output clearly enough to choose the right tool.

They need:

- one story that shows `toast()` as a low-level directly composed overlay rather than a full notification system
- one story that shows `log()` as an accumulating activity stream rather than a one-off status message
- coverage progress that rises only because those families are now genuinely documented

### Human hill

A user can open DOGFOOD and understand the difference between `toast()` and `log()` as real, documented families, and the coverage number rises because that guidance is actually present.

## Agent users

### Primary agent user

An agent tasked with continuing the DOGFOOD ratchet without inflating the number through thin or redundant stories.

It needs:

- a clear smallest honest route from 24% to 29%
- tests that prove which feedback/history families were added
- integration checks that the new stories are reachable in the docs app

### Agent hill

An agent can raise DOGFOOD to the 29% floor only by adding real `toast()` and `log()` stories, and the cycle tests prove both the coverage increase and the new floor policy.

## Human playback

1. A user enters DOGFOOD and opens the new toast story.
2. They can see that `toast()` is a directly composed transient overlay, not a full notification center.
3. They open the new log story and see chronological, accumulating event output with level cues.
4. The docs coverage card reports a higher percentage that corresponds to those real new stories.

## Agent playback

1. An agent opens the DF-007 cycle doc.
2. It can see that the target floor is 29%, which can be cleared by adding at least one more family, but the cycle intentionally documents two related families.
3. It adds real `toast()` and `log()` stories.
4. It updates the floor policy only after those stories exist.
5. The cycle tests and gate confirm that coverage is now 31%, which safely clears the 29% floor, and the next target is recorded as 34%.

## Linked invariants

- [Tests Are the Spec](../invariants/tests-are-the-spec.md)
- [Docs Are the Demo](../invariants/docs-are-the-demo.md)
- [Visible Controls Are a Promise](../invariants/visible-controls-are-a-promise.md)

## Invariants for this cycle

- the floor must move only after real coverage moves
- `toast()` coverage must teach direct overlay composition and avoid pretending it is the notification center
- `log()` coverage must teach chronological accumulation rather than one-off status chrome
- the new families must be backed by real stories in DOGFOOD itself
- the denominator must still come from the canonical component-family reference

## Implementation outline

1. Move DF-007 into the active cycle area and enrich it with playbacks and invariants.
2. Write failing cycle tests that demand:
   - 11 of 35 documented families and 31% real coverage
   - coverage of `Low-level transient overlay` and `Activity stream`
   - an enforced floor of 29 with a next target of 34
   - real `toast()` and `log()` stories in DOGFOOD
3. Add the smallest honest DOGFOOD stories needed to hit the target.
4. Raise the floor policy and spawn the next ratchet backlog item.
5. Close the cycle with retrospective notes describing what actually landed.

## Tests to write first

Under `tests/cycles/DF-007/`:

- the active cycle doc includes the required workflow sections
- DOGFOOD coverage resolves to 11 of 35 families and 31%
- the story catalog now covers `Low-level transient overlay` and `Activity stream`
- the enforced floor is 29 and the next target is 34
- the next DOGFOOD backlog item exists

And in the DOGFOOD preview integration bar:

- the new toast story is reachable in component search and renders recognizable transient-overlay content

## Risks

- making `toast()` look like a notification-center substitute instead of a low-level overlay primitive
- making `log()` feel like a decorative box rather than an activity stream
- over-documenting shell notification behavior in a component-family cycle instead of keeping the scope narrow

## Out of scope

- notification-center polish cycles
- localization follow-on work
- new shell-layer behaviors
- complete DOGFOOD coverage

## Retrospective

### What landed

- new real `toast()` DOGFOOD story teaching low-level transient overlay composition
- new real `log()` DOGFOOD story teaching chronological activity-stream output
- canonical family coverage increased from `9/35` to `11/35`
- DOGFOOD docs coverage now resolves to `31%`, which safely clears the `29%` floor
- the enforced floor moved from `24%` to `29%`
- the next declared target moved from `29%` to `34%`

### Drift from ideal

No material drift.

The cycle intentionally over-earned the floor by documenting two related families instead of stopping at the minimum one-family bump required by rounding. That makes the field guide stronger without changing the ratchet contract itself.

### Debt spawned

Spawned:

- [DF-008 — Raise DOGFOOD Coverage Floor to 34%](./DF-008-raise-dogfood-coverage-floor-to-34-percent.md)
