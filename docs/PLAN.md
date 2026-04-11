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

Bijou is shaping `4.4.0`. The release adds the data-viz component
toolkit, a rewritten soak runner, new bench scenarios, and frame
rendering optimizations.

The repo now has:

- a current shipped release at `4.3.0`
- `4.4.0` in progress with data-viz components, bench improvements,
  and zero-alloc frame chrome
- a byte-packed surface architecture (RE-008) with zero-alloc `setRGB`
  API and 100% component migration
- data-viz toolkit: `sparkline`, `brailleChartSurface`, `statsPanelSurface`, `perfOverlaySurface`
- soak runner rewritten on `createFramedApp` with dynamic-size scenarios
- new bench scenarios: doom flame, component-app (realistic TUI)
- zero-alloc header/footer in framed app render loop
- an MCP rendering server (`@flyingrobots/bijou-mcp`) with 22 tools
- DOGFOOD as the canonical docs surface and release smoke contract
- all ten workspace packages versioned in lock-step
- METHOD-based planning with all 7 legends resolving

The work now should favor:

- cutting 4.4.0 (data-viz + bench + perf)
- deepening DOGFOOD story quality (DF-020) — data-viz stories needed
- the i18n catalog loader (LX-010)
- frame-owns-the-pump architecture exploration (RE-021)

## Active Cycle

- 4.4.0 release shaping

## Recently Shipped

- [RE-008 — Byte-Packed Surface Representation](./design/0001-008-byte-packed-surface-representation/008-byte-packed-surface-representation.md) (shipped in 4.3.0)
- [RE-007 — Migrate Framed Shell Onto Runtime Engine Seams](./design/RE-007-migrate-framed-shell-onto-runtime-engine-seams.md) (shipped in 4.2.0)

## ASAP

- [LX-010 — Built-in i18n Catalog Loader](./BACKLOG/asap/LX-010-built-in-i18n-catalog-loader.md)

## Near Follow-ons

- [DF-020 — Deepen DOGFOOD Story Depth and Variant Quality](./BACKLOG/up-next/DF-020-deepen-dogfood-story-depth-and-variant-quality.md) — data-viz stories needed
- [DL-009 — Formalize Layout and Viewport Rules](./BACKLOG/up-next/DL-009-formalize-layout-and-viewport-rules.md)
- [RE-021 — Frame Owns the Pump](./method/backlog/cool-ideas/RE-021-frame-owns-the-pump.md) — next major architecture shift

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
