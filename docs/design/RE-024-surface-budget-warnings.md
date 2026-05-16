---
title: RE-024 Surface Budget Warnings
legend: RE
lane: design
---

# RE-024 Surface Budget Warnings

## Framing

Many performance regressions are easier to catch during normal development than
in a separate benchmark run. Bijou already measures render pipeline timings and
owns the target `Surface` before diff/output, so the runtime can warn when an
app crosses explicit surface or timing budgets.

RE-024 adds opt-in, non-fatal budget diagnostics. The first slice keeps the
policy simple: a pure evaluator returns warning objects, and the interactive
runtime can route those warnings through the existing `routeRuntimeIssue` app
hook when `run(..., { surfaceBudget })` is configured.

## Sponsored Users

- App authors who want early feedback when a render surface grows beyond an
  intended size.
- Maintainers reviewing frame timing regressions during normal development.
- Test authors who want deterministic budget warning objects without running a
  benchmark harness.

## Hills

1. A developer can evaluate a `Surface` and render timings against configured
   budgets and get deterministic warning objects.
2. An interactive app can opt into runtime budget warnings without changing its
   TEA messages unless it chooses to route `RuntimeIssue`s.
3. A test can assert that area, styled-cell, frame-duration, and per-stage
   thresholds produce clear messages.

## Playback Questions

- Does the pure evaluator stay deterministic and side-effect free?
- Does a target surface over the configured area threshold produce a warning?
- Does a styled-cell count over the configured threshold produce a warning?
- Do frame-duration and stage-duration thresholds use pipeline timings?
- Does `run(..., { surfaceBudget })` route warnings through
  `routeRuntimeIssue` as `source: 'runtime'` and `level: 'warning'`?
- Does omitting `surfaceBudget` keep the runtime silent?

## Requirements

- Add `evaluateSurfaceBudget()` in `@flyingrobots/bijou-tui`.
- Support maximum width, height, area, styled cells, total frame duration, and
  per-stage duration thresholds.
- Add `surfaceBudget` to `RunOptions`.
- Route runtime budget violations through `routeRuntimeIssue`.
- Keep warnings non-fatal by default.

## Acceptance Criteria

- Focused RED tests fail before implementation and pass after.
- The evaluator returns stable `SurfaceBudgetWarning` records.
- Runtime budget warnings use the existing runtime issue route.
- No warning is emitted when no budget is configured.
- Docs and changelog describe the opt-in feature.

## Implementation Outline

- Implement a pure `surface-budget.ts` helper with threshold and warning types.
- Export the helper and types from the `bijou-tui` source barrel.
- Call the helper after pipeline execution, before lifecycle playback, so the
  warning uses the same target surface and timings that will be committed.

## Drift Check

- Scope stayed on non-fatal warnings. The runtime does not fail frames or quit
  when a threshold is crossed.
- The first slice measures the committed target surface and pipeline timings.
  Allocation count and output byte volume remain follow-on metrics because they
  need deeper differ/runtime counters to be accurate.
- Runtime warnings are deduplicated by message to avoid warning/render loops
  when an app routes budget issues back into its own TEA update path.

## Playback

- `evaluateSurfaceBudget()` returns deterministic warning records for width,
  height, area, styled-cell count, total frame duration, and per-stage duration.
- `run(..., { surfaceBudget })` evaluates the target framebuffer after pipeline
  execution and routes violations through `routeRuntimeIssue`.
- Runtime warnings use `level: 'warning'` and `source: 'runtime'`.
- Omitting `surfaceBudget` leaves existing runtime behavior unchanged.
- `@flyingrobots/bijou-tui` exports the helper and budget types from the source
  barrel.

## Retrospective

- This is the right first runtime budget boundary: it gives app authors useful
  early warnings without pretending Bijou can enforce every performance budget
  from inside the render loop.
- The target surface area is the framebuffer area, not the app view's intrinsic
  surface size after normalization. Tests pin the viewport when they need exact
  runtime budget numbers.
