---
title: DX-024 Surface Diff Viewer
legend: DX
lane: design
---

# DX-024 Surface Diff Viewer

## Framing

Render debugging still depends on ad hoc inspection and text dumps. That is
especially painful when a frame regression changes only a few cells, or when the
character looks correct but a style changed underneath it.

Bijou already has a strong `Surface` truth object. DX-024 makes that truth
inspectable with a first-party diff model and viewer surface.

## Sponsored Users

- Maintainers investigating visual regression failures in frame tests.
- App authors debugging composed surfaces where nested layout masks or overlays
  changed a small region.
- Agent workflows that need a compact, plain-text rendering of surface truth
  without manually dumping raw cells.

## Hills

1. A maintainer can diff two surfaces and immediately see changed cell counts,
   style-only changes, and the smallest changed bounds.
2. An app author can render the same diff side-by-side or as an overlay surface
   without writing custom inspection code.
3. A test can print a plain-text diff summary that preserves the same changed
   cell facts when rich terminal rendering is unavailable.

## Playback Questions

- Does the diff distinguish char changes from style-only changes?
- Does the diff include cells added by width or height differences?
- Does the viewer produce both side-by-side and overlay renderings?
- Does the plain-text rendering include counts and per-cell coordinates?
- Does the package export the diff model and viewer from `@flyingrobots/bijou-tui`?

## Requirements

- Add a pure `diffSurfaces(before, after)` model.
- Add `surfaceDiffSurface(before, after, options)` for rich viewer output.
- Add `surfaceDiffText(before, after, options)` for test and pipe output.
- Support `side-by-side` and `overlay` modes.
- Count changed cells, character deltas, and style-only deltas separately.
- Include a changed bounds rectangle when any cell differs.
- Avoid changing existing surface or differ semantics.

## Acceptance Criteria

- Focused `surface-diff` tests fail before implementation and pass after.
- Cycle tests confirm the design doc sections and root package export.
- Docs and changelog describe the new viewer.

## Implementation Outline

- Implement the diff model and renderers in `packages/bijou-tui/src/surface-diff.ts`.
- Export the new API from the `bijou-tui` source barrel.
- Keep rendering intentionally plain: labels, counts, and simple ASCII markers
  are more useful in failure output than decorative chrome.

## Drift Check

- The implementation stayed in `bijou-tui` because the model is useful for
  tests, but the viewer is a TUI authoring/debug component.
- No existing surface or differ semantics changed; DX-024 only reads `Surface`
  cells and builds a separate report/view.
- The side-by-side renderer intentionally keeps output plain and copyable for
  failure logs. Overlay mode applies simple highlight styles for rich surfaces.

## Playback

- RED: focused tests failed on the missing `surface-diff` module and missing
  source-barrel exports.
- GREEN: `diffSurfaces()` now reports changed counts, char deltas, style-only
  deltas, changed bounds, and per-cell coordinates.
- `surfaceDiffSurface()` renders both `side-by-side` and `overlay` views.
- `surfaceDiffText()` renders a plain coordinate report for pipe/test output.

## Retrospective

- The useful split was model first, viewer second. That keeps tests and future
  tooling from needing to parse the visual surface.
- Style-only changes are first-class because they are a common terminal UI
  regression and invisible in simple text snapshots.
- A future follow-on could wire this into frame-regression failure output, but
  the reusable primitive is now available.
