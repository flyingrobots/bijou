---
title: DX-041 Image-to-Glyph Side App
legend: DX
lane: asap
priority: medium
issue: https://github.com/flyingrobots/bijou/issues/305
keywords:
  - ascii
  - braille
  - file-picker
  - image
  - raster
  - side-app
---

# DX-041 Image-to-Glyph Side App

## Framing

Issue #305 adds a small, runnable side app that proves image browsing and
image-to-glyph rendering as a real workflow instead of only as DOGFOOD title
art. The app should use a sidebar file explorer, render the selected image in a
main preview pane, let the user hot-swap between Braille and ASCII output, and
expose enough tuning controls to discuss how image-to-text filters behave.

The app stays intentionally small: it reuses `filePickerSurface()` for the
filesystem browser and `rasterToGlyphSurface()` for glyph rendering. Codec
support is dependency-free and scoped to formats the repo can test
deterministically.

## Sponsor Human

- A maintainer wants to point Bijou at local assets and quickly inspect how
  they look as terminal glyph art.
- A designer wants to compare Braille density against ASCII density without
  restarting the app.
- A contributor wants a concrete example of `filePickerSurface()` driving a
  real side-by-side tool.

## Sponsor Agent

- A review agent needs the file browser, selected path, renderer mode, decoded
  frame, and visible glyph output to be inspectable through tests.
- A future block-promotion agent needs evidence that the file picker can drive
  a richer app before promoting image browsing into a public block family.

## Hill

A user can launch the image viewer, browse supported image files in a sidebar,
select an image, and see the main pane render that image as Braille or ASCII
glyphs. Pressing `m` swaps the render mode immediately. The preview pane also
supports pan and zoom so a user can inspect image details without leaving the
side app. The same pane lets the user preserve sampled image colors, adjust
Braille threshold and contrast, and toggle ordered dithering.

## Product Shape

```text
+ Images ---------------------+ + Preview ----------------------------------+
| /repo/assets                | | Bijou.svg                                  |
| > d icons/                  | |                                            |
|   - Bijou.svg               | |   ⣿⣿⣿⣿⣿⣶⣤...                    |
|   - sample.ppm              | |                                            |
+-----------------------------+ +--------------------------------------------+
Mode: braille  Color: monochrome  Dither: none  Threshold: 45%  Contrast: 100%
q quit  Enter open/select  <- parent  m mode  c color  d dither
```

## Scope

- Add `examples/image-viewer/main.ts` as a runnable side app.
- Add `examples/image-viewer/image-codecs.ts` for dependency-free PNG and PPM
  decoding.
- Reuse the existing SVG rasterizer for SVG preview.
- Add `npm run image-viewer`.
- Expose color mode, threshold, contrast, and ordered-dither controls in the
  preview model.
- Add focused tests for codec behavior, render-mode switching, and app view
  output.

## Non-Goals

- JPEG/WebP decoding.
- Public package-level image codec APIs.
- A generalized image-workbench product with cropping, palette quantization,
  error-diffusion dithering, or export.
- Promoting a new public image block in this slice.

## Runtime Contract

The app starts in `assets/` by default. If the user passes a directory, that
directory becomes the file-picker root. If the user passes an image file, the
file's parent directory becomes the root and the file starts selected.

Supported input formats:

- SVG: rasterized into a transparent RGBA frame at preview resolution.
- PNG: 8-bit, non-interlaced RGB/RGBA.
- PPM/PNM: `P3` and `P6` RGB Netpbm data.

Navigation contract:

- `j` / `k`: move file-picker focus.
- `Enter`: select focused image or open focused directory.
- `Backspace`: move the file picker to its parent directory.
- Arrow keys: pan the image viewport.
- `+` / `=`: zoom in.
- `-`: zoom out.
- `0`: reset to fit.
- `m` / `Tab`: switch Braille and ASCII rendering.
- `c`: cycle color mode between monochrome, foreground color, and
  foreground/background color.
- `d`: toggle ordered dithering.
- `[` / `]`: lower or raise the Braille threshold.
- `,` / `.`: lower or raise contrast.

The file picker marks focus with `>` and the rendered image with `*`. The
preview gutter reports zoom percentage, pan offset, color mode, dithering mode,
threshold, and contrast. The initial image and every newly selected image start
at `100%` fit, centered horizontally and vertically.

## Lower Modes

The app is interactive-first. Pipe/static smoke only needs to prove startup and
first-frame rendering; the selected path and mode remain ordinary model state
for tests.

## Accessibility / Assistive Posture

The file picker remains textual. The preview pane names the selected file,
render mode, format, dimensions, and tuning state so the image is not only
communicated by glyph art.

## Tests To Write First

- RED: PNG decoder cannot map synthetic RGB/RGBA PNGs into RGBA.
- RED: PPM decoder cannot map `P3` and `P6` RGB data into RGBA.
- RED: image viewer starts with an image selected from the root.
- RED: pressing `m` does not change Braille mode to ASCII mode.
- RED: pressing `c` does not preserve sampled image colors on rendered glyphs.
- RED: threshold, contrast, and dither controls do not change visible tuning
  state.
- RED: rendered view does not contain the file picker and preview panes.

## Validation

```bash
npx vitest run scripts/image-viewer.test.ts scripts/svg-raster.test.ts packages/bijou-tui/src/raster-glyph.test.ts
npm run typecheck:test
npm run lint
```

## Follow-On Debt

- Add JPEG/WebP support behind an explicit codec adapter decision.
- Decide whether this app should become part of DOGFOOD or stay an example.
- Promote a first-class image/file-browser block only after the side-app shape
  proves stable.
- Add error-diffusion algorithms such as Floyd-Steinberg or Atkinson once the
  ordered-dither baseline has enough usage feedback.
- Add palette quantization and custom charset editing if the side app graduates
  into a broader image-to-text workbench.
