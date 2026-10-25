# Markdown typography demo

From the repository root:

```sh
npm run markdown-font -- examples/markdown-font/sample.md
npm run markdown-font -- /path/to/document.md

# Edit fonts and sizes for h1, h2, h3, h4, and paragraphs:
npm run markdown-font -- examples/markdown-font/sample.md --configure
```

In an interactive terminal, downloads the Google Fonts family list and opens
Bijou’s searchable selector. Type a family name, use the arrow keys, and press
Enter to choose. **Space Grotesk** appears first. In a color terminal, the
document opens in a scrollable view, with each `# H1` converted to Braille through Bijou’s
`RasterFont` and `rasterTextSurface()` APIs. Longer titles wrap to multiple
raster lines. Body text and other blocks use the existing Markdown renderer.

Font colors animate through the active theme’s brand gradient and back over a
20-second cycle. Animation runs at 10 frames per second and reuses the raster
geometry; ordinary text and code keep their own styling. Use `BIJOU_THEME` to
select one of Bijou’s registered themes.

- **↑/↓**, **j/k**, or mouse wheel: scroll.
- **Page Up/Down**, **Home/End**: move through the document.
- **Space**: pause or resume the colors.
- **q** or **Ctrl+C**: quit and restore the terminal.

Pass `--no-animation` to print into normal terminal scrollback instead. Pipes,
accessible mode, and `NO_COLOR` use static output. Resizing the animated view
reflows the document to the available width, capped by `--width` (100 columns
by default).

Use `--configure` to edit each element, choose a Google Fonts family or local
font file, and enter a size. Choose **Render document** when ready. The Google
Fonts catalog is downloaded once per configuration session. Settings apply to
the current run; they do not change your Markdown file.

For repeatable typography, use element flags:

```sh
npm run markdown-font -- document.md \
  --h1-font "Space Grotesk" --h1-size 36 \
  --h2-font "Lora" --h2-size 24 \
  --h3-font "Space Grotesk" --h3-size 20 \
  --h4-font ./MyFont.otf --h4-size 16 \
  --p-font "Space Grotesk" --p-size 12
```

Each of `h1`, `h2`, `h3`, `h4`, and `p` accepts `--ELEMENT-font` and
`--ELEMENT-size`. Font values can be a Google family name, a `.ttf`/`.otf`
filepath, `file:PATH`, `google:FAMILY`, `default`, or `terminal`.
`default` uses the global `--font`/`--google-font` choice or bundled Space Grotesk.
`terminal` keeps the terminal’s normal fixed-size text. Setting only a size on
an element switches it to the default raster font.

Sizes are requested ink heights in pixels, from 4 to 256. A terminal Braille
cell contains four vertical samples, so the number of output rows is
`ceil(size / 4)`. Text wraps to the document width; a single glyph wider than
the viewport is scaled to fit. H1 defaults to 24 pixels; other elements remain
normal terminal text until configured. Piped and accessible output retain text
unless `--raster` is explicitly supplied; accessible mode always retains text.
Lists, tables, quotations, and code blocks keep the existing Markdown treatment.

The original, unmodified TTF and SIL Open Font License are in
[`assets/fonts/space-grotesk`](../../assets/fonts/space-grotesk/README.md).
The demo uses the existing OpenType.js development dependency to compile only
the glyphs needed by the styled text. Repeated font choices share one loaded
font during a run. No font installation is needed.

```sh
# Provide your own TTF or OTF file:
npm run markdown-font -- document.md --font /path/to/MyFont.otf

# Choose a Google Fonts family directly, bypassing the selector:
npm run markdown-font -- document.md --google-font "Lora"

# Use bundled Space Grotesk without downloading the catalog:
npm run markdown-font -- document.md --offline

# Keep colors static and print into scrollback:
npm run markdown-font -- document.md --offline --no-animation
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
and blocks containing characters missing from the chosen font use normal text.
Paragraphs over 20,000 UTF-16 code units also use normal text. Raster output is
limited to 1,048,576 cells per document; reduce sizes or document length if reached.
Piped output uses text headings and skips font downloads and selection, unless
`--raster` is supplied. Non-interactive raster output defaults to bundled Space Grotesk.
The demo inherits Bijou’s Markdown syntax support: ATX headings and triple-backtick
code fences; it does not add CommonMark parsing, shaping, bidi, or kerning.
Variable fonts use their default outlines. Color and bitmap fonts are unsupported.
