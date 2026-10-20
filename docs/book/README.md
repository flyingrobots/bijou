# Bijou Documentation Book

[Read the PDF](./bijou-designs.pdf) or inspect the [LaTeX source](./bijou-designs.tex).

The 1,771-page edition of 2026-10-20 consolidates 426 source documents: the original 196
`docs/design/` records plus 230 guides, references, strategy notes, invariants,
release documents, audits and historical records. All 32 Mermaid diagrams are
converted to native TikZ. The atlas retains 42 actual DOGFOOD component stories.

The individual compiled Markdown sources have been removed after verified PDF
delivery to Reader. `source-corpus.json` preserves their exact UTF-8 text and
SHA-256 values for DOGFOOD, localization scans and historical contract checks.
`scripts/documentation-corpus.ts` validates these hashes before serving archived
text, prefers live files, and limits archive fallback to known original
repository paths.
Use the bounded excerpt command in `docs/README.md` to read original chapters.

Retained outside the compilation: the live documentation index, changelog,
TypeScript standards, Code Dojo debt ledger, this book's operating notes, and
the framed app tutorial, which remains a separate working document. Package and example
READMEs remain beside their distributable code.

Historical proposals retain their original status; GitHub issues and milestones
own current release scope. `compiled-source-retirement.json` lists all removals.

## Reading the book

Start with the [Preface](./bijou-designs.pdf#page=2). The seven parts are:

1. Philosophy and architecture
2. Using Bijou
3. Design records
4. Releases and migration
5. Retrospectives and historical planning
6. Audits and archive records
7. Rendered components and provenance

Each part opens with an editorial introduction. The design-record introduction
explains sponsorship, hills, playback questions, scope, accessibility,
localization, inspection, proposed tests and closeout evidence. Family dividers
orient readers within the design records. Original chapter bodies remain exact.

## LaTeX source layout

`bijou-designs.tex` is the small book entrypoint. It uses `\input` to assemble:

- `preamble.tex` and `frontmatter.tex` — shared styling, cover and contents;
- `preface.tex` and `edition-notes.tex` — orientation and provenance;
- `parts/` — seven reader-facing part files;
- `introductions/` — one introduction for every part;
- `groups/` — chapter lists and design-family reading guidance;
- `chapters/` — the 426 preserved source chapters;
- `specimens/` — the 42 rendered component-story descriptions;
- `appendices/` — the atlas wrapper and source inventory.

`source-manifest.json` maps original paths to stable `record_label` values,
LaTeX paths, book parts and displayed chapter numbers. Source-file prefixes
retain the earlier record identity; chapter numbers follow this reading order.
Compile the entrypoint from this directory as shown below.

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
is sufficient to build the retained edition. Edit chapter files directly and
keep shared styling in `preamble.tex`; the corpus remains the exact snapshot
of the retired Markdown edition.

The earlier source-split equivalence check is preserved under `history/` with
its original PDF hash. This editorial edition intentionally changes reading
order and pagination. `editorial-verification.json` records preserved source
hashes, chapter destinations, introduced parts and the final PDF hash.

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
