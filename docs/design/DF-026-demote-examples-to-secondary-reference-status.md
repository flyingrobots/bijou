# DF-026 — Demote Examples To Secondary Reference Status

Legend: [DF — DOGFOOD Field Guide](../legends/DF-dogfood-field-guide.md)

Depends on:

- [DF-025 — Make DOGFOOD The Only Human-Facing Docs Surface](./DF-025-make-dogfood-the-only-human-facing-docs-surface.md)

## Sponsor human

A learner or evaluator who should get one clear answer about where to
start reading Bijou docs, instead of being bounced between DOGFOOD and a
parallel example hub.

## Sponsor agent

An agent that must tell the difference between:

- the canonical docs surface
- the internal example inventory
- migration/reference fixtures
- smoke and regression substrate

## Hill

The repo stops presenting `examples/` as a competing docs product.
DOGFOOD is the canonical human-facing path. Examples remain valuable,
but only as secondary/internal/reference material.

## Why this cycle exists

`DF-025` set the policy direction, but policy alone was not enough.

If DOGFOOD says "start here" while the example inventory still reads
like a second docs hub, the public posture is still split.

This cycle exists to make the repo-facing surfaces honest before
`4.1.0`.

## Playback questions

1. Do front-door docs still clearly tell humans to start with DOGFOOD?
2. Does the example inventory now read as secondary/internal/reference
   instead of a public docs hub?
3. Can a user open DOGFOOD itself and understand why examples are
   secondary?
4. Do release-facing docs stop treating the example inventory as equal
   public navigation?
5. Is `WF-003` now the only remaining `4.1.0` blocker?

## Accessibility / assistive reading posture

The examples posture should be stated in text, not implied by color,
layout, or repo folklore.

## Localization / directionality posture

This cycle does not translate the example posture copy, but it must keep
the explanation inside the same localizable DOGFOOD shell.

## Agent inspectability / explainability posture

An agent should be able to prove closure by inspecting:

- `docs/DOGFOOD.md`
- `docs/EXAMPLES.md`
- `examples/README.md`
- the DOGFOOD guide corpus
- the `v4.1.0` blocker lane
- the cycle tests

## Non-goals

- deleting the whole `examples/` tree
- replacing the release smoke contract
- erasing migration or isolated API seam references that still matter

## Decision

For `4.1.0`, DOGFOOD is the only human-facing docs surface. The example
inventory remains, but it should read as:

- secondary/internal reference
- migration substrate
- isolated API proof
- regression/smoke substrate

## Implementation outline

1. Publish the secondary-example posture inside DOGFOOD itself.
2. Tighten `docs/EXAMPLES.md` so it reads as an internal reference map.
3. Tighten `examples/README.md` so it does not read like a docs hub.
4. Move `DF-026` from the `v4.1.0` blocker lane into `docs/design/` and
   update the signposts/tests.

## Evidence

- DOGFOOD now exposes a `Secondary Example Map` guide
- `docs/EXAMPLES.md` reads as a maintainer/agent-facing reference map
- `examples/README.md` explicitly reads as secondary/internal
- the active `v4.1.0` blocker lane no longer lists `DF-026`

## Retrospective

This cycle does not remove examples. It removes ambiguity about what
examples are for.

That leaves one remaining `4.1.0` blocker:

- [WF-003 — Replace `smoke:examples:*` With `smoke:dogfood`](../BACKLOG/v4.1.0/WF-003-replace-smoke-examples-with-smoke-dogfood.md)
