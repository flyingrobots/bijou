# DF-015 — Raise DOGFOOD Coverage Floor to 69%

Legend:

- [DF — DOGFOOD Field Guide](../legends/DF-dogfood-field-guide.md)

Depends on:

- [DF-014 — Raise DOGFOOD Coverage Floor to 64%](./DF-014-raise-dogfood-coverage-floor-to-64-percent.md)

## Why this cycle exists

After shell and layout coverage, the next missing gap was navigation structure:

- `accordion()` / `interactiveAccordion()` for **Progressive disclosure**
- `breadcrumb()` / `stepper()` / `paginator()` for **Path and progress**

## Scope of this cycle

This cycle intentionally covers:

- progressive disclosure
- path and progress
- moving DOGFOOD from `25/35` to at least `27/35` families
- clearing the declared `69%` floor

It does **not** include data-browsing or authoring families yet.

## Human users

### Primary human user

A builder choosing between peers, steps, disclosure, and wayfinding patterns inside a real terminal product.

### Human hill

A user can see both summary-first disclosure and explicit path/progress patterns in DOGFOOD without inferring them from prose alone.

## Agent users

### Primary agent user

An agent continuing the ratchet through real navigation-oriented stories.

### Agent hill

An agent can only satisfy DF-015 by adding real progressive-disclosure and path/progress coverage, not by relabeling an existing story.

## Human playback

1. A user opens a disclosure story and sees summary-first sections plus the keyboard-owned accordion path.
2. They open a path/progress story and see breadcrumbs, steppers, and pagination patterns in one bounded field-guide surface.

## Agent playback

1. An agent reads the target families for DF-015.
2. It adds those stories and raises the floor only after they exist.

## Linked invariants

- [Tests Are the Spec](../invariants/tests-are-the-spec.md)
- [Docs Are the Demo](../invariants/docs-are-the-demo.md)

## Implementation outline

1. Add real navigation-organization stories.
2. Prove the coverage increase in tests.
3. Spawn the next cycle.

## Tests to write first

Under `tests/cycles/DF-015/`:

- the cycle doc has the required workflow sections
- the story catalog preserves progressive-disclosure and path/progress coverage
- the floor is at least 69 with the next target at least 74
- the next cycle exists

## Retrospective

### What landed

- DOGFOOD now teaches progressive disclosure through `accordion()` and `interactiveAccordion()`
- DOGFOOD now teaches path and progress through `breadcrumb()`, `stepper()`, and `paginator()`

### Drift from ideal

No material drift.

### Debt spawned

Spawned:

- [DF-016 — Raise DOGFOOD Coverage Floor to 74%](./DF-016-raise-dogfood-coverage-floor-to-74-percent.md)
