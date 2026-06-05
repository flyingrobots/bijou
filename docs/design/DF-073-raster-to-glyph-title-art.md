---
title: DF-073 Raster-to-Glyph Title Art
legend: DF
lane: release
priority: high
issue: https://github.com/flyingrobots/bijou/issues/303
keywords:
  - dogfood
  - image-filter
  - landing
  - raster
  - release
  - title-screen
  - v7
---

# DF-073 Raster-to-Glyph Title Art

## Framing

Issue #303 asks the current DOGFOOD landing screen to carry a unique
`V7 Launch Wake` release identity. The first prototype used a textual wake
ribbon; the current direction is stronger: render a deterministic stacked
sine-wave wake as the animated title background and use the committed
`Bijou.svg` wordmark as a background-transparent glyph mask in complementary
colors.

The design follows a Design Thinking loop: observe that terminal title art is
most useful when it can be generated, inspected, tested, and lowered; frame the
problem as a reusable raster adapter rather than a one-off DOGFOOD paint pass;
prototype a deterministic `RgbaFrame -> Surface` filter for vector and image
masks; rasterize the committed SVG wordmark without adding a browser canvas
dependency; and prove the result with synthetic-frame tests plus DOGFOOD
rendered-frame tests.

## Sponsor Human

- A maintainer opening DOGFOOD after `v7.0.0` wants the first screen to feel
  release-specific without becoming a blocking splash page.
- A visual designer should be able to provide an image, generated frame, or
  procedural RGBA buffer and choose the terminal character set used to render
  it.
- A reader should still see the normal DOGFOOD entry point, prompt, footer
  controls, and release documentation route.

## Sponsor Agent

- A review agent needs the release title, raster filter contract, renderer
  mode, charset, pulse behavior, and lower modes to remain inspectable through
  existing artifacts and tests.
- A future capture/export agent should be able to feed decoded frames through
  the same primitive without depending on browser canvas or VHS.

## Hill

A DOGFOOD reader can open the landing title screen and see `V7 Launch Wake`
named in the entry panel while stacked sine-wave glyph strata fill the terminal
and the `Bijou.svg` wordmark tints those foreground glyphs in complementary
colors without painting an opaque background box.
Braille is one supported glyph mode, but the renderer can also use custom
density character sets such as `/\MXYZabc!?=-. `. The screen remains
pulse-driven, deterministic, bounded by the current landing quality profiles,
and lowerable through existing release-title facts.

## Current Truth

- `V7 Launch Wake` is already the current release-title artifact.
- The landing renderer is already pulse-driven, cached, and quality-bucketed.
- `@flyingrobots/bijou-tui` already has shader-based `canvas()` output for
  cell, quad, Braille, and fitted-glyph resolutions.
- `cell-glyph-fit.ts` already establishes density ramps and coverage fitting.
- Static, pipe, and accessible release-title output already comes from
  `examples/docs/release-title.ts`.

## Product Shape

### Wide Landing Screen

The stacked sine-wave wake occupies the first-viewport title surface. It uses
the existing landing pulse shader and quality buckets, so the field stays
animated without adding a new image decode path or GPU dependency. Foreground
content still wins. The visible Bijou wordmark is rasterized from
`assets/Bijou.svg`, fit to the terminal cell aspect, and used as a
background-transparent mask that writes SVG glyphs without replacing existing
backgrounds. The lower FlyingRobots wordmark is read from
`assets/flyingrobotslogo.txt`, treats Braille blank cells as transparent holes,
fits the visible logo glyphs to the available landing width, preserves the
underlying cell background, and paints visible Braille glyphs with the opposite
foreground color of that preserved background. This keeps the mark transparent
through modal dimming because the logo does not own a rectangular background
fill.

```text
+------------------------------------------------------------------------------+
|                         BIJOU                                                |
|                                                                              |
|  ░░░████░░░░████░░████░░░░████░░░░████░░████░░░░████░░░░████░░              |
|  ░███░░░████░░░░████░░░████░░░████░░░░████░░░████░░░████░░░                 |
|  █░░████░░░████░░░░████░░░████░░░████░░░░████░░░████░░░████                |
|                                                                              |
|  + DOGFOOD / V7 Launch Wake ----------------------------------------------+ |
|  | Documentation Of Good Foundational Onboarding and Discovery             | |
|  +-------------------------------------------------------------------------+ |
|                                                                              |
|                              Press [Enter]                                  |
| Esc/q quit ...                                      60 fps - auto/full v7.0.0 |
+------------------------------------------------------------------------------+
```

### Small Landing Screen

Small terminals keep the title identity and use fewer glyph cells.

```text
+------------------------------------------+
|    ░░████░░███░░████░░███░░████        |
|    ██░░░████░░███░░████░░███░░█        |
| + DOGFOOD / V7 Launch Wake ------------+ |
| | Documentation Of Good Foundational... | |
| +---------------------------------------+ |
|              Press [Enter]               |
| Esc/q quit                auto/compact    |
+------------------------------------------+
```

### Lower Modes

The art is decorative. Lower modes keep exposing semantic release facts.

```text
pipe:
  release_id=v7.0.0
  release_title="V7 Launch Wake"
  release_motif="launch wake"

accessible:
  DOGFOOD opens on the V7 Launch Wake release title. The interactive
  screen includes decorative raster title art rendered as terminal glyphs.
```

## Raster Adapter

The primitive belongs in `@flyingrobots/bijou-tui` so DOGFOOD is only the first
consumer.

```text
RgbaFrame
  -> fit source pixels into target cell grid
  -> sample brightness/alpha/color per cell or sub-cell
  -> choose renderer:
       charset: density ramp from custom characters
       braille: 2x4 dot mask
       quad:    2x2 quadrant mask
  -> emit Bijou Surface
```

### Input

```ts
interface RgbaFrame {
  width: number;
  height: number;
  data: Uint8ClampedArray | readonly number[];
}
```

The public TUI primitive accepts already-decoded RGBA. DOGFOOD keeps SVG
rasterization in the example app layer so the core package contract stays
deterministic and dependency-free.

### Renderer Modes

- `charset`: render each output cell with a density ramp. The caller can pass a
  custom glyph string such as `/\MXYZabc!?=-. ` and choose whether it is ordered
  dark-to-light or light-to-dark.
- `braille`: render each output cell with a 2x4 Braille mask sampled from
  darkness/alpha.
- `quad`: render each output cell with a 2x2 quadrant mask sampled from
  darkness/alpha.

### Fit Modes

- `fit`: preserve aspect ratio, fill the target, crop overflow, and center
  both axes.
- `contain`: preserve aspect ratio and letterbox with empty cells.
- `stretch`: map the frame directly into the requested grid.

`cellAspectRatio` is the visual width divided by height of one terminal cell.
The default is `1` for square-cell math. DOGFOOD uses `0.5` for the V7 SVG
wordmark mask so the rendered logo fits the visible iTerm-style viewport
instead of looking vertically stretched.

### Color Modes

- `none`: only glyphs.
- `fg`: average visible source pixels into foreground RGB.
- `fg-bg`: average visible/dark pixels into foreground and light pixels into
  background when available.

## Determinism And Performance

- No browser canvas, wall clock, external image decoder, or GPU dependency is
  required.
- DOGFOOD uses the existing pulse timestamp and quality frame-step
  quantization.
- DOGFOOD computes the stacked sine-wave wake from quantized landing pulse time
  and current terminal dimensions, then paints it through the existing landing
  shader.
- DOGFOOD reads `assets/Bijou.svg` once, rasterizes the wordmark into a cached
  mask per terminal size, and uses the mask to write foreground glyphs without
  replacing the underlying backgrounds.
- Target dimensions are bounded by landing quality profiles before rendering.
- Cache keys include viewport, theme, quality, quantized time, and FPS badge
  state, preserving the existing landing frame cache behavior.

## Accessibility / Assistive Posture

The raster title art is decorative in interactive mode. Assistive output must
not depend on parsing glyph art. It continues to rely on the release title,
motif, proof lanes, and accessible release prose.

## Agent Inspectability / Explainability Posture

Agents should be able to prove the slice by checking:

- the current release title appears on the landing frame;
- raster art uses the configured renderer and charset;
- pulse changes the title art deterministically;
- raw RGBA filter tests cover charset, Braille, quad, fit, color, and invalid
  charset behavior;
- the stacked sine-wave wake remains the visible landing background;
- pipe/accessibility release facts remain sourced from release-title metadata.

## Tests To Write First

- RED: `rasterToGlyphSurface()` does not exist or is not exported.
- RED: custom charset rendering cannot map a synthetic black/white frame.
- RED: invalid charsets are not rejected.
- RED: Braille rendering cannot map a single top-left subpixel to dot 1.
- RED: terminal `fit` mode stretches or letterboxes instead of centered
  fill-cropping.
- RED: terminal `fit` mode assumes square cells and crops the wrong axis in
  typical tall-cell terminals.
- RED: DOGFOOD landing frame does not render enough stacked sine-wave glyph art.
- RED: the committed `Bijou.svg` wordmark is not rasterized into the rendered
  landing frame.
- RED: the committed `Bijou.svg` wordmark replaces backgrounds or paints
  transparent SVG pixels instead of acting as a background-transparent mask.
- RED: the lower FlyingRobots wordmark is generated from the old wide text
  assets instead of `assets/flyingrobotslogo.txt`.
- RED: pressing backtick on the landing title enters the docs instead of
  toggling the shell perf HUD in place.
- RED: the landing title perf HUD omits shell HUD rows or reports a permanently
  zero frame time because the root DOGFOOD render loop is not hydrating timing
  telemetry.
- RED: DOGFOOD landing still paints the old procedural BIJOU title over the
  wake field.

## Validation

Run focused tests first:

```bash
npx vitest run packages/bijou-tui/src/raster-glyph.test.ts
npx vitest run scripts/svg-raster.test.ts
npx vitest run scripts/docs-preview.test.ts -t "stacked sine-wave"
```

Then run the relevant DOGFOOD and package validation lane:

```bash
npx vitest run scripts/docs-preview.test.ts
npm run typecheck:test
npm run docs:inventory
npm run dogfood:i18n:check
```

## Playback

This slice lands when DOGFOOD has a visible, localized `V7 Launch Wake` landing
identity and a deterministic raster-to-glyph title treatment, without adding
new strings, bypassing the landing cache, adding image decoding dependencies,
or changing lower-mode release facts.
