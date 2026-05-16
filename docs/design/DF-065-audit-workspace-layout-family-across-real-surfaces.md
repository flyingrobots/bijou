---
title: DF-065 Audit workspace layout family across real surfaces
legend: DF
lane: design
priority: medium
keywords:
  - component-audit
  - dogfood
  - lowerings
  - layout
---

# DF-065 Audit workspace layout family across real surfaces

## Framing

Workspace layout is the family that proves spatial composition is semantic
work, not decoration. `splitPaneSurface()` and `gridSurface()` own the rich TUI
surface path for simultaneous regions, while `splitPane()`, `grid()`,
`flex()`, `vstack()`, `hstack()`, and `place()` remain the lower-level
composition seams for explicit text and surface layout.

This audit verifies the existing DOGFOOD `workspace-layout` story against real
story rendering, component-family doctrine, and mode-aware lowerings. It does
not redesign split, grid, flex, stack, or placement algorithms; it turns the
current workspace-layout story into release proof.

## Sponsored Users

- TUI app authors composing primary and secondary work regions in one shell.
- Docs readers checking when spatial layout is useful and when sequential
  flow is clearer.
- Maintainers who need one focused regression tying workspace story metadata,
  variants, and design-system guidance to rendered output.

## Hills

1. A builder can inspect DOGFOOD and see the difference between split context
   and named-area grid composition.
2. A reader can switch both workspace-layout variants through interactive,
   static, pipe, and accessible profiles while preserving region identity.
3. A maintainer can run one cycle test that proves workspace-layout story
   metadata and family guidance have not drifted away from runtime behavior.

## Playback Questions

- Does DOGFOOD expose the family through the `workspace-layout` story?
- Do variants cover both split-pane and grid workspace composition?
- Do rich/static previews keep spatial containment visible?
- Do pipe lowerings preserve a sensible sequential reading order?
- Do accessible lowerings linearize the same labeled regions predictably?
- Do component-family docs still cover split, grid, flex, stack, and placement
  seams without pretending layout geometry is content?

## Requirements

- Keep the existing `workspace-layout` story identity and coverage family id.
- Render every workspace-layout story variant in every canonical story profile.
- Treat box drawing, dividers, and named-area geometry as visual-profile chrome
  only.
- Keep pipe and accessible lowerings region-first and semantic-preserving.
- Confirm `docs/design-system/component-families.md` still matches the runtime
  story posture for split, grid, flex, stack, and placement primitives.

## Acceptance Criteria

- `tests/cycles/DF-065/workspace-layout-family-audit.test.ts` proves the cycle
  doc carries the modern playback sections.
- The test locates the DOGFOOD `splitPaneSurface() / gridSurface()` story and
  verifies expected variants.
- Every variant renders non-empty output in every documented profile.
- Rich/static output includes structured visual containment; pipe and
  accessible output do not depend on box drawing.
- Pipe and accessible output preserve split and grid region identity.
- Component-family docs retain split, grid, flex, stack, placement, content
  guidance, and lowering guidance.

## Implementation Outline

1. Add a DF-065 cycle test that renders the `workspace-layout` DOGFOOD story
   through the shared story protocol.
2. Read-test the workspace layout section in
   `docs/design-system/component-families.md`.
3. Move the backlog note into `docs/design/` and update the v6 lane pointer.
4. Record any drift as follow-on backlog debt instead of widening this audit.

## Drift Check

No runtime drift was found in this slice. The existing `workspace-layout` story
already distinguishes split-pane context from grid dashboard composition,
renders structured region geometry in interactive/static profiles, and lowers
to region summaries in pipe/accessibility modes.

The story intentionally demonstrates the two richest workspace compositions:
split panes and grids. The component-family guide remains responsible for
naming the lower-level flex, stack, and placement seams that apps use to build
those regions.

No follow-on backlog item is needed for this slice.

## Playback

- RED: the release lane had only a backlog note; no DF-065 playback test tied
  workspace layout behavior to every canonical profile.
- GREEN: the new cycle test renders both `split-context` and `dashboard-grid`
  variants across interactive, static, pipe, and accessible profiles.
- Rich/static previews preserve split dividers, grid regions, and nested panel
  containment.
- Pipe previews preserve region order without box drawing.
- Accessible previews linearize the same workspace facts in reading order.

## Retrospective

The workspace-layout story did not need runtime changes. The useful release
work was proving that spatial layout is shared workspace truth, while
constrained lowerings keep the same region semantics without pretending visual
geometry survived.
