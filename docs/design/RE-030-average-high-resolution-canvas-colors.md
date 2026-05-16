# RE-030 — Average High-Resolution Canvas Colors

Legend: [RE — Runtime Engine](../legends/RE-runtime-engine.md)

## Sponsor Human

A terminal app builder using `@flyingrobots/bijou-tui` canvas shaders for
small procedural images, title screens, charts, and textured scene previews.

## Sponsor Agent

An implementation agent that must render high-density terminal art without
repairing colors after the canvas has already collapsed subpixels into cells.

## Hills

1. A builder can return per-subpixel RGB values from a `canvas()` shader and
   trust Bijou to collapse those colors the way image resampling normally
   does.
2. A builder can use `braille` or `quad` resolution without losing color when
   the first lit subpixel is not representative of the whole terminal cell.
3. An agent can debug canvas color behavior from `canvas.ts` itself rather
   than recommending app-local post-render `setRGB()` correction loops.

## Playback Questions

1. In `braille` mode, when eight subpixels return different foreground RGB
   values, does the resulting Braille cell use their arithmetic mean?
2. In `braille` mode, when all eight subpixels are visually off but still
   return background RGB values, does the collapsed cell preserve their
   average background style?
3. In `quad` mode, when four subpixels return different RGB values, does the
   resulting quadrant character use the arithmetic mean instead of the first
   lit subpixel's style?
4. Does the character coverage behavior stay unchanged while only style
   aggregation changes?

## Requirements

- `canvas(..., { resolution: 'braille' })` must sample all 2x4 subpixels for
  the output cell and average every available foreground RGB contribution.
- `canvas(..., { resolution: 'braille' })` must also average every available
  background RGB contribution, including cells whose shader character is a
  space.
- `canvas(..., { resolution: 'quad' })` must use the same color aggregation
  rule across its 2x2 subpixels.
- Shader results that return `fgRGB` or `bgRGB` must avoid unnecessary hex
  parsing.
- Shader results that return parseable hex or resolved color references must
  still participate in the same averaging path.
- Coverage remains boolean: non-space subpixels set Braille dots or quadrant
  bits, and space subpixels leave those dots or bits off.
- Modifiers remain compatibility-oriented and come from the first lit styled
  subpixel.

## Acceptance Criteria

- Red tests prove Braille foreground averaging, Braille background averaging
  for an empty Braille cell, and Quad foreground averaging.
- The implementation changes `packages/bijou-tui/src/canvas.ts` instead of
  requiring app-local post-processing.
- `npm run test -- packages/bijou-tui/src/canvas.test.ts` passes.
- `npm run lint --workspace @flyingrobots/bijou-tui` passes.
- `git diff --check` passes.

## Accessibility / Assistive Reading Posture

This change preserves character semantics and only adjusts styling. Existing
plain text and assistive interpretations of the character grid should remain
unchanged.

## Localization / Directionality Posture

The feature is independent of prose localization and bidirectional text. It
does not alter grapheme ordering or directional layout.

## Agent Inspectability / Explainability Posture

The color decision must live in named helper functions in `canvas.ts`, with
tests that make the sampling rule explicit. Agents should be able to explain
that the high-resolution renderer computes coverage and style separately:
coverage chooses the Braille or quadrant glyph, while style is averaged from
sampled subpixel styles.

## Linked Invariants

- [Tests Are the Spec](../invariants/tests-are-the-spec.md)
- [Runtime Truth Wins](../invariants/runtime-truth-wins.md)

## Implementation Outline

1. Add failing tests for Braille foreground averaging, empty-cell background
   averaging, and Quad foreground averaging.
2. Introduce a small color accumulator in `canvas.ts`.
3. Resolve each sampled cell's foreground and background color from `fgRGB`,
   `bgRGB`, resolved color refs, or parseable hex strings.
4. Average available foreground and background samples independently using
   rounded arithmetic means.
5. Apply the averaged style to the collapsed Braille or Quad cell while
   preserving existing coverage behavior.

## Tests To Write First

- `averages braille sub-pixel foreground colors`
- `preserves averaged braille background colors for empty cells`
- `averages quad sub-pixel foreground colors`

## Drift Check

- RED observed:
  `npm run test -- packages/bijou-tui/src/canvas.test.ts` failed with three
  expected assertions: Braille foreground used `[0, 0, 0]`, empty Braille
  background was `undefined`, and Quad foreground used `[0, 0, 0]`.
- GREEN observed:
  `npm run test -- packages/bijou-tui/src/canvas.test.ts` passed with 9 tests.
- Package lint observed:
  `npm run lint --workspace @flyingrobots/bijou-tui` passed.
- Root lint:
  `npm run lint` reached the workspace sweep but failed on pre-existing
  uncommitted `packages/heatmap` work because `@flyingrobots/bijou-heatmap`
  had no `lint` script. After the local heatmap workspace drift was repaired,
  `npm run lint` passed.
- Pre-commit lockfile gate:
  `npm ls --all` still fails in the local install tree with extraneous and
  missing dependency reports unrelated to this canvas change, so the scoped
  commit used the recorded tests and lint results rather than treating local
  install drift as RE-030 scope.
- Whitespace drift:
  `git diff --check` passed.

## Playback

1. Braille foreground averaging is covered by
   `averages braille sub-pixel foreground colors`; the collapsed full Braille
   cell now carries `[28, 56, 84]` from eight RGB samples.
2. Empty Braille background preservation is covered by
   `preserves averaged braille background colors for empty cells`; the blank
   Braille cell now carries `[28, 38, 48]` even when no dot is lit.
3. Quad foreground averaging is covered by
   `averages quad sub-pixel foreground colors`; the `▚` glyph now carries
   `[15, 30, 45]` from all four samples.
4. Existing coverage tests for top-left Braille and diagonal Quad glyphs
   still pass, so glyph selection stayed stable while style aggregation
   changed.

## Retrospective

The root issue was local to high-resolution canvas style aggregation. The
renderer already sampled the right subpixels for coverage but treated style as
a first-lit-subpixel property. Splitting coverage from style lets shader authors
return material colors per sample and lets Bijou perform the terminal-cell
resampling step itself. No app should need to walk the rendered surface after
`canvas()` just to recover colors.
