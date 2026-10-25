# Jacquard 12 title font

Jacquard 12 by the Soft Type Project Authors is distributed under the accompanying SIL
Open Font License 1.1 (`OFL.txt`). The bundled font is unmodified.

Source: [Google Fonts](https://github.com/google/fonts/tree/6e4b84c976cadb3c49a40fd9a1c203e4f7fcf2da/ofl/jacquard12).
Font SHA-256: `b1560583565a37f3d3a25cf2572df3efd2d773ecdcbb459dcd7ea0398cb840d1`.

`npm run generate:dogfood:title` extracts the five actual glyphs of “Bijou” into
`assets/jacquard12-bijou.json`. `npm run check:dogfood:title` verifies the
checked-in geometry. OpenType.js is a development dependency; DOGFOOD reads
only the small geometry atlas at runtime. No font installation or network
request is required.

The cylinder adapts the visual idea in Bijou Fun's `08-text-cylinder` challenge:
four repeated words, staggered letters, perspective and front-face lighting.
It uses the official RasterFont/layoutRasterText primitives and existing raster-to-surface Braille renderer. The cylinder projection stays in DOGFOOD.
Geometry is deterministic for the supplied animation time; terminal dimensions
bound the raster grid to 360 × 144 samples. Tiny terminals omit the ornament.
Release facts and navigation remain available in text presentations.
