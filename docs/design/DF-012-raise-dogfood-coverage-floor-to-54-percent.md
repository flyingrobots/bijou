# DF-012 — Raise DOGFOOD Coverage Floor to 54%

Legend:

- [DF — DOGFOOD Field Guide](../legends/DF-dogfood-field-guide.md)

Depends on:

- [DF-011 — Raise DOGFOOD Coverage Floor to 49%](./DF-011-raise-dogfood-coverage-floor-to-49-percent.md)

## Why this cycle exists

DF-011 made DOGFOOD more credible around text entry plus grouped and staged form flows.

The next promised step is now explicit:

- DOGFOOD currently documents 19 of 35 component families
- the enforced floor is 49%
- the next declared target is 54%

This cycle exists to earn that next target through two calmer structural teaching surfaces that make the field guide feel broader and more production-like instead of only deeper on forms:

- `explainability()` for **Explainability walkthroughs**
- `separator()` / `separatorSurface()` for **Dividers**

## Scope of this cycle

This cycle intentionally covers:

- adding enough real DOGFOOD component stories to move coverage from 19 to 21 families
- documenting `explainability()` as the **Explainability walkthroughs** family
- documenting `separator()` / `separatorSurface()` as the **Dividers** family
- raising the enforced floor from 49% to 54%
- raising the next declared target from 54% to 59%

It does **not** include:

- a full AI-docs or assistant workflow inside DOGFOOD
- every remaining structure/navigation family like breadcrumbs, timelines, or disclosure stacks
- changing the canonical denominator
- pretending DOGFOOD now covers the full shell and block language

## Human users

### Primary human user

A builder evaluating whether DOGFOOD can now teach calmer structural and guided-flow surfaces instead of leaning too heavily on prompts, forms, and feedback widgets.

They need:

- one story that shows `explainability()` as a real recommendation surface with visible provenance, evidence, and next-action structure
- one story that shows dividers as real section rhythm rather than decorative lines
- coverage progress that rises only because those structural families are genuinely present

### Human hill

A user can open DOGFOOD, learn when to use `explainability()` and when to use `separator()` / `separatorSurface()`, and trust the higher coverage number because those families are actually represented in the field guide.

## Agent users

### Primary agent user

An agent tasked with continuing the DOGFOOD ratchet without turning the field guide into a one-note catalog of form primitives.

It needs:

- a clear smallest honest route from 49% to 54%
- tests that prove which new structural families were added
- at least one docs-app integration check that the new stories are reachable through component search

### Agent hill

An agent can raise DOGFOOD to the 54% floor only by adding real explainability and divider stories, and the cycle tests prove both the coverage increase and the new floor policy.

## Human playback

1. A user enters DOGFOOD and opens the new `explainability()` story.
2. They can see one calm guided recommendation surface with visible provenance, evidence, next action, and governance text.
3. They open the new `separator()` story and can see both labeled and unlabeled section rhythm that separates real sections without over-boxing everything.
4. The docs coverage card reports a higher percentage that corresponds to those real new stories.

## Agent playback

1. An agent opens the DF-012 cycle doc.
2. It can see that the target floor is 54% and that the intended route is `explainability-walkthroughs` plus `dividers`.
3. It adds real DOGFOOD stories for those families.
4. It updates the floor policy only after those stories exist.
5. The cycle tests and gate confirm that coverage is now 60%, which safely clears the 54% floor, and the next target is recorded as 59%.

## Linked invariants

- [Tests Are the Spec](../invariants/tests-are-the-spec.md)
- [Docs Are the Demo](../invariants/docs-are-the-demo.md)
- [Visible Controls Are a Promise](../invariants/visible-controls-are-a-promise.md)

## Invariants for this cycle

- the floor must move only after real coverage moves
- `explainability()` coverage must show provenance, evidence, and next-action structure instead of a vague summary card
- divider coverage must show real section rhythm, not decorative line spam
- the new families must be backed by real DOGFOOD stories
- the denominator must still come from the canonical component-family reference

## Implementation outline

1. Move DF-012 into the active cycle area and enrich it with playbacks and invariants.
2. Write failing cycle tests that demand:
   - 21 of 35 documented families and 60% real coverage
   - coverage of `Explainability walkthroughs` and `Dividers`
   - an enforced floor of 54 with a next target of 59
   - real `explainability()` and `separator()` / `separatorSurface()` stories in DOGFOOD
3. Add the smallest honest DOGFOOD stories needed to hit the target.
4. Raise the floor policy and spawn the next ratchet backlog item.
5. Close the cycle with retrospective notes describing what actually landed.

## Tests to write first

Under `tests/cycles/DF-012/`:

- the active cycle doc includes the required workflow sections
- DOGFOOD coverage resolves to 21 of 35 families and 60%
- the story catalog now covers `Explainability walkthroughs` and `Dividers`
- the enforced floor is 54 and the next target is 59
- the next DOGFOOD backlog item exists

And in the DOGFOOD preview integration bar:

- the new `explainability()` story is reachable in component search and renders recognizable provenance and evidence content

## Risks

- making the explainability story feel like generic marketing prose instead of a recommendation surface
- making the divider story feel like visual filler instead of honest section rhythm
- raising the floor without enough actual teaching value for builders evaluating calmer structural patterns

## Out of scope

- full AI workflow or assistant tooling inside DOGFOOD
- breadcrumbs, timelines, or disclosure-tree coverage
- complete DOGFOOD coverage

## Retrospective

### What landed

- a new real `explainability()` DOGFOOD story teaching visible provenance, evidence, governance, and next-action structure
- a new real `separator() / separatorSurface()` DOGFOOD story teaching labeled and unlabeled section rhythm
- a dedicated `examples/explainability/main.ts` example so the story points at real source instead of an invented snippet path
- canonical family coverage increased from `19/35` to `21/35`
- DOGFOOD docs coverage now resolves to `60%`, which safely clears the `54%` floor
- the enforced floor moved from `49%` to `54%`
- the next declared target moved from `54%` to `59%`

### Drift from ideal

No material drift.

The cycle stayed disciplined about broadening DOGFOOD's teaching surface instead of just adding more form primitives: the field guide now covers guided recommendation cards and calmer section boundaries without inventing a new denominator or overclaiming completeness.

### Debt spawned

Spawned:

- [DF-013 — Raise DOGFOOD Coverage Floor to 59%](./DF-013-raise-dogfood-coverage-floor-to-59-percent.md)
