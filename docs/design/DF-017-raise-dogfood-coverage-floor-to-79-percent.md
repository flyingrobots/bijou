# DF-017 — Raise DOGFOOD Coverage Floor to 79%

Legend:

- [DF — DOGFOOD Field Guide](/Users/james/git/bijou/docs/legends/DF-dogfood-field-guide.md)

Depends on:

- [DF-016 — Raise DOGFOOD Coverage Floor to 74%](/Users/james/git/bijou/docs/design/DF-016-raise-dogfood-coverage-floor-to-74-percent.md)

## Why this cycle exists

The field guide still lacked structural browsing families:

- `tree()` / `filePickerSurface()` for **Hierarchy**
- `timeline()` / `dag()` for **Temporal or dependency views**

## Scope of this cycle

This cycle intentionally covers:

- hierarchy
- temporal or dependency views
- moving DOGFOOD from `29/35` to at least `31/35` families
- clearing the declared `79%` floor

## Human users

### Primary human user

A builder trying to decide when to show a tree, a file browser, a timeline, or a dependency graph.

### Human hill

A user can open DOGFOOD and directly compare hierarchy-oriented and time/dependency-oriented teaching surfaces.

## Agent users

### Primary agent user

An agent broadening DOGFOOD without flattening every remaining family into one generic “advanced views” card.

### Agent hill

An agent can only satisfy DF-017 by adding real hierarchy and temporal/dependency stories that use the shipped primitives.

## Human playback

1. A user opens the hierarchy story and sees both passive tree structure and a file-browser snapshot.
2. They open the temporal/dependency story and see both chronology and causal structure.

## Agent playback

1. An agent reads the target families for DF-017.
2. It adds real hierarchy and temporal/dependency stories.
3. The coverage floor clears 79%.

## Linked invariants

- [Tests Are the Spec](/Users/james/git/bijou/docs/invariants/tests-are-the-spec.md)
- [Docs Are the Demo](/Users/james/git/bijou/docs/invariants/docs-are-the-demo.md)

## Implementation outline

1. Add hierarchy and temporal/dependency stories.
2. Prove the new families in tests.
3. Spawn the next cycle.

## Tests to write first

Under `tests/cycles/DF-017/`:

- the cycle doc has the required workflow sections
- DOGFOOD preserves hierarchy and temporal/dependency coverage
- the floor is at least 79 with the next target at least 84
- the next cycle exists

## Retrospective

### What landed

- DOGFOOD now teaches `tree()` / `filePickerSurface()` under **Hierarchy**
- DOGFOOD now teaches `timeline()` / `dag()` under **Temporal or dependency views**

### Drift from ideal

No material drift.

### Debt spawned

Spawned:

- [DF-018 — Raise DOGFOOD Coverage Floor to 84%](/Users/james/git/bijou/docs/design/DF-018-raise-dogfood-coverage-floor-to-84-percent.md)
