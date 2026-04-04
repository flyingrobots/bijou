# DF-023 — Publish Repo, Package, And Release Guides In DOGFOOD

Legend: [DF — DOGFOOD Field Guide](../legends/DF-dogfood-field-guide.md)

Depends on:

- [DF-021 — Shape DOGFOOD As Terminal Docs System](./DF-021-shape-dogfood-as-terminal-docs-system.md)
- [DF-022 — Build Prose Docs Reader And Top-Level DOGFOOD Nav](./DF-022-build-prose-docs-reader-and-top-level-dogfood-nav.md)

## Sponsor human

A builder or evaluator who expects DOGFOOD to explain the Bijou repo,
its published packages, and the current release line without sending
them back out into scattered repo files.

## Sponsor agent

An agent that must answer:

- what packages ship in the workspace and what each one is for
- where the repo says to start reading
- what changed in `4.1.0`
- how a `v4.0.0` user should approach the `4.1.0` upgrade

## Hill

DOGFOOD stops treating `Packages` and `Release` as placeholder tabs and
starts acting like a real terminal docs product for those topics. A user
can reach repo orientation, package explainers, and `4.1.0`
release/migration material from inside the app.

## Why this cycle exists

`DF-022` gave DOGFOOD the shell shape of a docs site, but it still only
proved the shape. The newly visible `Packages` and `Release` sections
were honest placeholders, not the actual corpus.

That was good enough to clarify the next blocker, but not good enough to
ship `4.1.0` honestly.

If DOGFOOD is the canonical docs surface for this release, it cannot
keep outsourcing repo/package/release understanding to filesystem spelunking.

## Playback questions

1. Can a user open a repo-orientation page inside `Guides`?
2. Does `Packages` now expose explainer pages for the shipped workspace
   packages instead of only an overview placeholder?
3. Does `Release` now expose the actual `4.1.0` long-form `What's New`
   and migration guidance inside the docs app?
4. Do the signposts and blocker lane stop pretending `DF-023` is still
   open?
5. Is the remaining `4.1.0` DOGFOOD blocker work now narrower:
   philosophy/doctrine corpus plus the examples/smoke posture shift?

## Accessibility / assistive reading posture

The newly published corpus must remain keyboard-first, scrollable, and
text-legible inside the existing three-pane reader. No screenshot-only
or color-only explanation is allowed.

## Localization / directionality posture

This cycle does not translate the new prose corpus, but it must keep the
reader on the same localizable shell and section model established in
`DF-022`.

## Agent inspectability / explainability posture

An agent should be able to prove closure by inspecting:

- the DOGFOOD app corpus declarations
- the new cycle doc
- the `v4.1.0` blocker lane
- the release signposts
- the cycle tests

## Non-goals

- closing the philosophy/architecture/doctrine blocker (`DF-024`)
- replacing the package READMEs or release docs as their own repo-owned
  sources
- finishing the examples-to-DOGFOOD posture shift
- changing the `4.1.0` version decision

## Decision

For `4.1.0`, DOGFOOD should publish the existing repo/package/release
corpus through the prose-doc reader instead of keeping those sections as
stubs.

The source of truth remains the repo-owned docs and package READMEs.
DOGFOOD is the canonical human-facing reading surface for them.

## Implementation outline

1. Add a repo-orientation page under `Guides`.
2. Publish package explainer pages for the shipped workspace packages in
   `Packages`.
3. Publish the `4.1.0` long-form `What's New` and migration guides in
   `Release`.
4. Update the starter overview pages so they no longer claim that the
   package and release corpus is missing.
5. Move `DF-023` from the `v4.1.0` blocker lane into `docs/design/` and
   update the signposts/tests.

## Evidence

- DOGFOOD now exposes a `Documentation Map` guide
- the `Packages` section contains per-package explainer pages
- the `Release` section contains `What's New in v4.1.0` and
  `Migration Guide v4.1.0`
- the active `v4.1.0` blocker lane no longer lists `DF-023`

## Retrospective

The important correction is not just "more text exists." The correction
is that DOGFOOD now behaves more like a real docs product:

- repo orientation lives inside the app
- package understanding lives inside the app
- release understanding lives inside the app

That leaves the remaining blocker work more honest and more focused:

- [DF-024 — Publish Philosophy, Architecture, And Doctrine Guides In DOGFOOD](./DF-024-publish-philosophy-architecture-and-doctrine-guides-in-dogfood.md)
- [DF-026 — Demote Examples To Secondary Reference Status](./DF-026-demote-examples-to-secondary-reference-status.md)
- [WF-003 — Replace `smoke:examples:*` With `smoke:dogfood`](../BACKLOG/v4.1.0/WF-003-replace-smoke-examples-with-smoke-dogfood.md)
