# DF-011 — Raise DOGFOOD Coverage Floor to 49%

Legend:

- [DF — DOGFOOD Field Guide](/Users/james/git/bijou/docs/legends/DF-dogfood-field-guide.md)

Depends on:

- [DF-010 — Raise DOGFOOD Coverage Floor to 44%](/Users/james/git/bijou/docs/design/DF-010-raise-dogfood-coverage-floor-to-44-percent.md)

## Why this cycle exists

DF-010 made DOGFOOD more credible around one-choice prompts and peer navigation.

The next promised step is now explicit:

- DOGFOOD currently documents 17 of 35 component families
- the enforced floor is 44%
- the next declared target is 49%

This cycle exists to earn that next target through two deeper form families that move DOGFOOD closer to real application-building guidance instead of stopping at one-off prompts:

- `input()` / `textarea()` for **Text entry**
- `group()` / `wizard()` for **Multi-field and staged forms**

## Scope of this cycle

This cycle intentionally covers:

- adding enough real DOGFOOD component stories to move coverage from 17 to 19 families
- documenting `input()` / `textarea()` as the **Text entry** family
- documenting `group()` / `wizard()` as the **Multi-field and staged forms** family
- raising the enforced floor from 44% to 49%
- raising the next declared target from 49% to 54%

It does **not** include:

- live embedded text-entry execution inside DOGFOOD
- every remaining form-adjacent family like breadcrumbs, steppers, or progress trackers
- changing the canonical denominator
- pretending DOGFOOD now covers the whole input stack

## Human users

### Primary human user

A builder evaluating whether DOGFOOD can now teach richer data-entry flows instead of stopping at choice prompts and passive documentation surfaces.

They need:

- one story that shows `input()` and `textarea()` as honest short-form versus multiline text-entry work
- one story that shows `group()` and `wizard()` as related-input flows with grouping or step progression
- coverage progress that rises only because those deeper form families are genuinely present

### Human hill

A user can open DOGFOOD, learn when to use `input()` / `textarea()` and `group()` / `wizard()`, and trust the higher coverage number because those families are actually represented in the field guide.

## Agent users

### Primary agent user

An agent tasked with continuing the DOGFOOD ratchet without gaming the denominator or filling the guide with shallow visual-only surfaces.

It needs:

- a clear smallest honest route from 44% to 49%
- tests that prove which new form families were added
- at least one docs-app integration check that the new stories are reachable through component search

### Agent hill

An agent can raise DOGFOOD to the 49% floor only by adding real text-entry and staged-form stories, and the cycle tests prove both the coverage increase and the new floor policy.

## Human playback

1. A user enters DOGFOOD and opens the new `input() / textarea()` story.
2. They can see one short single-line entry example and one multiline text-entry example, with prompt and helper text staying explicit.
3. They open the new `group() / wizard()` story and can see both a grouped form snapshot and a staged step with explicit progress labeling.
4. The docs coverage card reports a higher percentage that corresponds to those real new stories.

## Agent playback

1. An agent opens the DF-011 cycle doc.
2. It can see that the target floor is 49% and that the intended route is `text-entry` plus `multi-field-and-staged-forms`.
3. It adds real DOGFOOD stories for those families.
4. It updates the floor policy only after those stories exist.
5. The cycle tests and gate confirm that coverage is now 54%, which safely clears the 49% floor, and the next target is recorded as 54%.

## Linked invariants

- [Tests Are the Spec](/Users/james/git/bijou/docs/invariants/tests-are-the-spec.md)
- [Docs Are the Demo](/Users/james/git/bijou/docs/invariants/docs-are-the-demo.md)
- [Visible Controls Are a Promise](/Users/james/git/bijou/docs/invariants/visible-controls-are-a-promise.md)

## Invariants for this cycle

- the floor must move only after real coverage moves
- `input()` / `textarea()` coverage must stay about text entry, not fake static prose dressed up as a field
- `group()` / `wizard()` coverage must keep grouping and step intent explicit instead of collapsing into one unstructured box
- the new families must be backed by real DOGFOOD stories
- the denominator must still come from the canonical component-family reference

## Implementation outline

1. Move DF-011 into the active cycle area and enrich it with playbacks and invariants.
2. Write failing cycle tests that demand:
   - 19 of 35 documented families and 54% real coverage
   - coverage of `Text entry` and `Multi-field and staged forms`
   - an enforced floor of 49 with a next target of 54
   - real `input() / textarea()` and `group() / wizard()` stories in DOGFOOD
3. Add the smallest honest DOGFOOD stories needed to hit the target.
4. Raise the floor policy and spawn the next ratchet backlog item.
5. Close the cycle with retrospective notes describing what actually landed.

## Tests to write first

Under `tests/cycles/DF-011/`:

- the active cycle doc includes the required workflow sections
- DOGFOOD coverage resolves to 19 of 35 families and 54%
- the story catalog now covers `Text entry` and `Multi-field and staged forms`
- the enforced floor is 49 and the next target is 54
- the next DOGFOOD backlog item exists

And in the DOGFOOD preview integration bar:

- the new `group() / wizard()` story is reachable in component search and renders recognizable staged-form content

## Risks

- making the text-entry story feel like a decorative text card instead of an honest field snapshot
- making the staged-form story look like a progress widget instead of a real grouped or stepwise input flow
- raising the floor without enough actual teaching value for builders evaluating form primitives

## Out of scope

- live embedded editors inside DOGFOOD
- stepper, breadcrumb, or paginator coverage
- complete DOGFOOD coverage

## Retrospective

### What landed

- a new real `input() / textarea()` DOGFOOD story teaching single-line and multiline text entry under one honest family heading
- a new real `group() / wizard()` DOGFOOD story teaching grouped and staged form flows
- canonical family coverage increased from `17/35` to `19/35`
- DOGFOOD docs coverage now resolves to `54%`, which safely clears the `49%` floor
- the enforced floor moved from `44%` to `49%`
- the next declared target moved from `49%` to `54%`

### Drift from ideal

No material drift.

The cycle stayed disciplined about family honesty: the field guide teaches paired primitives under their shared family headings instead of pretending every export deserves its own ratchet increment.

### Debt spawned

Spawned:

- [DF-012 — Raise DOGFOOD Coverage Floor to 54%](/Users/james/git/bijou/docs/BACKLOG/DF-012-raise-dogfood-coverage-floor-to-54-percent.md)
