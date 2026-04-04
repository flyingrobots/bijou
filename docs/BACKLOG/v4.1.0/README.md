# v4.1.0 Blockers

This lane holds cycle-shaped work that must close before `4.1.0` ships.

It is active again because [DF-021](../../design/DF-021-shape-dogfood-as-terminal-docs-system.md)
reframed DOGFOOD from "component field guide" to "terminal docs system"
and identified gaps that would make the release story overclaim if left
open.

## Current blockers

- [DF-026 — Demote Examples To Secondary Reference Status](./DF-026-demote-examples-to-secondary-reference-status.md)
- [WF-003 — Replace `smoke:examples:*` With `smoke:dogfood`](./WF-003-replace-smoke-examples-with-smoke-dogfood.md)

## Just closed

- [DF-024 — Publish Philosophy, Architecture, And Doctrine Guides In DOGFOOD](../../design/DF-024-publish-philosophy-architecture-and-doctrine-guides-in-dogfood.md)
- [DF-023 — Publish Repo, Package, And Release Guides In DOGFOOD](../../design/DF-023-publish-repo-package-and-release-guides-in-dogfood.md)
- [DF-022 — Build Prose Docs Reader And Top-Level DOGFOOD Nav](../../design/DF-022-build-prose-docs-reader-and-top-level-dogfood-nav.md)

## Why the lane widened again

`DF-021` and `DF-022` made DOGFOOD look like a real docs shell.

`DF-025` makes the repo posture sharper: DOGFOOD is the only
human-facing docs surface for `4.1.0`. Now that the repo/package/release
and philosophy corpus are published inside DOGFOOD, the remaining
blockers are the shift away from `examples/` as a public docs and smoke
authority.

When this lane is empty again, delete it and update the signposts to say
so explicitly.
