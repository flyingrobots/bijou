# DF-018 — Raise DOGFOOD Coverage Floor to 84%

Legend:

- [DF — DOGFOOD Field Guide](/Users/james/git/bijou/docs/legends/DF-dogfood-field-guide.md)

Depends on:

- [DF-017 — Raise DOGFOOD Coverage Floor to 79%](/Users/james/git/bijou/docs/design/DF-017-raise-dogfood-coverage-floor-to-79-percent.md)

## Why this cycle exists

With the major browsing families in place, DOGFOOD still needed to prove Bijou’s expressive edge:

- `loadRandomLogo()` / `gradientText()` for **Expressive branding and decorative emphasis**
- `canvas()` for **Motion and shader effects**

## Scope of this cycle

This cycle intentionally covers:

- expressive branding
- motion and shader effects
- moving DOGFOOD from `31/35` to at least `33/35` families
- clearing the declared `84%` floor

## Human users

### Primary human user

A builder evaluating whether Bijou can teach expressive and animated surfaces honestly instead of treating them as decorative afterthoughts.

### Human hill

A user can see how branding and motion belong in Bijou without confusing those surfaces for everyday productivity chrome.

## Agent users

### Primary agent user

An agent filling remaining coverage gaps without overusing spectacle or inventing fake browser-only effects.

### Agent hill

An agent can only satisfy DF-018 by adding real branding and shader stories with honest non-motion lowerings.

## Human playback

1. A user opens the branding story and sees deliberate but bounded emphasis.
2. They open the motion story and see shader-driven visual output with clear reduced-fidelity lowerings.

## Agent playback

1. An agent reads DF-018 and sees the two expressive families still missing.
2. It adds those stories.
3. The coverage floor clears 84%.

## Linked invariants

- [Tests Are the Spec](/Users/james/git/bijou/docs/invariants/tests-are-the-spec.md)
- [Docs Are the Demo](/Users/james/git/bijou/docs/invariants/docs-are-the-demo.md)

## Implementation outline

1. Add the branding and motion stories.
2. Verify the families are present.
3. Spawn the final DOGFOOD completion cycle.

## Tests to write first

Under `tests/cycles/DF-018/`:

- the cycle doc has the required workflow sections
- DOGFOOD preserves expressive-branding and motion/shader coverage
- the floor is at least 84 with the next target at least 89
- the next cycle exists

## Retrospective

### What landed

- DOGFOOD now teaches rare brand emphasis through `loadRandomLogo()` and `gradientText()`
- DOGFOOD now teaches deliberate shader/motion surfaces through `canvas()`

### Drift from ideal

No material drift.

### Debt spawned

Spawned:

- [DF-019 — Raise DOGFOOD Coverage Floor to 100%](/Users/james/git/bijou/docs/design/DF-019-raise-dogfood-coverage-floor-to-100-percent.md)
