# Bijou Design Book

[Read the PDF](./bijou-designs.pdf) or inspect the [LaTeX source](./bijou-designs.tex).

This edition includes all 196 tracked Markdown documents under `docs/design/`,
all eight Mermaid diagrams converted to native TikZ, and an atlas of 42 actual
DOGFOOD component stories. Historical proposals retain their original status;
GitHub issues and milestones own current release scope.

## Typography and palette

Jacquard 24 is used for the title and section headings. IBM Plex Mono is used
for prose and code; DejaVu Sans supplies technical symbols absent from Plex.
The Google Fonts files and their SIL Open Font Licenses are under `fonts/`.

The palette derives in OKLCH from the requested coral `#F7685F`: white pages,
`#2D2726` body text, `#83312C` headings/links, `#645452` secondary text and
`#FFEDEB` diagram panels. `palette.json` records the derivation and measured
contrast. The coral itself is an accent/field, with dark text; it is not used
for small text on white.

## Actual component artwork

Every SVG in `figures/` projects actual DOGFOOD `Surface` cells from the shipped
`BIJOU_DARK` theme at time zero, the interactive profile and the first story
variant. Cell geometry is fixed at 10 by 20 SVG units. Glyphs are embedded as
font outlines, so viewers cannot silently substitute fonts. Colours, inverse,
dim, bold and strikethrough come from the actual cell data. Vector PDF companions
are generated from the same SVGs for LaTeX. These are cell projections, not
screenshots of a terminal emulator. `component-manifest.json` names the exact
stories, variants, dimensions and hashes.

## Build from the retained LaTeX

Requires LuaLaTeX with fontspec, luaotfload, TikZ, fvextra, titlesec, enumitem,
longtable, xurl and the standard LaTeX packages named in the preamble. Run from
this directory so font and figure paths resolve. DejaVu Sans must also be available
to luaotfload for symbol fallback:

```bash
build_dir="$(mktemp -d)"
lualatex --no-shell-escape --interaction=nonstopmode --halt-on-error --output-directory="$build_dir" bijou-designs.tex
lualatex --no-shell-escape --interaction=nonstopmode --halt-on-error --output-directory="$build_dir" bijou-designs.tex
cp "$build_dir/bijou-designs.pdf" ./bijou-designs.pdf
```

The committed edition was built in isolated temporary storage with LuaHBTeX
1.15.0 / TeX Live 2022, Pandoc 3.12.1 and fontTools 4.67.0. The worker reused an
existing TeX image without installing a global toolchain. Re-running the LaTeX
is sufficient to build the retained edition; regenerating it from changed
Markdown requires rebuilding the recorded chapter/diagram compilation.

## Provenance and tracker reconciliation

`source-manifest.json` gives one SHA-256 per source document and identifies all
Mermaid conversions. The LaTeX includes the complete source inventory.
`backlog-reconciliation.json` records 48 verified source links covering all 44
retired planning files, including five ideas from the aggregate card. Existing
issue status and current acceptance scope were preserved. No duplicate issues
were created. The old MCP overload failure is already closed as GitHub #201,
and its package typecheck passed again during retirement.

`retired-documents.json` identifies the removed obsolete planning documents.
Their original bytes remain available in Git history. Historical links now point
to the pre-retirement commit rather than becoming broken local links.
