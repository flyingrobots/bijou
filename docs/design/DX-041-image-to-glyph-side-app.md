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
main preview pane, and let the user hot-swap between Braille and ASCII output.

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
glyphs. Pressing `m` swaps the render mode immediately.

## Product Shape

```text
+ Images ---------------------+ + Preview ----------------------------------+
| /repo/assets                | | Bijou.svg                                  |
| > d icons/                  | |                                            |
|   - Bijou.svg               | |   ⣿⣿⣿⣿⣿⣶⣤...                    |
|   - sample.ppm              | |                                            |
+-----------------------------+ +--------------------------------------------+
q quit  Enter open/select  <- parent  m mode  r refresh
```

## Scope

- Add `examples/image-viewer/main.ts` as a runnable side app.
- Add `examples/image-viewer/image-codecs.ts` for dependency-free PNG and PPM
  decoding.
- Reuse the existing SVG rasterizer for SVG preview.
- Add `npm run image-viewer`.
- Add focused tests for codec behavior, render-mode switching, and app view
  output.

## Non-Goals

- JPEG/WebP decoding.
- Public package-level image codec APIs.
- A generalized image-workbench product with cropping, dithering controls, or
  export.
- Promoting a new public image block in this slice.

## Runtime Contract

The app starts in `assets/` by default. If the user passes a directory, that
directory becomes the file-picker root. If the user passes an image file, the
file's parent directory becomes the root and the file starts selected.

Supported input formats:

- SVG: rasterized into a transparent RGBA frame at preview resolution.
- PNG: 8-bit, non-interlaced RGB/RGBA.
- PPM/PNM: `P3` and `P6` RGB Netpbm data.

## Lower Modes

The app is interactive-first. Pipe/static smoke only needs to prove startup and
first-frame rendering; the selected path and mode remain ordinary model state
for tests.

## Accessibility / Assistive Posture

The file picker remains textual. The preview pane names the selected file,
render mode, format, and dimensions so the image is not only communicated by
glyph art.

## Tests To Write First

- RED: PNG decoder cannot map synthetic RGB/RGBA PNGs into RGBA.
- RED: PPM decoder cannot map `P3` and `P6` RGB data into RGBA.
- RED: image viewer starts with an image selected from the root.
- RED: pressing `m` does not change Braille mode to ASCII mode.
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
