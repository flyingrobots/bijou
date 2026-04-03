# WF-006 — Cut Clean 4.1.0 Release Boundary

Legend: [WF — Workflow and Delivery](../legends/WF-workflow-and-delivery.md)

## Sponsor human

A maintainer preparing the `4.1.0` release and needing the short-form
release surfaces to match the real `v4.0.0..HEAD` boundary.

## Sponsor agent

An agent that must answer, from repo artifacts alone:

- what the short-form `4.1.0` release story is
- whether `CHANGELOG.md` is aligned to `v4.0.0..HEAD`
- what a front-door README summary should say about `4.1.0`

## Hill

The short-form `4.1.0` release surfaces now tell the same story as the
long-form release docs.

`README.md`, `CHANGELOG.md`, and the long-form `docs/releases/4.1.0/`
docs all point at one coherent release boundary and one coherent release
story.

## Why this cycle exists

[WF-004](./WF-004-shape-the-next-release.md) chose `4.1.0`, and
[WF-005](./WF-005-close-4-1-0-i18n-publish-surface-gap.md) closed the
i18n publish-surface gap.

But the short-form release surfaces were still drifting:

- the root `README.md` still led with a `v4.0.0` "What's New" section
- `CHANGELOG.md` still treated `[Unreleased]` as a vague bucket instead
  of an explicit `v4.0.0..HEAD` release slice
- the compare links still implied `v3.1.0` was the previous release
- `v4.0.0` itself never got a dedicated changelog section

That meant the repo had long-form release docs but still lacked an
honest short-form release cut.

## Human users

### Primary human user

A maintainer or reviewer checking whether `4.1.0` is ready to explain
and execute.

### Human hill

A human can open the README and changelog and get an honest, concise
picture of what `4.1.0` is and how it relates to `v4.0.0`.

## Agent users

### Primary agent user

A release or coding agent preparing notes, migration guidance, or the
actual release execution.

### Agent hill

An agent can reconstruct the short-form release story from repo
artifacts alone without reverse-engineering commit history or chat
memory.

## Playback questions

1. Does `README.md` now have a concise `What's New in v4.1.0` front-door
   summary?
2. Does `CHANGELOG.md` explicitly say the current `[Unreleased]` section
   is the planned `4.1.0` slice aligned to `v4.0.0..HEAD`?
3. Does `CHANGELOG.md` now include a dedicated `4.0.0` section dated
   `2026-03-22` and corrected compare links?
4. Is `WF-006` promoted into `docs/design/`, with the temporary
   `v4.1.0/` blocker lane pruned because no cycle-shaped blockers
   remain?

## Accessibility / assistive reading posture

This cycle is text-first. The release boundary must stay legible in raw
markdown without requiring a release UI, diff viewer, or GitHub compare
page to understand it.

## Localization / directionality posture

The short-form release story must stay honest about the new localization
surface. It should not bury the i18n packages behind shell/runtime-only
language.

## Agent inspectability / explainability posture

The short-form release boundary must be inspectable through:

- `README.md`
- `docs/CHANGELOG.md`
- `docs/releases/4.1.0/`
- `docs/release.md`
- `docs/BEARING.md`
- `docs/PLAN.md`
- cycle tests

## Non-goals

- bumping versions or cutting the `4.1.0` tag
- publishing packages
- rewriting all historical changelog prose before `v4.0.0`
- changing the already-shaped `4.1.0` scope

## Evidence

### Before this cycle

- latest release tag: `v4.0.0`
- tag date for `v4.0.0`: `2026-03-22`
- `README.md` still led with `What's New in v4.0.0`
- `CHANGELOG.md` still used `[Unreleased]: ...compare/v3.1.0...HEAD`
- `CHANGELOG.md` had no dedicated `4.0.0` section

### Boundary decision

The current `[Unreleased]` section is the planned `4.1.0` release
slice. It should stay unreleased until actual release execution, but it
must already be aligned to the real `v4.0.0..HEAD` boundary.

## Decision

`WF-006` closes the short-form release gap by doing four things:

1. make `README.md` summarize `4.1.0` instead of still fronting `4.0.0`
2. explicitly mark `[Unreleased]` as the planned `4.1.0` slice in the
   changelog
3. restore a dedicated historical `4.0.0` changelog section and correct
   the compare links
4. prune the temporary `v4.1.0/` blocker lane because there are no
   cycle-shaped release blockers left

## Implementation outline

1. Replace the README's `v4.0.0` front-door summary with a concise
   `v4.1.0` summary and links to the short-form and long-form release
   docs.
2. Mark the current `[Unreleased]` changelog section as the planned
   `4.1.0` slice.
3. Add a compact historical `4.0.0` changelog section dated
   `2026-03-22`.
4. Correct the changelog compare links so `[Unreleased]` means
   `v4.0.0...HEAD`.
5. Promote this cycle into `docs/design/` and prune the now-empty
   `docs/BACKLOG/v4.1.0/` lane.
6. Add cycle tests that lock the release boundary and lane-pruning
   behavior.

## Tests to write first

- a cycle test proving `WF-006` moved into `docs/design/`
- a cycle test proving the temporary `v4.1.0/` blocker lane is gone
- a cycle test proving `README.md` and `CHANGELOG.md` carry the new
  short-form `4.1.0` boundary

## Retrospective

### What landed

- the README now fronts the planned `4.1.0` release instead of `4.0.0`
- the changelog now states that `[Unreleased]` is the planned `4.1.0`
  slice aligned to `v4.0.0..HEAD`
- `v4.0.0` now has a dedicated historical changelog section and correct
  compare-link placement
- the temporary `v4.1.0/` blocker lane is gone because the cycle-shaped
  release backlog is cleared

### Drift from ideal

- the remaining `4.1.0` work is now operational release execution, not
  another design/backlog cycle
- the changelog will still need the final `[Unreleased] ->
  [4.1.0] - YYYY-MM-DD` rename during actual release execution

### Debt spawned

- no new cycle-shaped debt; the next work should be release execution or
  post-`4.1.0` backlog
