---
dogfood:
  localization:
    sourceLocale: en
    locales: [de, es, fr]
    localized:
      de: ./guides-latest-features.de.md
      es: ./guides-latest-features.es.md
      fr: ./guides-latest-features.fr.md
---

# Latest Features

This guide describes the working checkout, whose package version is
{{RELEASE_VERSION}} (release line {{RELEASE_LINE}}). Features under Unreleased
in `docs/CHANGELOG.md` may be available here before a published package contains
them. A running demo is not evidence that the stable release has shipped.

## Raster fonts

`@flyingrobots/bijou-tui` exports `RasterFont`, `RasterFontGlyph`,
`layoutRasterText()`, `rasterizeText()`, and `rasterTextSurface()`.
The core consumes immutable, precompiled glyph coverage and advance metrics;
font-file decoding belongs in an adapter. The Markdown demo uses OpenType.js
for local TTF/OTF files and Google Fonts. DOGFOOD loads small offline atlases.

```typescript
import { RasterFont, RasterFontGlyph, rasterTextSurface } from '@flyingrobots/bijou-tui';

const glyph = new RasterFontGlyph({
  advance: 3, left: 0, top: 0, width: 2, height: 2, columns: 2, rows: 2,
}, new Uint8Array([0b1001]));
const font = new RasterFont({
  family: 'Fixture', lineHeight: 3, glyphs: new Map([['A', glyph]]),
});
const surface = rasterTextSurface('AAA', font, {
  columns: 30, rows: 6, renderer: { kind: 'braille' },
});
```

RGBA output also feeds the Braille, quadrant-block, and custom-character raster
pipeline. Layout handles code points, newlines, and negative bearings; it does
not perform shaping, bidi, or kerning. Missing glyphs require an explicit
fallback. Downsampling now preserves covered atlas texels so thin stems survive;
subpixel strokes may become bolder and subpixel gaps may close.

The API bounds text length, output allocation, glyph work, and surface size.
See **Packages → @flyingrobots/bijou-tui → Raster Fonts** for the complete limits
and coverage format.

## Markdown typography demo

Run from the repository root:

```sh
npm run markdown-font -- examples/markdown-font/sample.md --configure
npm run markdown-font -- document.md --font ./MyFont.otf
npm run markdown-font -- document.md --google-font "Lora"
npm run markdown-font -- document.md --offline --no-animation
npm run markdown-font -- document.md --offline --h1-size 36 --p-size 12
```

The interactive Google Fonts selector searches a downloaded family catalog.
Space Grotesk is bundled for offline use. Google downloads stay in memory for
the run; there is no persistent cache. Each request has a 15-second timeout.
Catalogs and fonts are limited to 8 MiB, CSS to 64 KiB, and documents to 1 MiB.
Families requiring multiple subset files or lacking one TrueType source need
a local TTF/OTF instead. Variable fonts use default outlines; color/bitmap fonts
are unsupported.

Each of `h1`, `h2`, `h3`, `h4`, and `p` accepts `--ELEMENT-font` and
`--ELEMENT-size`. Font values include a Google family, a TTF/OTF path,
`google:FAMILY`, `file:PATH`, `default`, and `terminal`. Sizes are ink heights
from 4 to 256 pixels; Braille uses `ceil(size / 4)` rows. A size-only setting
enables the default font. H1 defaults to 24 pixels; other elements keep normal
terminal text until configured. Lists, tables, quotations, and code remain
ordinary Markdown blocks. Settings affect this run, not the source document.

Colors follow the active theme’s brand gradient at 10 FPS. Arrow keys or the
mouse wheel scroll; Space pauses/resumes; q or Ctrl+C quits. Resize reflows the
document. `--no-animation` prints into scrollback. Unsupported characters,
headings over 256 UTF-16 units, paragraphs over 20,000 units, and very narrow
layouts retain text. Raster output is bounded to 1,048,576 cells per document.
See `examples/markdown-font/README.md` for the full CLI contract.

## Meaning across presentation modes

The font renderer produces artwork; the enclosing component retains the text
and chooses its presentation.

| Presentation | Markdown demo | DOGFOOD title prompt |
| :--- | :--- | :--- |
| Interactive | Font geometry and theme animation | Space Grotesk and theme sweep |
| Static | Frozen raster text | Localized words |
| Pipe / accessible | Text; pipe can explicitly request `--raster` | Localized words |
| Missing glyphs / insufficient space | Text fallback | Text fallback |

`NO_COLOR` suppresses color without changing detected interactivity. The
Markdown demo additionally chooses static output when color is disabled.
It does not reinterpret `NO_COLOR` as a lack of cursor or input capabilities.

## Book themes and the title screen

DOGFOOD defaults to book-matched dark/light themes with coral and warm neutrals.
Other shell themes remain available through settings; Theme Lab and the F10
Theme Inspector expose token choices and diagnostics. These are DOGFOOD themes,
not replacements for the library’s global presets.

Jacquard 12 glyphs roll around the title cylinder above a subdued ASCII-noise
backdrop. The localized “Press [Enter]” prompt uses Space Grotesk at two or
three rows when it fits. Both fonts are licensed and bundled; the prompt uses
a printable-ASCII atlas and falls back for other scripts. Build reproducibility:

```sh
npm run check:dogfood:title
npm run check:dogfood:prompt
```

## Current references and historical records

The teaching book now lives in `flyingrobots/bijou-job-monitor`; its teaching
application is pinned to Bijou 7.2.0. The complete edition and 426 source records
in this repository are preserved historical evidence. Articles read from that
archive are labeled **Historical reference** in DOGFOOD. Their claims retain
their original scope; they are not automatically updated to this checkout.

Use this guide, current package READMEs, runnable examples, and the changelog
for recent behavior. **Current Release Story** follows the running version in
all four supported locales. **Packages → @flyingrobots/bijou-mcp** documents
the MCP adapter, including its structured-output modes and plain-text hyperlink fallback.
GitHub issues and milestones remain the authority for unfinished release work.
