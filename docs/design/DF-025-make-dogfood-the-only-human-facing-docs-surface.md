# DF-025 — Make DOGFOOD The Only Human-Facing Docs Surface

Legend: [DF — DOGFOOD Field Guide](../legends/DF-dogfood-field-guide.md)

Depends on:

- [DF-021 — Shape DOGFOOD As Terminal Docs System](./DF-021-shape-dogfood-as-terminal-docs-system.md)
- [DF-022 — Build Prose Docs Reader And Top-Level DOGFOOD Nav](./DF-022-build-prose-docs-reader-and-top-level-dogfood-nav.md)

## Sponsor human

A builder or maintainer who should have exactly one obvious answer to
"where do I go to learn Bijou?"

## Sponsor agent

An agent that must determine, from repo artifacts alone, whether the
public docs surface is DOGFOOD or the `examples/` tree.

## Hill

DOGFOOD is the only human-facing docs surface for Bijou. The `examples/`
tree remains useful, but only as a secondary/internal reference,
regression, and migration substrate rather than a competing public docs
front door.

## Why this cycle exists

The repo currently carries two conflicting truths:

- strategy docs say DOGFOOD should replace example sprawl as the living
  docs system
- front-door docs and release validation still treat `examples/` as a
  first-class public teaching path

That is not a harmless wording issue.

If humans still have to browse `examples/README.md` to understand the
product, then DOGFOOD is not actually the docs surface yet. It is just a
better example.

For `4.1.0`, Bijou needs a sharper stance:

- DOGFOOD is where humans should learn Bijou
- example programs are secondary and should not compete with DOGFOOD for
  repo-front-door authority
- release smoke should follow the same truth instead of continuing to
  bless the broad examples tree as the main proving surface

## Human users

### Primary human user

A curious builder evaluating Bijou and trying to find the canonical docs
path quickly.

### Human hill

A human can read the root docs surfaces and recover one clear story:

- start with DOGFOOD
- use package docs and design docs as supporting corpus
- treat `examples/` as secondary reference material, not as the main
  product documentation surface

## Agent users

### Primary agent user

An agent updating docs, release automation, or backlog placement.

### Agent hill

An agent can point to explicit repo artifacts showing:

- DOGFOOD is canonical
- example inventory is secondary
- the remaining release blockers needed to make runtime smoke and docs
  posture match that decision

## Playback questions

1. If a human asks "where do I start learning Bijou?", do the front-door
   docs point to DOGFOOD first?
2. Does `examples/README.md` clearly read as a secondary/internal
   inventory instead of a public docs hub?
3. Do METHOD signposts and release blockers explicitly say that
   `smoke:examples:*` is no longer acceptable as the release-facing end
   state?
4. Does the repo have a clear blocker capturing the remaining work to
   demote examples behind DOGFOOD?

## Accessibility / assistive reading posture

This is a docs-information-architecture cycle. The important accessibility
requirement is clarity: people using plain-text docs, terminal readers,
or agent tooling should not have to infer canon from inconsistent link
placement or filenames.

## Localization / directionality posture

This cycle does not add new localized copy requirements. It does require
that section naming and docs routing remain cleanly separable from
English-only filesystem trivia such as `examples/docs`.

## Agent inspectability / explainability posture

The DOGFOOD-only decision must be visible in:

- this cycle doc
- the `v4.1.0` blocker lane
- signposts such as `PLAN.md`, `BEARING.md`, and `release.md`
- front-door docs such as `README.md` and `docs/README.md`

Agents should not have to rely on chat memory to learn that `examples/`
has been demoted.

## Non-goals

- deleting the entire `examples/` tree immediately
- pretending every example should disappear
- relocating every implementation file currently under `examples/docs/`
- eliminating every migration/reference example before `4.1.0`

The immediate requirement is policy honesty and release-blocker clarity,
not blind deletion.

## Evidence

### Current contradiction

- `docs/strategy/dogfood.md` says DOGFOOD should stop docs, demos,
  examples, and tests from drifting apart
- `docs/EXAMPLES.md` already says DOGFOOD is the primary living-docs
  surface
- but the root docs still expose `examples/README.md` as a public map,
  and release readiness still depends on `smoke:examples:*`

### Why that matters

If examples remain both:

- a public docs front door
- and the main release smoke contract

then DOGFOOD cannot honestly be called "the only way" yet.

## Decision

### Public-docs rule for `4.1.0`

For `4.1.0`, DOGFOOD is the only human-facing docs surface.

That means:

- root docs should send humans to DOGFOOD first
- package/design/release corpus should be reachable through DOGFOOD
- the example inventory should read as secondary/internal/reference
  material
- release smoke should move off the broad `examples/` tree

### Example posture

Examples still matter, but their role is narrower:

- migration references
- isolated API seam proofs
- targeted regression fixtures
- implementation sandboxes

They do **not** get to remain a competing public docs navigation layer.

## Deliverables from this shaping cycle

This cycle should tighten the `4.1.0` blocker lane by:

- keeping [DF-023 — Publish Repo, Package, And Release Guides In DOGFOOD](./DF-023-publish-repo-package-and-release-guides-in-dogfood.md)
  as a release blocker
- keeping [DF-024 — Publish Philosophy, Architecture, And Doctrine Guides In DOGFOOD](./DF-024-publish-philosophy-architecture-and-doctrine-guides-in-dogfood.md)
  as a release blocker
- moving [WF-003 — Replace `smoke:examples:*` With `smoke:dogfood`](./WF-003-replace-smoke-examples-with-smoke-dogfood.md)
  into the `v4.1.0` blocker lane
- spawning [DF-026 — Demote Examples To Secondary Reference Status](./DF-026-demote-examples-to-secondary-reference-status.md)
  as an explicit docs-surface blocker

## Implementation outline

1. Publish a repo-owned DOGFOOD entrypoint under `docs/`.
2. Rewrite front-door docs so DOGFOOD is the only obvious learning path.
3. Reframe the example inventory as secondary/internal/reference.
4. Move the smoke migration item into the active release-blocker lane.
5. Keep the remaining release blockers explicit instead of pretending
   the policy is already fully implemented.

## Tests to write first

Under `tests/cycles/DF-025/`:

- the cycle doc exists and contains the DOGFOOD-only decision
- a repo-owned DOGFOOD entrypoint exists under `docs/`
- `WF-003` now lives in `docs/BACKLOG/v4.1.0/`
- the `v4.1.0` blocker lane lists `DF-023`, `DF-024`, `DF-026`, and
  `WF-003`
- `README.md`, `docs/README.md`, and `docs/release.md` acknowledge the
  DOGFOOD-only posture

## Risks

- overswinging into "delete examples" theater before DOGFOOD and smoke
  coverage actually replace them
- keeping the implementation physically under `examples/docs/` long
  enough that humans still infer the wrong authority from the path
- leaving release validation on `smoke:examples:*` long enough that the
  repo continues to reward the old posture

## Ready when

- front-door docs treat DOGFOOD as the only human-facing docs path
- the example inventory is clearly secondary/internal
- `WF-003` is promoted into the `v4.1.0` blocker lane
- `DF-026` exists to capture the remaining example-demotion work needed
  before release
