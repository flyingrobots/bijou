# DF-016 — Raise DOGFOOD Coverage Floor to 74%

Legend:

- [DF — DOGFOOD Field Guide](../legends/DF-dogfood-field-guide.md)

Depends on:

- [DF-015 — Raise DOGFOOD Coverage Floor to 69%](./DF-015-raise-dogfood-coverage-floor-to-69-percent.md)

## Why this cycle exists

Once navigation patterns were covered, the next missing field-guide gap was straightforward browsing:

- `table()` / `navigableTableSurface()` for **Dense comparison**
- `enumeratedList()` / `browsableListSurface()` for **Lists for exploration**

## Scope of this cycle

This cycle intentionally covers:

- dense comparison
- lists for exploration
- moving DOGFOOD from `27/35` to at least `29/35` families
- clearing the declared `74%` floor

## Human users

### Primary human user

A builder deciding whether a record should be a table, an exploration list, or something more structural.

### Human hill

A user can see the difference between comparison-oriented tables and scan-first exploration lists by opening the stories directly.

## Agent users

### Primary agent user

An agent continuing the coverage ratchet through record-browsing surfaces.

### Agent hill

An agent can only satisfy DF-016 by adding real dense-comparison and exploration-list stories backed by the shipped APIs.

## Human playback

1. A user opens the dense-comparison story and sees both passive and focused table inspection.
2. They open the list-exploration story and see passive list reading plus browsable record inspection.

## Agent playback

1. An agent reads DF-016 and sees the target families.
2. It adds real stories for table/list browsing.
3. The coverage floor clears the 74% threshold.

## Linked invariants

- [Tests Are the Spec](../invariants/tests-are-the-spec.md)
- [Docs Are the Demo](../invariants/docs-are-the-demo.md)

## Implementation outline

1. Add real data-browsing stories.
2. Prove the new family ids in tests.
3. Spawn the next cycle.

## Tests to write first

Under `tests/cycles/DF-016/`:

- the cycle doc has the required workflow sections
- DOGFOOD preserves dense-comparison and exploration-list coverage
- the floor is at least 74 with the next target at least 79
- the next cycle exists

## Retrospective

### What landed

- DOGFOOD now teaches dense comparison through `table()` and `navigableTableSurface()`
- DOGFOOD now teaches lists for exploration through `enumeratedList()` and `browsableListSurface()`

### Drift from ideal

No material drift.

### Debt spawned

Spawned:

- [DF-017 — Raise DOGFOOD Coverage Floor to 79%](./DF-017-raise-dogfood-coverage-floor-to-79-percent.md)
