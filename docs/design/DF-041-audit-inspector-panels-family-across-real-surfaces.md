---
title: DF-041 Audit inspector panels family across real surfaces
legend: DF
lane: design
priority: medium
keywords:
  - component-audit
  - dogfood
  - lowerings
  - inspector
---

# DF-041 Audit inspector panels family across real surfaces

## Framing

`inspector()` is the canonical compact side-panel surface for the currently
selected thing. It should keep one active value obvious while supporting
sections stay calmer and structured. That makes it a first-blocks proof point:
an inspector panel is a reusable block-shaped composition, not an arbitrary
box with hand-written strings.

This audit verifies the inspector family against real DOGFOOD story rendering,
component-family doctrine, and mode-aware runtime behavior.

## Sponsored Users

- TUI app authors building side panels for selected packages, records, rows,
  or rollout slices.
- Docs readers checking how an inspector panel lowers when borders, color, and
  side-panel layout are not available.
- Maintainers who need a focused regression proving inspector story metadata
  and design-system guidance stay aligned with runtime truth.

## Hills

1. A builder can inspect the DOGFOOD inspector story and see current-selection
   emphasis plus compact supporting sections.
2. A reader can switch inspector variants through interactive, static, pipe,
   and accessible profiles while preserving the same semantic fields.
3. A maintainer can run one cycle test that ties `inspector()` behavior,
   DOGFOOD story metadata, and component-family guidance together.

## Playback Questions

- Does DOGFOOD expose the inspector family through the `inspector()` story?
- Do variants cover both package-summary and rollout-review side-panel usage?
- Do rich/static previews preserve titled containment and section rhythm?
- Do pipe lowerings produce labeled plain text with one obvious current
  selection?
- Do accessible lowerings linearize the same fields without relying on borders,
  color, or pane position?
- Do component-family docs still position `inspector()` as side-panel context
  rather than a full guided recommendation or complex nested workflow?

## Requirements

- Keep the existing `inspector` story identity and `inspector-panels`
  coverage family id.
- Render every inspector story variant in every canonical story profile.
- Treat borders and box-drawing characters as visual-profile affordances only.
- Keep pipe and accessible lowerings field-label-first and meaning-preserving.
- Confirm `docs/design-system/component-families.md` still matches the runtime
  story posture.

## Acceptance Criteria

- `tests/cycles/DF-041/inspector-panels-family-audit.test.ts` proves the
  cycle doc carries the modern playback sections.
- The test locates the DOGFOOD `inspector()` story and verifies expected
  variants.
- Every variant renders non-empty output in every documented profile.
- Rich/static output includes titled box containment; pipe and accessible
  output do not depend on box drawing.
- Pipe and accessible output preserve current selection, context, and section
  labels.
- Component-family docs retain side-panel, current-selection, and compact
  section guidance.

## Implementation Outline

1. Add a DF-041 cycle test that renders the `inspector` DOGFOOD story through
   the shared story protocol.
2. Read-test the inspector section in
   `docs/design-system/component-families.md`.
3. Move the backlog note into `docs/design/` and update the v6 lane pointer.
4. Record any drift as follow-on backlog debt instead of widening this audit.

## Drift Check

No runtime drift was found in this slice. `inspector()` already renders boxed,
titled containment in interactive/static profiles, lowers to labeled grouped
text in pipe mode, and linearizes the same fields in accessible mode.

No follow-on backlog item is needed for this slice.

## Playback

- RED: the release lane had only a backlog note; no DF-041 playback test tied
  the inspector story to real mode lowerings.
- GREEN: the new cycle test renders both `package-summary` and
  `rollout-review` variants across interactive, static, pipe, and accessible
  profiles.
- Rich/static previews preserve titled containment and section rhythm.
- Pipe previews preserve labels and grouped plain text without box drawing.
- Accessible previews linearize the same fields with explicit inspector
  language.

## Retrospective

The inspector component did not need runtime changes. The important release
work was turning current story truth into executable proof so future block and
workspace work cannot quietly turn inspector panels into generic nested boxes
or mini dashboards.
