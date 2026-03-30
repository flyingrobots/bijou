# DF-008 — Raise DOGFOOD Coverage Floor to 34%

Legend:

- [DF — DOGFOOD Field Guide](/Users/james/git/bijou/docs/legends/DF-dogfood-field-guide.md)

Depends on:

- [DF-007 — Raise DOGFOOD Coverage Floor to 29%](/Users/james/git/bijou/docs/design/DF-007-raise-dogfood-coverage-floor-to-29-percent.md)

## Why this cycle exists

DF-007 proved the coverage ratchet can keep moving while staying focused on real product value.

The next promised step is now explicit:

- DOGFOOD currently documents 11 of 35 component families
- the enforced floor is 29%
- the next declared target is 34%

This cycle exists to earn that next target through the documentation-oriented families that make DOGFOOD feel more like a real field guide: bounded markdown prose and explicit linked destinations.

## Scope of this cycle

This cycle intentionally covers:

- adding enough real DOGFOOD component stories to move coverage from 11 to 13 families
- documenting `markdown()` as the bounded formatted-document family
- documenting `hyperlink()` as the explicit link/destination family
- raising the enforced floor from 29% to 34%
- raising the next declared target from 34% to 39%

It does **not** include:

- broad docs-shell redesign
- full reference-doc navigation or pager workflows
- introducing new component families into the canonical denominator
- pretending DOGFOOD is now complete

## Human users

### Primary human user

A builder evaluating whether DOGFOOD can now teach reference-style prose and explicit links as real Bijou surfaces instead of only showcasing status, overlays, and inspection panes.

They need:

- one story that shows `markdown()` as bounded structured prose, not a substitute layout engine
- one story that shows `hyperlink()` as an honest terminal destination primitive with fallback behavior
- coverage progress that rises only because those documentation-oriented families are genuinely present

### Human hill

A user can open DOGFOOD, learn when to use `markdown()` and `hyperlink()`, and see the coverage number rise because the field guide now actually covers those reference surfaces.

## Agent users

### Primary agent user

An agent tasked with continuing the DOGFOOD ratchet without turning it into shallow catalog filler.

It needs:

- a clear smallest honest route from 29% to 34%
- tests that prove which documentation-oriented families were added
- one integration check that the new story is reachable through the docs app itself

### Agent hill

An agent can raise DOGFOOD to the 34% floor only by adding real `markdown()` and `hyperlink()` stories, and the cycle tests prove both the coverage increase and the new floor policy.

## Human playback

1. A user enters DOGFOOD and opens the new markdown story.
2. They can see bounded reference prose with headings, lists, and links rendered honestly.
3. They open the new hyperlink story and see explicit destination labels and fallback behavior instead of vague “click here” copy.
4. The docs coverage card reports a higher percentage that corresponds to those real new stories.

## Agent playback

1. An agent opens the DF-008 cycle doc.
2. It can see that the target floor is 34%, which can be cleared by adding one family, but the cycle intentionally documents two related documentation families.
3. It adds real `markdown()` and `hyperlink()` stories.
4. It updates the floor policy only after those stories exist.
5. The cycle tests and gate confirm that coverage is now 37%, which safely clears the 34% floor, and the next target is recorded as 39%.

## Linked invariants

- [Tests Are the Spec](/Users/james/git/bijou/docs/invariants/tests-are-the-spec.md)
- [Docs Are the Demo](/Users/james/git/bijou/docs/invariants/docs-are-the-demo.md)
- [Visible Controls Are a Promise](/Users/james/git/bijou/docs/invariants/visible-controls-are-a-promise.md)

## Invariants for this cycle

- the floor must move only after real coverage moves
- `markdown()` coverage must teach bounded structured prose, not application chrome masquerading as markdown
- `hyperlink()` coverage must keep destinations explicit and meaningful instead of relying on generic labels
- the new families must be backed by real DOGFOOD stories
- the denominator must still come from the canonical component-family reference

## Implementation outline

1. Move DF-008 into the active cycle area and enrich it with playbacks and invariants.
2. Write failing cycle tests that demand:
   - 13 of 35 documented families and 37% real coverage
   - coverage of `Formatted documents and prose` and `Linked destinations`
   - an enforced floor of 34 with a next target of 39
   - real `markdown()` and `hyperlink()` stories in DOGFOOD
3. Add the smallest honest DOGFOOD stories needed to hit the target.
4. Raise the floor policy and spawn the next ratchet backlog item.
5. Close the cycle with retrospective notes describing what actually landed.

## Tests to write first

Under `tests/cycles/DF-008/`:

- the active cycle doc includes the required workflow sections
- DOGFOOD coverage resolves to 13 of 35 families and 37%
- the story catalog now covers `Formatted documents and prose` and `Linked destinations`
- the enforced floor is 34 and the next target is 39
- the next DOGFOOD backlog item exists

And in the DOGFOOD preview integration bar:

- the new markdown story is reachable in component search and renders recognizable bounded document content

## Risks

- making the markdown story look like a generic blob of prose instead of a bounded structured document
- making the hyperlink story feel redundant with markdown links instead of explaining explicit destination handling
- overloading DOGFOOD with long prose blocks that crowd the existing three-pane shell

## Out of scope

- full docs-reader navigation
- pager/localization follow-on work
- shell help/localized directional surfaces
- complete DOGFOOD coverage

## Retrospective

### What landed

- new real `markdown()` DOGFOOD story teaching bounded structured prose
- new real `hyperlink()` DOGFOOD story teaching explicit linked destinations and fallback behavior
- canonical family coverage increased from `11/35` to `13/35`
- DOGFOOD docs coverage now resolves to `37%`, which safely clears the `34%` floor
- the enforced floor moved from `29%` to `34%`
- the next declared target moved from `34%` to `39%`

### Drift from ideal

No material drift.

The cycle stayed focused on documentation-oriented surfaces instead of adding another status primitive, which makes DOGFOOD more credible as a field guide rather than only a component catalog.

### Debt spawned

Spawned:

- [DF-009 — Raise DOGFOOD Coverage Floor to 39%](/Users/james/git/bijou/docs/BACKLOG/DF-009-raise-dogfood-coverage-floor-to-39-percent.md)
