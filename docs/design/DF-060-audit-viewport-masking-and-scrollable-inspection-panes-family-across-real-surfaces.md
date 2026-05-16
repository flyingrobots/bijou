---
title: DF-060 Audit viewport masking and scrollable inspection panes family across real surfaces
legend: DF
lane: design
priority: medium
keywords:
  - component-audit
  - dogfood
  - lowerings
  - viewport
---

# DF-060 Audit viewport masking and scrollable inspection panes family across real surfaces

## Framing

Viewport masking is the family that proves overflow is owned by bounded panes,
not by callers slicing strings after rendering. `viewportSurface()` is the base
masking primitive for structured surfaces, `pagerSurface()` adds long-document
position context, and `focusAreaSurface()` adds workspace focus ownership.
Their string counterparts remain explicit text-lowering paths.

This audit verifies the DOGFOOD `viewport-surface` story against real story
rendering, component-family doctrine, and mode-aware lowerings. It also closes
the story drift where DOGFOOD taught only the base viewport mask even though
the family doc already included pager and focus-area panes.

## Sponsored Users

- TUI app authors wrapping existing surfaces in bounded scroll regions.
- Docs readers checking the distinction between masking, paging, and focused
  inspection panes.
- Maintainers who need one focused regression tying viewport story metadata,
  variants, and design-system guidance to real output.

## Hills

1. A builder can inspect DOGFOOD and see viewport mask, structured stack,
   pager, and focused pane variants in one family.
2. A reader can switch every variant through interactive, static, pipe, and
   accessible profiles while preserving scroll and focus context.
3. A maintainer can run one cycle test that proves viewport-family story
   metadata and family guidance have not drifted away from runtime behavior.

## Playback Questions

- Does DOGFOOD expose the family through the
  `viewport-masking-and-scrollable-inspection-panes` coverage id?
- Do variants cover pure viewport masking, structured masking, pager status,
  and focus-area chrome?
- Do rich/static previews keep bounded pane chrome visible?
- Do pipe lowerings preserve sequential content and scroll/focus context
  without pretending hidden regions are interactive?
- Do accessible lowerings linearize pane content with explicit position or
  focus facts?
- Do component-family docs still cover viewport, pager, focus area, and the
  row-aware holdout boundary?

## Requirements

- Keep the existing `viewport-surface` story identity and coverage family id.
- Render every viewport-family story variant in every canonical story profile.
- Treat scrollbars, gutters, and box drawing as visual-profile chrome only.
- Keep pipe and accessible lowerings scroll-context-first and
  semantic-preserving.
- Confirm `docs/design-system/component-families.md` still matches the runtime
  story posture for viewport, pager, and focus-area primitives.

## Acceptance Criteria

- `tests/cycles/DF-060/viewport-masking-family-audit.test.ts` proves the cycle
  doc carries the modern playback sections.
- The test locates the DOGFOOD
  `viewportSurface() / pagerSurface() / focusAreaSurface()` story and verifies
  expected variants.
- Every variant renders non-empty output in every documented profile.
- Rich/static output includes structured visual containment; pipe and
  accessible output do not depend on box drawing.
- Pipe and accessible output preserve viewport scroll, pager line, and focus
  pane context.
- Component-family docs retain viewport, pager, focus area, content guidance,
  lowering guidance, and the domain-specific row-aware boundary.

## Implementation Outline

1. Extend the existing `viewport-surface` DOGFOOD story with pager and focused
   pane variants.
2. Add mode-aware constrained lowerings for the story so pipe/accessibility
   profiles expose scroll/focus facts as text rather than visual chrome.
3. Add a DF-060 cycle test that renders every variant through the shared story
   protocol.
4. Move the backlog note into `docs/design/` and update the v6 lane pointer.

## Drift Check

Runtime support already existed for the full family. The drift was in DOGFOOD:
the story represented only `viewportSurface()` while the design-system family
also documented `pagerSurface()` and `focusAreaSurface()`.

This slice fixes that by extending the story instead of filing follow-on debt.
No runtime API changes were required.

## Playback

- RED: the release lane had only a backlog note, and the DOGFOOD story did not
  visibly exercise pager or focused-pane variants.
- GREEN: the new cycle test renders `document`, `structured-stack`,
  `pager-window`, and `focused-pane` variants across interactive, static,
  pipe, and accessible profiles.
- Rich/static previews preserve scrollbars, status lines, focus gutters, and
  nested surface masking.
- Pipe previews preserve viewport scroll, pager line, and focus context
  without box drawing.
- Accessible previews linearize the same pane facts in reading order.

## Retrospective

The runtime did not need another overflow abstraction. The useful release work
was making DOGFOOD tell the whole family story: mask structured surfaces,
page long linear documents, and mark focused inspection panes without letting
scroll chrome become semantic content.
