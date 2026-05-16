---
title: DF-061 Audit overlay primitives family across real surfaces
legend: DF
lane: design
priority: medium
keywords:
  - component-audit
  - dogfood
  - lowerings
  - overlays
---

# DF-061 Audit overlay primitives family across real surfaces

## Framing

Overlay primitives are the family for layered UI that is not ordinary document
flow: `tooltip()`, `drawer()`, `modal()`, and `toast()`. They differ by
interruption level. Tooltips explain locally, drawers supplement, modals block,
and toasts announce transiently.

This audit verifies overlay primitive stories against real story rendering,
component-family doctrine, and mode-aware lowerings. It also closes the story
drift where DOGFOOD already had modal and toast examples, but did not visibly
exercise drawer or tooltip primitives as part of the same overlay family.

## Sponsored Users

- TUI app authors choosing the right overlay primitive instead of overusing
  modals or toasts.
- Docs readers checking how layered UI lowers when z-order is unavailable.
- Maintainers who need one focused regression tying overlay story metadata,
  variants, and design-system guidance to real output.

## Hills

1. A builder can inspect DOGFOOD and see tooltip, drawer, modal, and toast
   primitives side by side as one overlay family.
2. A reader can switch every overlay primitive through interactive, static,
   pipe, and accessible profiles while preserving the right interruption level.
3. A maintainer can run one cycle test that proves overlay story metadata and
   design-system guidance have not drifted away from runtime behavior.

## Playback Questions

- Does DOGFOOD expose all four overlay primitives?
- Do variants cover explanatory, supplemental, blocking, and transient
  overlay jobs?
- Do rich/static previews keep layering and containment visible?
- Do pipe lowerings avoid fake z-order and preserve plain prompt/event text?
- Do accessible lowerings linearize overlay relationships to their owning
  context?
- Do component-family docs still separate primitive overlays from the full
  notification system?

## Requirements

- Keep `modal` and `toast` story identities while adding missing drawer and
  tooltip story coverage.
- Ensure `toast` participates in the `overlay-primitives` coverage family while
  still retaining its lower-level transient-overlay coverage.
- Render every overlay primitive story variant in every canonical story
  profile.
- Treat borders, dimmed backdrops, anchor placement, and z-order as
  visual-profile chrome only.
- Keep pipe and accessible lowerings plain, explicit, and
  semantic-preserving.

## Acceptance Criteria

- `tests/cycles/DF-061/overlay-primitives-family-audit.test.ts` proves the
  cycle doc carries the modern playback sections.
- The test locates DOGFOOD stories for `modal()`, `drawer()`, `tooltip()`, and
  `toast()`.
- Every documented overlay variant renders non-empty output in every profile.
- Rich/static output includes structured visual containment; pipe and
  accessible output do not depend on box drawing.
- Constrained lowerings preserve blocking modal prompts, supplemental drawer
  context, local tooltip explanation, and transient toast events.
- Component-family docs retain overlay primitive guidance and the boundary with
  notification system behavior.

## Implementation Outline

1. Add drawer and tooltip DOGFOOD stories under the overlay primitive family.
2. Add mode-aware constrained lowerings to modal and toast story variants.
3. Add a DF-061 cycle test that renders every overlay primitive through the
   shared story protocol.
4. Move the backlog note into `docs/design/` and update the v6 lane pointer.

## Drift Check

Runtime support already existed for all four primitives. The drift was in
DOGFOOD: `modal()` and `toast()` were visible, but `drawer()` and `tooltip()`
were only documented indirectly.

This slice fixes the drift by adding the missing stories and making constrained
lowerings explicitly textual. No runtime API changes were required.

## Playback

- RED: the release lane had only a backlog note, and DOGFOOD did not visibly
  exercise every overlay primitive.
- GREEN: the new cycle test renders modal, drawer, tooltip, and toast stories
  across interactive, static, pipe, and accessible profiles.
- Rich/static previews preserve layering, borders, anchors, and backdrop
  context.
- Pipe previews preserve prompt, supplemental, explanation, and event content
  without box drawing.
- Accessible previews linearize the same overlay facts in reading order.

## Retrospective

The useful release work was not inventing another overlay. It was making
DOGFOOD teach the existing overlay hierarchy honestly: explain with a tooltip,
supplement with a drawer, block with a modal, and announce briefly with a toast.
