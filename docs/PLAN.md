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

Bijou has shipped `4.1.0`, so the repo is no longer shaping that
release. It is back in normal post-release engineering posture.

The repo now has:

- a current shipped release at `4.1.0`
- a runtime-engine legend with real landed slices through
  [RE-006](./design/RE-006-formalize-component-layout-and-interaction-contracts.md)
- a humane shell direction
- complete DOGFOOD family coverage
- landed DX cleanup on the most painful framed-shell typing seams
- a landed release-shaping decision through
  [WF-004](./design/WF-004-shape-the-next-release.md)
- closed release-blocker cycles through
  [WF-006](./design/WF-006-cut-clean-4-1-0-release-boundary.md)
- a landed DOGFOOD docs-site shaping cycle through
  [DF-021](./design/DF-021-shape-dogfood-as-terminal-docs-system.md)
- a landed DOGFOOD docs-shell foundation through
  [DF-022](./design/DF-022-build-prose-docs-reader-and-top-level-dogfood-nav.md)
- a landed DOGFOOD repo/package/release corpus publication through
  [DF-023](./design/DF-023-publish-repo-package-and-release-guides-in-dogfood.md)
- a landed DOGFOOD philosophy/architecture corpus publication through
  [DF-024](./design/DF-024-publish-philosophy-architecture-and-doctrine-guides-in-dogfood.md)
- a landed DOGFOOD-only docs-surface policy through
  [DF-025](./design/DF-025-make-dogfood-the-only-human-facing-docs-surface.md)
- a landed example-demotion posture through
  [DF-026](./design/DF-026-demote-examples-to-secondary-reference-status.md)
- a landed release-smoke migration through
  [WF-003](./design/WF-003-replace-smoke-examples-with-smoke-dogfood.md)

The `4.1.0` release outcome is now:

- shipped version: `4.1.0`
- release type: stable minor
- `RE-007` stayed outside the release boundary
- all nine workspace packages now move together at `4.1.0`
- DOGFOOD owns the human-facing docs posture and the release smoke
  contract
- the next release has not been shaped yet

So the work now should stay narrower and more structural:

- keep signposts honest about `4.1.0` being shipped instead of pending
- promote `RE-007` as the next active engineering cycle
- keep `DF-020` and `DL-009` as near follow-ons
- keep work-tracking truth honest through METHOD lanes and signposts
- leave `4.2.0` unshaped until there is enough real new material to
  justify another release-shaping pass

## Next Active Cycle

- [RE-007 — Migrate Framed Shell Onto Runtime Engine Seams](./BACKLOG/up-next/RE-007-migrate-framed-shell-onto-runtime-engine-seams.md)

## After 4.1.0

- keep the release-shaping arc closed as shipped history, not as a live
  blocker lane
- treat the `4.1.0` release docs under [`docs/releases/4.1.0/`](./releases/4.1.0/whats-new.md)
  and the shipped changelog section as historical truth
- use [docs/release.md](./release.md) as the procedure for the next
  release only when a new version is deliberately shaped

## Near Follow-ons

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
- [WF-007 — Align Local Validation With CI `typecheck:test` Gate](./BACKLOG/bad-code/WF-007-align-local-validation-with-ci-typecheck-test-gate.md)

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
