# Image Viewer

Browse local image files in a sidebar and render the selected image as terminal
glyph art in the main pane.

```sh
npm run img
npm run img -- assets
npm run img -- assets/Bijou.svg
npm run image-viewer
npm run image-viewer -- assets
npm run image-viewer -- assets/Bijou.svg
```

## Keys

The sidebar marks the focused row with `>` and the image currently rendered in
the preview with `*`.

- `j`: focus next file-picker entry
- `k`: focus previous file-picker entry
- `Enter`: open a directory or select an image
- `Backspace`: move to the parent directory
- `Arrow keys`: pan the image viewport
- `+` / `=`: zoom in
- `-`: zoom out
- `0`: reset to fit
- `m` / `Tab`: switch between Braille and ASCII rendering
- `c`: cycle color mode between monochrome, foreground color, and
  foreground/background color
- `d`: toggle ordered dithering
- `[` / `]`: lower or raise the Braille threshold
- `,` / `.`: lower or raise contrast
- `r`: refresh the current directory
- `q` / `Ctrl+C`: quit

The preview gutter reports the current zoom percentage, pan offset, color
mode, dithering mode, threshold, and contrast. Loading a new image resets the
viewport to fit mode at `100%`, centered horizontally and vertically.

## Formats

- SVG, rasterized into a transparent RGBA frame at preview size
- PNG, limited to 8-bit non-interlaced RGB/RGBA
- PPM/PNM, limited to `P3` and `P6` RGB Netpbm data
