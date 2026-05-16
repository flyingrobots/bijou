# RE-034 Glyph-Fit Canvas Resolution

## Sponsored Users

- Terminal app builders rendering shader-authored logos, minimaps, raytraced
  previews, and procedural diagrams.
- Users whose terminals render Braille poorly or whose app style calls for
  solid, hatch, line, diagonal, or ASCII glyphs.
- Agents migrating app-local cell reducers into reusable Bijou primitives.

## Problem

`fitCellGlyph()` can collapse 2x4 coverage samples into a geometry-aware glyph,
but `canvas()` only exposes `cell`, `quad`, and `braille` resolution modes.
Apps that want non-Braille high-resolution shader output still need to sample
subpixels themselves, aggregate colors themselves, and call `fitCellGlyph()`
outside the canvas pipeline.

That duplicates the same sampling and style aggregation logic that already
lives in `canvas.ts`.

## Hills

1. A builder can render a shader through `canvas(..., { resolution: 'glyph' })`
   and receive a fitted cell glyph instead of Braille.
2. A builder can choose Unicode candidate fitting or ASCII density fitting
   through canvas options.
3. An agent can point to one canvas path for high-resolution sampling, color
   aggregation, and glyph collapse.

## Playback Questions

1. Does `resolution: 'glyph'` sample all eight 2x4 subpixels?
2. Does diagonal coverage choose a diagonal Unicode glyph through the existing
   `fitCellGlyph()` candidate set?
3. Does `glyphFit: { mode: 'ascii' }` stay inside the ASCII density ramp?
4. Are subpixel foreground/background colors still averaged like the Braille
   and Quad paths?

## Requirements

- Extend `CanvasResolution` with `glyph`.
- Add `glyphFit?: CellGlyphFitOptions` to `CanvasOptions`.
- Reuse `fitCellGlyph()` rather than creating a second candidate scorer.
- Reuse existing high-resolution color aggregation helpers.
- Preserve existing `cell`, `quad`, and `braille` behavior.
- Keep `fitCellGlyph()` available as a standalone helper.

## Acceptance Criteria

- RED tests cover Unicode diagonal glyph fitting through `canvas()`.
- RED tests cover ASCII glyph fitting through `canvas()`.
- RED tests prove fitted glyph cells retain averaged RGB style.
- `npm run test -- packages/bijou-tui/src/canvas.test.ts
  packages/bijou-tui/src/cell-glyph-fit.test.ts
  packages/bijou-tui/src/index.test.ts` passes.
- `npm run --workspace @flyingrobots/bijou-tui lint` passes.
- `npm run lint` passes.
- `git diff --check` passes.

## Design

Add a `renderGlyphResolution()` sibling to the existing Quad and Braille
renderers. It samples a 2x4 grid, builds row-major coverage values, accumulates
style from every sample, asks `fitCellGlyph()` for the output character, and
writes one cell.

Coverage defaults to `1` for non-space shader output and `0` for space output.
Shaders may return a cell with explicit `coverage` when they want fractional
samples for density or anti-aliasing experiments.

## RED

Initial RED run:

- `npm run test -- packages/bijou-tui/src/canvas.test.ts` failed because
  `resolution: 'glyph'` was ignored by `canvas()`.
- The diagonal test observed zero shader calls, the ASCII test received a blank
  cell, and the RGB averaging test received no `fgRGB`.

## GREEN

`canvas()` now accepts `resolution: 'glyph'` and `glyphFit` options. The new
renderer samples 2x4 coverage, accumulates subpixel styles, collapses coverage
through `fitCellGlyph()`, and writes the fitted glyph through the existing cell
write path.

`ShaderCell` now allows optional fractional `coverage` for apps that want
anti-aliased glyph fitting instead of boolean non-space samples.

## Drift Check

- `npm run test -- packages/bijou-tui/src/canvas.test.ts
  packages/bijou-tui/src/cell-glyph-fit.test.ts
  packages/bijou-tui/src/index.test.ts` passed with 21 tests.
- `npm run --workspace @flyingrobots/bijou-tui lint` passed.
- `npm run lint` passed.
- `git diff --check` passed.

## Playback

Playback answers:

1. `fits glyph resolution from 2x4 diagonal coverage` proves the shader is
   called eight times for one terminal cell.
2. The same test proves diagonal coverage chooses `╱` through the existing
   Unicode candidate set.
3. `fits glyph resolution with the ASCII density ramp` proves
   `glyphFit: { mode: 'ascii' }` stays in the ASCII ramp.
4. `averages glyph-fit sub-pixel colors` proves glyph-fit rendering keeps the
   same color aggregation behavior as Braille and Quad.

## Retrospective

The right boundary was to promote the reducer into `canvas()` without removing
the standalone `fitCellGlyph()` helper. Apps can now choose a complete canvas
mode for common shader output, while still using the helper directly for custom
pipelines.
