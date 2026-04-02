# DF-010 — Raise DOGFOOD Coverage Floor to 44%

Legend:

- [DF — DOGFOOD Field Guide](../legends/DF-dogfood-field-guide.md)

Depends on:

- [DF-009 — Raise DOGFOOD Coverage Floor to 39%](./DF-009-raise-dogfood-coverage-floor-to-39-percent.md)

## Why this cycle exists

DF-009 made DOGFOOD more credible as a guide to real decision flows by documenting `confirm()` and `multiselect()`.

The next promised step is now explicit:

- DOGFOOD currently documents 15 of 35 component families
- the enforced floor is 39%
- the next declared target is 44%

This cycle exists to earn that next target through one more honest input family and one more honest content-organization family:

- `select()` / `filter()` for **Single choice**
- `tabs()` for **Peer navigation**

## Scope of this cycle

This cycle intentionally covers:

- adding enough real DOGFOOD component stories to move coverage from 15 to 17 families
- documenting `select()` / `filter()` as the **Single choice** family
- documenting `tabs()` as the **Peer navigation** family
- raising the enforced floor from 39% to 44%
- raising the next declared target from 44% to 49%

It does **not** include:

- full text-entry coverage
- stepper/breadcrumb/paginator/path doctrine work
- live embedded form execution inside DOGFOOD
- changing the canonical denominator

## Human users

### Primary human user

A builder evaluating whether DOGFOOD can now teach real one-choice prompts and peer navigation instead of stopping at multi-choice forms and passive display surfaces.

They need:

- one story that explains when to use `select()` versus `filter()` without pretending they are different family headings
- one story that explains `tabs()` as peer navigation instead of progress or hierarchy
- coverage progress that rises only because those family headings are genuinely represented

### Human hill

A user can open DOGFOOD, learn when to use `select()` / `filter()` and `tabs()`, and trust the higher coverage percentage because those new families are actually present in the field guide.

## Agent users

### Primary agent user

An agent tasked with continuing the DOGFOOD ratchet without gaming the denominator or adding shallow filler.

It needs:

- the smallest honest route from 39% to 44%
- tests that prove which new family headings were added
- a clear rule that one family story can represent multiple related primitives when the canonical family heading is shared

### Agent hill

An agent can raise DOGFOOD to the 44% floor only by adding real `select()` / `filter()` and `tabs()` stories, and the cycle tests prove the coverage increase, the new family ids, and the next target.

## Human playback

1. A user enters DOGFOOD and opens the new `select() / filter()` story.
2. They can see one variant where a visible list resolves to one selected value and another where search narrows a larger one-choice set.
3. They open the new `tabs()` story and see peer sections that share one workspace without implying progress or hierarchy.
4. The docs coverage card reports a higher percentage that corresponds to those real new family headings.

## Agent playback

1. An agent opens the DF-010 cycle doc.
2. It can see that the target floor is 44% and that the intended route is `single-choice` plus `peer-navigation`.
3. It adds real DOGFOOD stories for those families.
4. It updates the floor policy only after those stories exist.
5. The cycle tests and gate confirm that coverage is now 49%, which safely clears the 44% floor, and the next target is recorded as 49%.

## Linked invariants

- [Tests Are the Spec](../invariants/tests-are-the-spec.md)
- [Docs Are the Demo](../invariants/docs-are-the-demo.md)
- [Visible Controls Are a Promise](../invariants/visible-controls-are-a-promise.md)

## Invariants for this cycle

- the floor must move only after real coverage moves
- `select()` / `filter()` coverage must stay about choosing one durable value, not command dispatch
- `tabs()` coverage must stay about peer navigation, not progress or hierarchy
- the new family headings must be backed by real DOGFOOD stories
- the denominator must still come from the canonical component-family reference

## Implementation outline

1. Move DF-010 into the active cycle area and enrich it with playbacks and invariants.
2. Write failing cycle tests that demand:
   - 17 of 35 documented families and 49% real coverage
   - coverage of `Single choice` and `Peer navigation`
   - an enforced floor of 44 with a next target of 49
   - real `select()` / `filter()` and `tabs()` stories in DOGFOOD
3. Add the smallest honest DOGFOOD stories needed to hit the target.
4. Raise the floor policy and spawn the next ratchet backlog item.
5. Close the cycle with retrospective notes describing what actually landed.

## Tests to write first

Under `tests/cycles/DF-010/`:

- the active cycle doc includes the required workflow sections
- DOGFOOD coverage resolves to 17 of 35 families and 49%
- the story catalog now covers `Single choice` and `Peer navigation`
- the enforced floor is 44 and the next target is 49
- the next DOGFOOD backlog item exists

And in the DOGFOOD preview integration bar:

- the new `tabs()` story is reachable in component search and renders recognizable peer-navigation content

## Risks

- making the `select()` / `filter()` story feel like a fake embedded terminal instead of an honest reference snapshot
- making `tabs()` read like steps or breadcrumbs instead of sibling section switching
- raising the floor without making the new family headings actually teach anything useful

## Out of scope

- `input()`
- `wizard()` and `group()`
- stepper/paginator/breadcrumb coverage
- complete DOGFOOD coverage

## Retrospective

### What landed

- a new real `select() / filter()` DOGFOOD story teaching visible-list and searchable single-choice prompts under one honest family heading
- a new real `tabs()` DOGFOOD story teaching peer navigation without confusing it with progress or hierarchy
- canonical family coverage increased from `15/35` to `17/35`
- DOGFOOD docs coverage now resolves to `49%`, which safely clears the `44%` floor
- the enforced floor moved from `39%` to `44%`
- the next declared target moved from `44%` to `49%`

### Drift from ideal

No material drift.

The cycle stayed disciplined about family honesty: `select()` and `filter()` share one family heading, so the field guide teaches them together instead of pretending they each justify a separate ratchet increment.

### Debt spawned

Spawned:

- [DF-011 — Raise DOGFOOD Coverage Floor to 49%](./DF-011-raise-dogfood-coverage-floor-to-49-percent.md)
