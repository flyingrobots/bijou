---
title: DF-036 Audit loading placeholders family across real surfaces
legend: DF
lane: design
priority: medium
keywords:
  - component-audit
  - dogfood
  - lowerings
  - skeleton
---

# DF-036 Audit loading placeholders family across real surfaces

## Framing

The loading placeholder family is intentionally small: `skeleton()` should
cover short-lived, known-shape loading gaps and should not become a generic
decorative filler. Because skeletons exist to preserve layout truth, they are a
good v6 release proof point: rich/static output can preserve shape, but pipe
and accessible lowerings must preserve meaning without relying on placeholder
glyphs.

This audit verifies the family against the real DOGFOOD story protocol,
component-family doctrine, and mode-aware runtime behavior.

## Sponsored Users

- TUI app authors deciding whether a known-shape loading gap should use
  `skeleton()`, `progressBar()`, or explicit prose.
- Docs readers switching the loading story across rich, static, pipe, and
  accessible profiles.
- Maintainers who need a focused regression proving DOGFOOD and design-system
  guidance match current runtime truth.

## Hills

1. A builder can inspect the DOGFOOD loading placeholder story and see both
   form-shaped and card-shaped placeholder regions.
2. A reader can switch the story through interactive, static, pipe, and
   accessible profiles without decorative placeholder glyphs leaking into
   constrained output.
3. A maintainer can run one cycle test that ties `skeleton()` behavior,
   DOGFOOD story metadata, and component-family guidance together.

## Playback Questions

- Does DOGFOOD expose the loading placeholder family through the `skeleton()`
  story?
- Do the story variants cover both field/form and region/card skeleton usage?
- Do interactive and static profiles preserve the placeholder shape?
- Do pipe and accessible profiles avoid placeholder glyph leakage?
- Do the design-system docs still describe skeletons as short-lived,
  known-shape placeholders rather than generic loading decoration?

## Requirements

- Keep the existing `skeleton` story identity and `loading-placeholders`
  coverage family id.
- Render every skeleton story variant in every canonical story profile.
- Treat rich/static placeholder glyphs as allowed only in visual profiles.
- Treat pipe output as label/context preserving, not placeholder-glyph
  preserving.
- Treat accessible output as explicit loading-state language.
- Confirm `docs/design-system/component-families.md` still matches the runtime
  story posture.

## Acceptance Criteria

- `tests/cycles/DF-036/loading-placeholders-family-audit.test.ts` proves the
  cycle doc carries the modern playback sections.
- The test locates the DOGFOOD `skeleton()` story and verifies the expected
  variants.
- Every variant renders non-empty output in every documented profile.
- Rich/static output includes placeholder shape; pipe output does not include
  placeholder glyphs; accessible output includes explicit loading text.
- Component-family docs retain the known-shape, short-lived loading guidance.

## Implementation Outline

1. Add a DF-036 cycle test that renders the `skeleton` DOGFOOD story through
   the shared story protocol.
2. Read-test the loading placeholder section in
   `docs/design-system/component-families.md`.
3. Move the backlog note into `docs/design/` and update the v6 lane pointer.
4. Record any drift as follow-on backlog debt instead of silently widening
   this small audit.

## Drift Check

No runtime drift was found in this slice. `skeleton()` already lowers to visual
placeholder bars in interactive/static modes, no output in pipe mode, and
explicit `Loading...` text in accessible mode. DOGFOOD wraps those primitives
with labels and region titles, so pipe output remains meaningful without
copying decorative placeholder glyphs.

No follow-on backlog item is needed for this slice.

## Playback

- RED: the release lane had only a backlog note; no DF-036 playback test tied
  the loading placeholder story to real mode lowerings.
- GREEN: the new cycle test renders both `form-shell` and `card-region` story
  variants across interactive, static, pipe, and accessible profiles.
- Rich/static previews preserve shape with placeholder glyphs.
- Pipe previews preserve labels/regions while omitting placeholder glyphs.
- Accessible previews include explicit loading text.

## Retrospective

The audit confirmed that the smallest block families still need first-class
mode tests. There was no need to expand `skeleton()` itself; the valuable work
was pinning its semantic limits so future loading-screen or block work cannot
quietly turn skeletons into decorative filler.
