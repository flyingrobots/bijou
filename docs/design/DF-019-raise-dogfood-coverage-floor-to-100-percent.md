# DF-019 — Raise DOGFOOD Coverage Floor to 100%

Legend:

- [DF — DOGFOOD Field Guide](../legends/DF-dogfood-field-guide.md)

Depends on:

- [DF-018 — Raise DOGFOOD Coverage Floor to 84%](./DF-018-raise-dogfood-coverage-floor-to-84-percent.md)

## Why this cycle exists

The final remaining DOGFOOD gap was the last two authoring/feedback families:

- `pushNotification()` / `renderNotificationStack()` for **Transient app notifications**
- `renderByMode()` for **Mode-aware custom primitives**

Landing those two families completes the current component-family map:

- `35/35` families documented
- `100%` component-family coverage
- the coverage floor saturates at `100%` because there is no higher honest target

## Scope of this cycle

This cycle intentionally covers:

- transient app notifications
- mode-aware custom primitives
- full DOGFOOD family coverage
- saturating the coverage floor and next target at `100%`

It does **not** promise that every family already has maximum depth or every imaginable variant story.

## Human users

### Primary human user

A builder evaluating whether DOGFOOD has crossed from “credible partial field guide” to “complete component-family map.”

### Human hill

A user can browse DOGFOOD and trust that every currently documented component family in the canonical reference is represented by a real story.

## Agent users

### Primary agent user

An agent closing out the coverage ratchet honestly, with no placeholder or denominator games.

### Agent hill

An agent can only satisfy DF-019 by making `resolveDogfoodDocsCoverage(COMPONENT_STORIES)` return `35/35` and by proving the final two families are present.

## Human playback

1. A user opens the transient-app-notifications story and sees live app-owned transient notices distinct from the broader notification-system history story.
2. They open the mode-aware custom primitive story and see one semantic primitive lowering honestly across modes.
3. The DOGFOOD coverage card reports full family coverage.

## Agent playback

1. An agent reads DF-019 and sees the final two missing families.
2. It adds those stories.
3. The coverage gate saturates at `100%`.

## Linked invariants

- [Tests Are the Spec](../invariants/tests-are-the-spec.md)
- [Docs Are the Demo](../invariants/docs-are-the-demo.md)
- [Graceful Lowering Preserves Meaning](../invariants/graceful-lowering-preserves-meaning.md)

## Implementation outline

1. Add the final two missing stories.
2. Prove DOGFOOD now covers every component family in the canonical reference.
3. Saturate the floor and next target at `100%`.
4. Spawn a non-ratchet follow-on backlog item for deepening quality and variants.

## Tests to write first

Under `tests/cycles/DF-019/`:

- the cycle doc has the required workflow sections
- DOGFOOD resolves to `35/35` documented families and `100%`
- the final two family ids are present
- the floor and next target are both `100%`
- the next non-ratchet DOGFOOD backlog item exists

## Retrospective

### What landed

- DOGFOOD now teaches app-owned transient notification behavior distinctly from the broader notification-system history surface
- DOGFOOD now teaches mode-aware custom primitives through `renderByMode()`
- the story catalog resolves to `35/35` families and `100%` coverage
- the coverage floor and next target both saturate at `100%`

### Drift from ideal

No material drift.

DOGFOOD now covers the whole component-family map. The remaining work is depth, sharper examples, and better variant richness rather than missing families.

### Debt spawned

Spawned:

- [DF-020 — Deepen DOGFOOD Story Depth and Variant Quality](../BACKLOG/DF-020-deepen-dogfood-story-depth-and-variant-quality.md)
