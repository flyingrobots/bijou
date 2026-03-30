# DF-009 — Raise DOGFOOD Coverage Floor to 39%

Legend:

- [DF — DOGFOOD Field Guide](/Users/james/git/bijou/docs/legends/DF-dogfood-field-guide.md)

Depends on:

- [DF-008 — Raise DOGFOOD Coverage Floor to 34%](/Users/james/git/bijou/docs/design/DF-008-raise-dogfood-coverage-floor-to-34-percent.md)

## Why this cycle exists

DF-008 made DOGFOOD feel more like a field guide by documenting bounded prose and explicit linked destinations.

The next promised step is now explicit:

- DOGFOOD currently documents 13 of 35 component families
- the enforced floor is 34%
- the next declared target is 39%

This cycle exists to earn that next target through two core form families that make DOGFOOD more credible as a guide to real decisions and set-building flows: `confirm()` and `multiselect()`.

## Scope of this cycle

This cycle intentionally covers:

- adding enough real DOGFOOD component stories to move coverage from 13 to 15 families
- documenting `confirm()` as the binary-decision family
- documenting `multiselect()` as the multiple-choice family
- raising the enforced floor from 34% to 39%
- raising the next declared target from 39% to 44%

It does **not** include:

- full form-group or wizard coverage
- replacing the docs app with live interactive form execution
- changing the canonical denominator
- pretending DOGFOOD now covers the whole form system

## Human users

### Primary human user

A builder evaluating whether DOGFOOD can now teach real input and decision primitives instead of only display, feedback, and docs-reference surfaces.

They need:

- one story that shows `confirm()` as a real binary-decision prompt with honest defaults and consequences
- one story that shows `multiselect()` as a real set-building flow with keyboard toggling and fallback semantics
- coverage progress that rises only because those families are genuinely present

### Human hill

A user can open DOGFOOD, learn when to use `confirm()` and `multiselect()`, and see the coverage number rise because the field guide now actually covers those decision/input families.

## Agent users

### Primary agent user

An agent tasked with continuing the DOGFOOD ratchet without adding shallow filler stories.

It needs:

- a clear smallest honest route from 34% to 39%
- tests that prove which decision/input families were added
- one integration check that the new form stories are reachable through the docs app itself

### Agent hill

An agent can raise DOGFOOD to the 39% floor only by adding real `confirm()` and `multiselect()` stories, and the cycle tests prove both the coverage increase and the new floor policy.

## Human playback

1. A user enters DOGFOOD and opens the new `confirm()` story.
2. They can see a real binary-decision prompt with an explicit default and concrete yes/no consequences.
3. They open the new `multiselect()` story and see a keyboard-owned set-selection flow with toggled options and truthful fallback guidance.
4. The docs coverage card reports a higher percentage that corresponds to those real new stories.

## Agent playback

1. An agent opens the DF-009 cycle doc.
2. It can see that the target floor is 39% and that the intended route is the two uncovered form families `confirm()` and `multiselect()`.
3. It adds real DOGFOOD stories for those families.
4. It updates the floor policy only after those stories exist.
5. The cycle tests and gate confirm that coverage is now 43%, which safely clears the 39% floor, and the next target is recorded as 44%.

## Linked invariants

- [Tests Are the Spec](/Users/james/git/bijou/docs/invariants/tests-are-the-spec.md)
- [Docs Are the Demo](/Users/james/git/bijou/docs/invariants/docs-are-the-demo.md)
- [Visible Controls Are a Promise](/Users/james/git/bijou/docs/invariants/visible-controls-are-a-promise.md)

## Invariants for this cycle

- the floor must move only after real coverage moves
- `confirm()` coverage must stay a genuine binary-decision story instead of becoming a hidden multi-option flow
- `multiselect()` coverage must stay about set-building, not command dispatch disguised as checkbox rows
- the new families must be backed by real DOGFOOD stories
- the denominator must still come from the canonical component-family reference

## Implementation outline

1. Move DF-009 into the active cycle area and enrich it with playbacks and invariants.
2. Write failing cycle tests that demand:
   - 15 of 35 documented families and 43% real coverage
   - coverage of `Multiple choice` and `Binary decision`
   - an enforced floor of 39 with a next target of 44
   - real `confirm()` and `multiselect()` stories in DOGFOOD
3. Add the smallest honest DOGFOOD stories needed to hit the target.
4. Raise the floor policy and spawn the next ratchet backlog item.
5. Close the cycle with retrospective notes describing what actually landed.

## Tests to write first

Under `tests/cycles/DF-009/`:

- the active cycle doc includes the required workflow sections
- DOGFOOD coverage resolves to 15 of 35 families and 43%
- the story catalog now covers `Multiple choice` and `Binary decision`
- the enforced floor is 39 and the next target is 44
- the next DOGFOOD backlog item exists

And in the DOGFOOD preview integration bar:

- the new `confirm()` story is reachable in component search and renders recognizable binary-decision content

## Risks

- making the stories look like fake diagrams instead of truthful prompt snapshots
- making the multiselect story read like a generic checklist instead of a real set-building flow
- documenting forms in a way that overpromises interactivity that DOGFOOD does not actually execute inside the preview pane

## Out of scope

- `group()` and `wizard()`
- live embedded form execution inside DOGFOOD
- shell redesign
- complete DOGFOOD coverage

## Retrospective

### What landed

- new real `confirm()` DOGFOOD story teaching explicit binary decisions with honest defaults
- new real `multiselect()` DOGFOOD story teaching set-building prompts with keyboard toggling and truthful textual fallbacks
- canonical family coverage increased from `13/35` to `15/35`
- DOGFOOD docs coverage now resolves to `43%`, which safely clears the `39%` floor
- the enforced floor moved from `34%` to `39%`
- the next declared target moved from `39%` to `44%`

### Drift from ideal

No material drift.

The cycle stayed focused on genuine form and decision families instead of adding another passive display surface, which makes DOGFOOD more credible as a guide to actual interaction patterns.

### Debt spawned

Spawned:

- [DF-010 — Raise DOGFOOD Coverage Floor to 44%](/Users/james/git/bijou/docs/design/DF-010-raise-dogfood-coverage-floor-to-44-percent.md)
