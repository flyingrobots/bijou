# DF-014 — Raise DOGFOOD Coverage Floor to 64%

Legend:

- [DF — DOGFOOD Field Guide](/Users/james/git/bijou/docs/legends/DF-dogfood-field-guide.md)

Depends on:

- [DF-013 — Raise DOGFOOD Coverage Floor to 59%](/Users/james/git/bijou/docs/design/DF-013-raise-dogfood-coverage-floor-to-59-percent.md)

## Why this cycle exists

DF-013 proved that DOGFOOD could teach shell help and the notification system honestly.

The next promised step was to keep the ratchet moving by documenting the shell frame itself instead of only shell-adjacent surfaces:

- `createFramedApp()` / `statusBarSurface()` / `commandPaletteSurface()` for **App shell**
- `splitPaneSurface()` / `gridSurface()` for **Workspace layout**

## Scope of this cycle

This cycle intentionally covers:

- adding the app-shell family to DOGFOOD
- adding the workspace-layout family to DOGFOOD
- moving the field guide from `23/35` families to at least `25/35`
- clearing the declared `64%` floor

It does **not** include:

- progressive disclosure or path/progress teaching
- data-browsing families
- final DOGFOOD completion

## Human users

### Primary human user

A builder deciding whether Bijou can teach whole application framing and spatial composition, not only individual widgets.

### Human hill

A user can open DOGFOOD and understand when to use shell chrome versus page content, and when split/grid layout is honest instead of decorative geometry.

## Agent users

### Primary agent user

An agent continuing the coverage ratchet without padding the numerator with cosmetic stories.

### Agent hill

An agent can only satisfy DF-014 by adding real app-shell and workspace-layout stories and by proving the floor moved because those families are now actually present.

## Human playback

1. A user opens a new shell story and sees framed app chrome plus command discovery.
2. They open a workspace-layout story and see split and grid composition with clearly named regions.
3. The DOGFOOD coverage card rises because those two families are now real.

## Agent playback

1. An agent reads DF-014 and sees the target pair: app shell plus workspace layout.
2. It adds real stories using the shipped shell and layout APIs.
3. The coverage tests confirm that DOGFOOD now clears the 64% floor.

## Linked invariants

- [Tests Are the Spec](/Users/james/git/bijou/docs/invariants/tests-are-the-spec.md)
- [Docs Are the Demo](/Users/james/git/bijou/docs/invariants/docs-are-the-demo.md)
- [Visible Controls Are a Promise](/Users/james/git/bijou/docs/invariants/visible-controls-are-a-promise.md)

## Implementation outline

1. Move DF-014 into the active cycle area.
2. Add real app-shell and workspace-layout stories.
3. Raise the ratchet only after those families exist.
4. Spawn the next DOGFOOD cycle.

## Tests to write first

Under `tests/cycles/DF-014/`:

- the cycle doc has the required workflow sections
- DOGFOOD preserves app-shell and workspace-layout coverage
- the floor is at least 64 with the next target at least 69
- the next DOGFOOD cycle exists

## Retrospective

### What landed

- DOGFOOD now teaches `createFramedApp()` / `statusBarSurface()` / `commandPaletteSurface()` under the **App shell** family
- DOGFOOD now teaches `splitPaneSurface()` / `gridSurface()` under the **Workspace layout** family
- later cycles pushed the floor higher, but this slice remains one honest ratchet step in that larger climb

### Drift from ideal

No material drift.

### Debt spawned

Spawned:

- [DF-015 — Raise DOGFOOD Coverage Floor to 69%](/Users/james/git/bijou/docs/design/DF-015-raise-dogfood-coverage-floor-to-69-percent.md)
