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

Bijou has shipped `4.3.0`. The rendering pipeline is now byte-packed
and benchmarked. The repo is in post-performance-release posture.

The repo now has:

- a current shipped release at `4.3.0`
- a byte-packed surface architecture (RE-008) with zero-alloc `setRGB`
  API and 100% component migration
- an MCP rendering server (`@flyingrobots/bijou-mcp`) with 22 tools
- runtime-engine slices landed through RE-007 (framed shell migration)
- DOGFOOD as the canonical docs surface and release smoke contract
- all ten workspace packages versioned in lock-step
- METHOD-based planning with all 7 legends resolving

Bijou has shipped `4.1.0`, `4.2.0`, and `4.3.0`. The DOGFOOD
docs-site posture landed through DF-021, DF-022, DF-023, DF-024,
DF-025, DF-026, and WF-003.

The work now should favor:

- proving performance gains in more real-world scenarios
- deepening DOGFOOD story quality (DF-020)
- the i18n catalog loader (LX-010)
- MCP interactive documentation

## Active Cycle

- [RE-008 — Byte-Packed Surface Representation](./design/0001-008-byte-packed-surface-representation/008-byte-packed-surface-representation.md) (in PR review)

## Recently Shipped

- [RE-007 — Migrate Framed Shell Onto Runtime Engine Seams](./design/RE-007-migrate-framed-shell-onto-runtime-engine-seams.md) (shipped in 4.2.0)

## After 4.1.0

- keep the release-shaping arc closed as shipped history, not as a live
  blocker lane
- treat the `4.1.0` release docs under [`docs/releases/4.1.0/`](./releases/4.1.0/whats-new.md)
  and the shipped changelog section as historical truth
- use [docs/release.md](./release.md) as the procedure for the next
  release only when a new version is deliberately shaped

## ASAP

- [LX-010 — Built-in i18n Catalog Loader](./BACKLOG/asap/LX-010-built-in-i18n-catalog-loader.md)
- [RE-008 — Byte-Packed Surface Representation](./BACKLOG/asap/RE-008-byte-packed-surface-representation.md)

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
