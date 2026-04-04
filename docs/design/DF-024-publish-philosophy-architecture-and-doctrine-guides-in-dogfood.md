# DF-024 — Publish Philosophy, Architecture, And Doctrine Guides In DOGFOOD

Legend: [DF — DOGFOOD Field Guide](../legends/DF-dogfood-field-guide.md)

Depends on:

- [DF-021 — Shape DOGFOOD As Terminal Docs System](./DF-021-shape-dogfood-as-terminal-docs-system.md)
- [DF-022 — Build Prose Docs Reader And Top-Level DOGFOOD Nav](./DF-022-build-prose-docs-reader-and-top-level-dogfood-nav.md)
- [DF-023 — Publish Repo, Package, And Release Guides In DOGFOOD](./DF-023-publish-repo-package-and-release-guides-in-dogfood.md)

## Sponsor human

A builder or maintainer who wants DOGFOOD to explain not just what
Bijou exports, but why the framework is shaped the way it is.

## Sponsor agent

An agent that must answer:

- what doctrine governs Bijou runtime and modeling decisions
- how the repo is architected
- which invariants matter
- where the design-system and UX stance live

## Hill

The `Philosophy` section in DOGFOOD stops being a placeholder and
becomes a real reader-first home for doctrine, architecture, invariants,
and design-system guidance.

## Why this cycle exists

After `DF-023`, DOGFOOD could explain the repo, the package line, and
the release line, but it still could not explain Bijou's design stance
without sending users back into raw repo docs.

That was the last major corpus gap keeping DOGFOOD from acting like a
real docs product for `4.1.0`.

## Playback questions

1. Does the `Philosophy` section now expose more than an overview page?
2. Are key doctrine and architecture docs reachable from inside the app?
3. Can a user read runtime-truth doctrine, architecture, invariants,
   and design-system guidance without leaving DOGFOOD?
4. Do the blocker lane and signposts stop pretending `DF-024` is still
   open?
5. Are the remaining `4.1.0` blockers now only the examples/smoke
   posture items?

## Accessibility / assistive reading posture

The newly published corpus must remain scrollable, keyboard-first, and
text-legible inside the existing prose-reader shell.

## Localization / directionality posture

This cycle does not translate the doctrine corpus, but it must keep the
same localizable shell and section posture established in `DF-022`.

## Agent inspectability / explainability posture

An agent should be able to prove closure by inspecting:

- the new `Philosophy` guide entries in the DOGFOOD app
- the cycle doc
- the updated `v4.1.0` blocker lane
- the release signposts
- the cycle tests

## Non-goals

- replacing the source docs under `docs/`
- finishing the examples-to-DOGFOOD posture shift
- replacing the release smoke contract
- changing the `4.1.0` version decision

## Decision

For `4.1.0`, DOGFOOD should publish the key doctrine and architecture
corpus through the `Philosophy` section instead of treating that section
as an empty promise.

The repo-owned docs remain the source of truth. DOGFOOD becomes the
canonical human-facing reading surface for them.

## Implementation outline

1. Keep the `Philosophy` overview page, but update it to describe the
   now-published corpus.
2. Publish the key doctrine and architecture pages inside the prose
   reader:
   - `System-Style JavaScript`
   - `Architecture`
   - `Bijou UX Doctrine`
   - `Invariants`
   - `Design System Overview`
3. Update the section posture so `Philosophy` no longer reads like a
   placeholder in the info pane or overview copy.
4. Move `DF-024` from the `v4.1.0` blocker lane into `docs/design/` and
   update the signposts/tests.

## Evidence

- DOGFOOD now exposes multiple doctrine and architecture pages under
  `Philosophy`
- the `Philosophy` section no longer claims that the corpus is missing
- the active `v4.1.0` blocker lane no longer lists `DF-024`

## Retrospective

This is the point where DOGFOOD stops being only a component field guide
plus support docs and starts carrying the framework's actual beliefs
about itself.

That leaves the `4.1.0` blockers tighter and more operational:

- [DF-026 — Demote Examples To Secondary Reference Status](./DF-026-demote-examples-to-secondary-reference-status.md)
- [WF-003 — Replace `smoke:examples:*` With `smoke:dogfood`](./WF-003-replace-smoke-examples-with-smoke-dogfood.md)
