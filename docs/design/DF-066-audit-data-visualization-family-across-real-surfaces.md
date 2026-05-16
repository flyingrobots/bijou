---
title: DF-066 Audit data visualization family across real surfaces
legend: DF
lane: design
priority: medium
keywords:
  - component-audit
  - dogfood
  - lowerings
  - visualization
---

# DF-066 Audit data visualization family across real surfaces

## Framing

The data visualization family proves that Bijou can render dense numeric
signals without making glyph art the only source of truth. `sparkline()`,
`brailleChartSurface()`, `statsPanelSurface()`, and `perfOverlaySurface()`
should use rich terminal geometry when available, then lower to explicit
numeric summaries when visual density is unavailable.

This audit verifies the existing DOGFOOD data visualization stories against
real story rendering, component-family doctrine, and mode-aware lowerings. It
does not redesign charting; it turns current data-viz runtime truth into
executable release proof.

## Sponsored Users

- TUI app authors building dashboards, performance overlays, and status
  summaries from first-party visualization blocks.
- Docs readers checking what happens when Unicode blocks, Braille cells,
  borders, and color are not meaningful output channels.
- Maintainers who need one focused regression tying data-viz story metadata,
  variants, and component-family guidance to real output.

## Hills

1. A builder can inspect DOGFOOD and see when to use inline trends, dense area
   charts, metric panels, or the prebuilt performance overlay.
2. A reader can switch every data-viz story through interactive, static, pipe,
   and accessible profiles while preserving the numeric facts behind the
   visual shape.
3. A maintainer can run one cycle test that proves data-viz story metadata and
   design-system guidance have not drifted away from runtime behavior.

## Playback Questions

- Does DOGFOOD expose the data visualization family through all four shipped
  stories?
- Do variants cover inline sparklines, fixed ranges, Braille charts, metric
  panels, and performance overlays?
- Do rich/static previews preserve terminal-native visual density?
- Do pipe lowerings replace visual density with explicit numeric summaries?
- Do accessible lowerings describe the same trend and metric facts in reading
  order?
- Do component-family docs still position the family as informative numeric
  visualization rather than decoration?

## Requirements

- Keep the existing story identities: `sparkline`, `braille-chart`,
  `stats-panel`, and `perf-overlay`.
- Keep the shared `data-visualization` coverage family id.
- Render every data-viz story variant in every canonical story profile.
- Treat block glyphs, Braille glyphs, and borders as visual-profile affordances
  only.
- Keep pipe and accessible lowerings numeric-fact-first and
  semantic-preserving.
- Confirm `docs/design-system/component-families.md` still matches the runtime
  story posture.

## Acceptance Criteria

- `tests/cycles/DF-066/data-visualization-family-audit.test.ts` proves the
  cycle doc carries the modern playback sections.
- The test locates all four DOGFOOD data-viz stories and verifies expected
  variants.
- Every variant renders non-empty output in every documented profile.
- Rich/static output preserves the expected visual affordance for each story.
- Pipe and accessible output do not depend on block or Braille glyphs.
- Pipe and accessible output preserve sample counts, ranges, latest values,
  trend notes, metric labels, and performance facts.
- Component-family docs retain numeric trend, chart, metric panel, performance
  overlay, fixed-axis, pipe, and accessible guidance.

## Implementation Outline

1. Add a DF-066 cycle test that renders all data-viz DOGFOOD stories through
   the shared story protocol.
2. Read-test the data visualization section in
   `docs/design-system/component-families.md`.
3. Move the backlog note into `docs/design/` and update the v6 lane pointer.
4. Record any drift as follow-on backlog debt instead of widening this audit.

## Drift Check

No runtime drift was found in this slice. The existing data visualization
stories already render visual glyph density in interactive/static profiles,
lower sparkline and Braille previews to numeric summaries in pipe mode, and
linearize metric and performance summaries in accessible mode.

No follow-on backlog item is needed for this slice.

## Playback

- RED: the release lane had only a backlog note; no DF-066 playback test tied
  all shipped data-viz stories to every canonical profile.
- GREEN: the new cycle test renders all `sparkline`, `braille-chart`,
  `stats-panel`, and `perf-overlay` variants across interactive, static, pipe,
  and accessible profiles.
- Rich/static previews preserve block, Braille, or boxed metric affordances as
  appropriate.
- Pipe previews preserve numeric summaries without block or Braille glyphs.
- Accessible previews linearize the same metric and trend facts in reading
  order.

## Retrospective

The visualization components did not need runtime changes. The useful release
work was proving that visual density is backed by data facts, so future block
and layout work can reuse these components without treating charts as opaque
terminal art.
