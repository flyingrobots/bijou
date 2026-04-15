---
title: "RE-022 — Public PackedSurface Type Guard"
legend: RE
lane: retro
---

# RE-022 — Public PackedSurface Type Guard

Completed on `release/v5.0.0`. `@flyingrobots/bijou` now exports
`isPackedSurface()` from `packages/bijou/src/ports/surface.ts` and
re-exports it from `packages/bijou/src/index.ts`, while current core, TUI, and
bench callsites use that public seam instead of ad hoc `'buffer' in s`
duck-typing.

## Original Proposal

Legend: [RE — Runtime Engine](../legends/RE-runtime-engine.md)

## Idea

Export a canonical `isPackedSurface(s): s is PackedSurface` type guard
from `@flyingrobots/bijou` so consumers and internal code stop using
ad-hoc `'buffer' in s` duck-typing.

Currently the guard exists as a private function in
`packages/bijou/src/ports/surface.ts` and is duplicated (with slight
variations) in:

- `bench/src/scenarios/_shared.ts`
- `packages/bijou-tui/src/css/text-style.ts`
- `packages/bijou-tui/src/overlay.ts`
- `packages/bijou/src/core/render/differ.ts`

A single exported guard would:

- Eliminate duck-typing fragility (false positives if other objects
  have a `buffer` property)
- Give TypeScript narrowing to `PackedSurface` in one check
- Let downstream consumers (like git-warp) detect packed surfaces
  without casting
