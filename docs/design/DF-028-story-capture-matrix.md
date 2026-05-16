---
title: DF-028 Story Capture Matrix
legend: DF
lane: design
---

# DF-028 Story Capture Matrix

## Framing

Bijou's best components are not single screenshots. They have rich,
interactive, static, pipe, and accessible renderings, often across multiple
variants and widths. Docs and tests need one place to see that matrix without
copying examples by hand.

DF-028 adds a pure story capture matrix. The first slice accepts story profiles,
variants, and a renderer callback, captures every profile/variant combination,
and renders deterministic text. It is intentionally renderer-neutral: callers
can use core components, TUI frames, fixtures, or DOGFOOD stories around it.

## Sponsored Users

- Maintainers auditing multi-mode component stories.
- Docs authors promoting regression fixtures into readable examples.
- MCP/tooling authors exporting the same capture facts to agents.
- Accessibility reviewers comparing lowerings without opening a TUI.

## Hills

1. A maintainer can capture every variant across interactive, static, pipe, and
   accessible profiles from one renderer callback.
2. A reviewer can see missing required modes before accepting a story capture.
3. A docs surface can render the captured matrix as stable text.

## Playback Questions

- Does the helper invoke the renderer once for every profile/variant pair?
- Does each capture preserve story id, profile id, variant id, mode, width, and
  output?
- Can callers require specific modes and get deterministic missing-mode output?
- Does matrix text group captures by variant and profile?
- Can the matrix carry component metadata from DX-025 without owning that
  metadata contract?
- Does `@flyingrobots/bijou` export the story capture API from the root barrel?

## Requirements

- Add `captureStoryMatrix(options)`.
- Add `storyCaptureMatrixText(matrix)`.
- Support profiles with id, label, mode, and width.
- Support variants with id, label, and optional description.
- Support optional component metadata.
- Support `requiredModes` and expose missing modes.
- Keep outputs as strings in this slice; surface-specific capture can build on
  top later.

## Acceptance Criteria

- RED tests fail before implementation and pass after.
- Captures are deterministic and cover the profile/variant cross product.
- Missing required modes are stable and sorted by output-mode order.
- Text output is suitable for docs, test failures, and agent reports.
- Docs and changelog describe the helper.

## Implementation Outline

- Implement the helper in `packages/bijou/src/core/story-capture.ts`.
- Export it from `packages/bijou/src/index.ts`.
- Keep rendering caller-owned; this helper records and formats the matrix.

## Drift Check

- Scope stayed renderer-neutral. The helper executes a caller-provided renderer
  and records string output, leaving surface conversion and runtime/test adapter
  orchestration to future wrappers.
- The matrix can carry DX-025 component metadata but does not validate or own it.
- Missing required modes are sorted by Bijou output-mode order.

## Playback

- `captureStoryMatrix()` invokes the renderer once for each profile/variant
  pair and stores story id, profile id, variant id, mode, width, and output.
- `missingModes` reports required modes absent from the supplied profiles.
- `storyCaptureMatrixText()` renders profile ids, variant ids, missing modes,
  and each captured output grouped by variant and profile.
- Optional `metadata` lets DOGFOOD/MCP/docs consumers attach the shared
  component metadata contract without duplicating fields.
- `@flyingrobots/bijou` exports the story capture API from the root barrel.

## Retrospective

- Keeping rendering caller-owned makes the helper useful in core tests, DOGFOOD,
  TUI fixtures, and MCP payload generation without importing runtime adapters.
- The next useful layer is a fixture/story wrapper that supplies profiles and
  renderer contexts automatically, then writes the matrix into docs artifacts.
