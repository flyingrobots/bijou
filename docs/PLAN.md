# Current Plan

_A short narrative summary of the current queue under Bijou's METHOD
signposts_

## Why This Exists

The source of truth is now:

- [`METHOD.md`](./METHOD.md)
- [`BEARING.md`](./BEARING.md)
- backlog lane placement in [`docs/BACKLOG/`](./BACKLOG/README.md)
- legend docs
- cycle docs
- tests
- [`CHANGELOG.md`](./CHANGELOG.md)

This file exists because sometimes a human or agent wants a quick prose
answer to "what are we doing next?" without reconstructing it from a raw
filesystem listing.

## Current Posture

Bijou is no longer proving whether it can exist, and it is no longer
undecided about the next release.

The repo now has:

- a runtime-engine legend with real landed slices through
  [RE-006](./design/RE-006-formalize-component-layout-and-interaction-contracts.md)
- a humane shell direction
- complete DOGFOOD family coverage
- landed DX cleanup on the most painful framed-shell typing seams
- a shaped next release target through
  [WF-004](./design/WF-004-shape-the-next-release.md)
- closed release-blocker cycles through
  [WF-006](./design/WF-006-cut-clean-4-1-0-release-boundary.md)
- a new DOGFOOD docs-site shaping cycle through
  [DF-021](./design/DF-021-shape-dogfood-as-terminal-docs-system.md)
- a landed DOGFOOD docs-shell foundation through
  [DF-022](./design/DF-022-build-prose-docs-reader-and-top-level-dogfood-nav.md)
- a new DOGFOOD-only docs-surface policy through
  [DF-025](./design/DF-025-make-dogfood-the-only-human-facing-docs-surface.md)

The release decision is now:

- target version: `4.1.0`
- release type: stable minor
- `RE-007` is explicitly deferred until after `4.1.0`
- the i18n publish surface is closed in the automated release path
- the short-form release surfaces are aligned to the real
  `v4.0.0..HEAD` boundary
- cycle-shaped blockers are open again in
  [`docs/BACKLOG/v4.1.0/`](./BACKLOG/v4.1.0/README.md) because DOGFOOD
  still lacks the real repo/package/release/philosophy corpus inside the
  newly visible docs-site shell and because the repo still needs to
  finish demoting `examples/` behind DOGFOOD

So the work now should stay narrower and more structural:

- close the remaining `4.1.0` DOGFOOD docs-system blockers honestly
- keep work-tracking truth honest through METHOD lanes and signposts
- keep `RE-007` and other follow-on engineering work outside the current
  release boundary

## Active Cycle

- [DF-025 — Make DOGFOOD The Only Human-Facing Docs Surface](./design/DF-025-make-dogfood-the-only-human-facing-docs-surface.md)

## Before 4.1.0 Ships

- close the `v4.1.0` backlog lane:
  - [DF-023 — Publish Repo, Package, And Release Guides In DOGFOOD](./BACKLOG/v4.1.0/DF-023-publish-repo-package-and-release-guides-in-dogfood.md)
  - [DF-024 — Publish Philosophy, Architecture, And Doctrine Guides In DOGFOOD](./BACKLOG/v4.1.0/DF-024-publish-philosophy-architecture-and-doctrine-guides-in-dogfood.md)
  - [DF-026 — Demote Examples To Secondary Reference Status](./BACKLOG/v4.1.0/DF-026-demote-examples-to-secondary-reference-status.md)
  - [WF-003 — Replace `smoke:examples:*` With `smoke:dogfood`](./BACKLOG/v4.1.0/WF-003-replace-smoke-examples-with-smoke-dogfood.md)
- run `npm run release:preflight`
- run `npm run release:readiness`
- run the GitHub Release Dry Run workflow
- execute the version bump, tag, and publish flow in
  [docs/release.md](./release.md)

### Up Next

- [RE-007 — Migrate Framed Shell Onto Runtime Engine Seams](./BACKLOG/up-next/RE-007-migrate-framed-shell-onto-runtime-engine-seams.md)
- [DF-020 — Deepen DOGFOOD Story Depth and Variant Quality](./BACKLOG/up-next/DF-020-deepen-dogfood-story-depth-and-variant-quality.md)
- [DL-009 — Formalize Layout and Viewport Rules](./BACKLOG/up-next/DL-009-formalize-layout-and-viewport-rules.md)

## Supporting Backlog That Still Matters

These are valid follow-ons, but not the current center of gravity:

- [DX-003 — Rationalize Table APIs and Public Table Types](./BACKLOG/DX-003-rationalize-table-apis-and-public-table-types.md)
- [DX-004 — Smooth Surface and String Composition Seams](./BACKLOG/DX-004-smooth-surface-and-string-composition-seams.md)
- [DX-005 — Polish Small Component and Import Ergonomics](./BACKLOG/DX-005-polish-small-component-and-import-ergonomics.md)
- [HT-005 — Promote Page-Provided Layer Registry and Shell Control Projection](./BACKLOG/HT-005-promote-page-provided-layer-registry-and-shell-control-projection.md)
- [LX-009 — Localize Shell Help, Notification, and Directional Surfaces](./BACKLOG/LX-009-localize-shell-help-notification-and-directional-surfaces.md)
- [LX-007 — Service-Oriented Localization Adapters](./BACKLOG/LX-007-service-oriented-localization-adapters.md)
- [WF-002 — Migrate Legacy Planning Artifacts](./BACKLOG/WF-002-migrate-legacy-planning-artifacts.md)

## Historical Note

Some files still live in the root backlog because they are older lineage
captures that need explicit re-triage instead of silent deletion. Do not
mistake every root backlog file for live queue priority.

## Working Rules

1. Finish the engine spine before broadening runtime surface area.
2. Treat DOGFOOD as a proving surface, not a place to hide framework
   debt.
3. Keep legends, backlog placement, cycle docs, and changelog truth in
   sync. If they disagree, fix the docs instead of adding more summary
   prose.
4. Shape releases explicitly: what is in, what is out, what number it
   wants, and what ready means.
5. Do not let follow-on architecture work silently expand the current
   release boundary after it has been shaped.
6. Do not call DOGFOOD complete while visible sections still only carry
   starter copy instead of the real corpus.
7. Do not treat `examples/` as a competing human-facing docs surface
   while DOGFOOD is the canonical docs product.
