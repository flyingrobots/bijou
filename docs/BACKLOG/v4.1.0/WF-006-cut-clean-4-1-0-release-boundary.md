# WF-006 — Cut Clean 4.1.0 Release Boundary

Legend: [WF — Workflow and Delivery](../../legends/WF-workflow-and-delivery.md)

## Idea

Before tagging `4.1.0`, reconcile the short-form release surfaces to the
real `v4.0.0..HEAD` boundary.

That means:

- `CHANGELOG.md`
- the root `README.md` "What's New in v4.1.0" section
- the relationship between those short-form surfaces and the long-form
  docs in `docs/releases/4.1.0/`

## Why

[WF-004](../../design/WF-004-shape-the-next-release.md) shaped the
target version and created versioned long-form release docs, but the
short-form release surfaces still need the final cut.

Right now:

- `[Unreleased]` is not yet the final `4.1.0` section
- the release notes boundary needs to match the actual `v4.0.0..HEAD`
  work
- `README.md` still needs the concise front-door summary for `4.1.0`

## Likely scope

- audit `v4.0.0..HEAD` against `CHANGELOG.md`
- turn the real release slice into a clean `4.1.0` section
- add or replace the root README's `What's New in v4.1.0`
- keep the short-form story aligned with
  `docs/releases/4.1.0/whats-new.md`

## Done when

- `CHANGELOG.md` can be released as `4.1.0` without boundary drift
- `README.md` has a concise `What's New in v4.1.0` section
- the short-form and long-form release docs tell the same release story
