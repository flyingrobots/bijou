# Markdown with a Google Fonts heading

From the repository root:

```sh
npm run markdown-font -- examples/markdown-font/sample.md
npm run markdown-font -- /path/to/document.md
```

In an interactive terminal, downloads the Google Fonts family list and opens
Bijou’s searchable selector. Type a family name, use the arrow keys, and press
Enter to choose. **Space Grotesk** appears first. The document prints into
terminal scrollback, with each `# H1` converted to Braille through Bijou’s
`RasterFont` and `rasterTextSurface()` APIs. Longer titles wrap to multiple
raster lines. Body text and other blocks use the existing Markdown renderer.

The original, unmodified TTF and SIL Open Font License are in
[`assets/fonts/space-grotesk`](../../assets/fonts/space-grotesk/README.md).
The demo uses the existing OpenType.js development dependency to compile only
the glyphs needed by the headings. No font installation is needed.

```sh
# Provide your own TTF or OTF file:
npm run markdown-font -- document.md --font /path/to/MyFont.otf

# Choose a Google Fonts family directly, bypassing the selector:
npm run markdown-font -- document.md --google-font "Lora"

# Use bundled Space Grotesk without downloading the catalog:
npm run markdown-font -- document.md --offline
```

The catalog and chosen Google font are downloaded for the current run and kept
in memory, with no persistent cache. Space Grotesk uses the bundled asset.
Downloads have a 15-second timeout per request and limits of 8 MiB for the
catalog and font, and 64 KiB for CSS. Google Fonts families that require multiple
subset files or provide no TrueType source must be supplied as a local TTF/OTF.
The catalog is Google’s public website metadata endpoint; a format change
produces an error with `--offline` and `--font` available as alternatives.

```sh
# Force raster lettering when redirecting output or demonstrating in CI:
npm run markdown-font -- examples/markdown-font/sample.md --offline --raster --width=80

# Plain text for pipelines:
npm run --silent markdown-font -- document.md | less
```

Width defaults to the terminal width, capped at 100; `--width=N` accepts 1–240.
Documents are limited to 1 MiB and local fonts to 8 MiB. Accessible mode always uses text headings.
Terminals narrower than 20 columns, headings longer than 256 UTF-16 code units,
and headings containing characters missing from the chosen font use text headings.
Piped output uses text headings and skips font downloads and selection, unless
`--raster` is supplied. Non-interactive raster output defaults to bundled Space Grotesk.
The demo inherits Bijou’s Markdown syntax support: ATX headings and triple-backtick
code fences; it does not add CommonMark parsing, shaping, bidi, or kerning.
Variable fonts use their default outlines. Color and bitmap fonts are unsupported.
