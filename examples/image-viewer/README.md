# Image Viewer

Browse local image files in a sidebar and render the selected image as terminal
glyph art in the main pane.

```sh
npm run image-viewer
npm run image-viewer -- assets
npm run image-viewer -- assets/Bijou.svg
```

## Keys

- `j` / `Down`: focus next file-picker entry
- `k` / `Up`: focus previous file-picker entry
- `Enter`: open a directory or select an image
- `Left` / `Backspace`: move to the parent directory
- `m` / `Tab`: switch between Braille and ASCII rendering
- `r`: refresh the current directory
- `q` / `Ctrl+C`: quit

## Formats

- SVG, rasterized into a transparent RGBA frame at preview size
- PNG, limited to 8-bit non-interlaced RGB/RGBA
- PPM/PNM, limited to `P3` and `P6` RGB Netpbm data
