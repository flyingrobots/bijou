---
title: DX-022 Layout Inspector Overlay
legend: DX
lane: design
---

# DX-022 Layout Inspector Overlay

## Framing

Layout and overlay issues are hard to inspect in situ. Bijou now retains enough
runtime geometry that pane bounds, clipping, scroll regions, focus ownership,
and z-layer ordering should not stay invisible during development.

DX-022 adds a first-party layout inspector overlay. The first slice is a pure
surface helper: apps or framed shells can pass the retained regions they already
know about and get a visible overlay plus a plain text report.

## Sponsored Users

- App authors debugging split panes, clipped viewports, and mouse hit regions.
- Maintainers investigating shell focus or overlay layering regressions.
- Agent workflows that need a text report of layout truth without screenshot
  inspection.

## Hills

1. A developer can composite an inspector over any surface and see region
   borders, ids, and dimensions without changing the app layout itself.
2. A maintainer can mark one region as focused and visually distinguish it from
   sibling regions.
3. A test can ask for a text report that includes rects, clip rects, scroll
   offsets, focus, and layer ordering.

## Playback Questions

- Does the overlay draw region bounds on top of an existing surface?
- Does the overlay clip labels and borders to the target surface dimensions?
- Does focused geometry stand out from non-focused geometry?
- Does the text report preserve region ids, roles, rects, clips, scroll offsets,
  focus, and layers?
- Does `bijou-tui` export the inspector API from the source barrel?

## Requirements

- Add a `layoutInspectorOverlay(background, regions, options?)` helper.
- Add a `layoutInspectorText(regions)` helper.
- Support region `id`, `rect`, optional `role`, optional `clip`, optional
  `scroll`, optional `focused`, and optional `layer`.
- Draw only within the background surface bounds.
- Keep the helper independent of `createFramedApp()` internals so raw runtime
  apps can use it too.

## Acceptance Criteria

- Focused tests fail before implementation and pass after.
- The overlay draws borders and labels for visible regions.
- The overlay clips off-screen regions without throwing.
- The text report includes all supplied geometry facts.
- Docs and changelog describe the helper.

## Implementation Outline

- Implement the helper in `packages/bijou-tui/src/layout-inspector.ts`.
- Export it from `packages/bijou-tui/src/index.ts`.
- Keep drawing intentionally simple: ASCII borders, compact labels, and explicit
  text reports are more useful in debug output than elaborate chrome.

## Drift Check

- Scope stayed on the first pure helper slice. The runtime did not grow a
  global toggle, because callers can now compose the inspector over any retained
  geometry they already own.
- The implementation accepts both debug-friendly `{ x, y, width, height }`
  rectangles and Bijou-native `{ row, col, width, height }` rectangles. That
  keeps the public helper ergonomic without forcing app-frame internals into the
  design contract.
- Styling stayed out of the first pass. Plain ASCII borders make the overlay
  stable in tests, logs, and pipe captures.

## Playback

- `layoutInspectorOverlay()` draws clipped borders and compact labels over an
  existing surface.
- Focused regions are distinguishable through the `*` label prefix.
- Off-screen regions clip to the target surface instead of throwing.
- `layoutInspectorText()` emits ids, roles, rects, clip rects, scroll offsets,
  focus, and layer facts as deterministic text.
- `@flyingrobots/bijou-tui` exports the new API from the source barrel.

## Retrospective

- This is useful as a small diagnostic primitive rather than a shell feature.
  Apps can opt in during tests, demos, or debug modes without changing runtime
  ownership.
- The native `LayoutRect` mismatch was caught by package typecheck after the
  RED tests went green. Accepting both shapes is the right boundary behavior:
  app-frame can pass retained layout rects directly, while external tests can
  use x/y terminology.
