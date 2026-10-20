# Bijou Documentation Book

[Read the PDF](./bijou-designs.pdf) or inspect the [LaTeX entrypoint](./bijou-designs.tex).

The 1,860-page edition retains 426 archived source documents: 196 design records and 230 guides, references, strategy notes, invariants, releases, audits and historical records. It adds a general preface, eight part introductions, seven practical job-monitor workshops, a version page, a copyright page, and renderer demonstrations.

The book illustrates 83 source arrow figures and two teaching traces in native TikZ, alongside the original 32 Mermaid-to-TikZ conversions. All 123 tables use the actual Bijou table component, divided into 159 readable panels. There are 42 DOGFOOD specimens, four pinned-release job-monitor mode specimens and two renderer captures from `bijou-fun`.

## Read through one working application

The new teaching part follows one monitor through state, four presentations, keyboard ownership, cancellation, late results, terminal constraints, tests, deliberately broken exercises and source packaging.

The separate public companion is [flyingrobots/bijou-job-monitor](https://github.com/flyingrobots/bijou-job-monitor), pinned to published **Bijou 7.2.0**. This edition uses commit **92864e0f2512f59225b2f1f5b89a0678bd639e62**, tagged `book-v1`. `companion.json` records its local checks and successful GitHub Actions runs. Its 15 tests and PTY checks have explicit limits; no human screen-reader study is claimed.

Start with the [Preface](./bijou-designs.pdf#page=5) and [version page](./bijou-designs.pdf#page=3). The eight parts are:

1. Philosophy and architecture
2. Build a job monitor
3. Using Bijou
4. Design records
5. Releases and migration
6. Retrospectives and historical planning
7. Audits and archive records
8. Rendered components and provenance

The design-record introduction explains sponsorship, hills, playback questions, scope, accessibility, localization, inspection, proposed tests and closeout evidence. Family dividers orient readers within the historical designs. New editorial prose uses subheadings; historical headings retain their source structure.

## Source preservation and presentation

The compiled Markdown originals were removed after verified Reader delivery. `source-corpus.json` preserves their exact UTF-8 bytes and SHA-256 values. `scripts/documentation-corpus.ts` validates those hashes, prefers live files and limits archive fallback to known original paths. Use the bounded excerpt command in `docs/README.md` to retrieve original passages.

Typeset chapters intentionally replace conceptual arrow notation with figures and source tables with component renders. Code samples, type signatures, numeric comparisons and literal serialization examples retain their meaning as source notation. `flow-manifest.json` retains the original diagram text, graph topology and chapter identity. The original Markdown remains authoritative for source-byte preservation; the current TeX chapters are presentation edits.

The live documentation index, changelog, canonical TypeScript standards, Code Dojo ledger and separate framed-app tutorial remain outside the compilation. Historical proposals retain their original status. GitHub issues and milestones own current release scope.

## Modular LaTeX

The small `bijou-designs.tex` entrypoint assembles:

- `preamble.tex`, `frontmatter.tex`, `copyright.tex`, `reproducibility.tex`, `preface.tex`, and `edition-notes.tex`;
- `parts/`, `introductions/`, and `groups/` for reading order;
- `workshops/` for the authored teaching path;
- `chapters/` for 426 archived source records;
- `diagrams/` for native TikZ flows, graphs and traces;
- `tables/` for component-rendered table panels;
- `specimens/` and `appendices/` for the atlas, renderer gallery, source inventory and full Apache license.

`source-manifest.json` maps original paths to stable record labels, TeX files, book parts and displayed chapter numbers. Workshop headings are independently identified as W1–W7; they do not change the archived records' chapter identities.

## Type, color and real component artwork

**Jacquard 24** supplies titles and every heading level, including h3. **IBM Plex Mono** is prose; **VT323** is source listings. **Recursive Mono**, fixed at `MONO=1, CASL=0`, supplies terminal specimens and component tables, with DejaVu Sans for missing symbols. Google Fonts sources, hashes, static-instance axes and original licenses accompany the book under `fonts/` and `font-provenance.json`.

The palette remains anchored on `#F7685F`: white pages, `#2D2726` ink, `#83312C` headings and links, `#645452` secondary text and `#FFEDEB` diagram panels. Component specimens retain their actual application colors.

The SVGs project actual Surface cells with fixed geometry, colors and modifiers, using outlined glyphs. Table PDFs embed reusable font resources from the same cells instead of duplicating every glyph path; PDF and SVG antialiasing can differ while coordinates and font outlines agree. No component is redrawn by eye. These are generated cell projections, not photographs of an emulator.

`component-manifest.json`, `table-manifest.json`, `monitor-manifest.json` and `demo-manifest.json` identify sources, parameters, dimensions and hashes. The book distinguishes the 8.0.0-rc.1 checkout used for current component artwork, the published 7.2.0 teaching API and the separate 7.1.0 renderer demos. Raw cell captures and exact mode outputs are retained. See `tools/README.md` for artwork regeneration.

## Build

Compile from this directory with LuaLaTeX, fontspec, luaotfload, TikZ, fvextra, titlesec, enumitem, xurl and the packages listed in `preamble.tex`. DejaVu Sans must be available to luaotfload. Three serial passes resolve the contents and cross-references:

```sh
lualatex --no-shell-escape --interaction=nonstopmode --halt-on-error --output-directory=/tmp/bijou-design-book/build bijou-designs.tex
```

Repeat that invocation three times in the same owned output directory, then copy the PDF into this directory. The committed edition uses LuaHBTeX 1.15.0 / TeX Live 2022. It reuses `bijou-design-book-worker` and its existing TeX image; it does not install a global toolchain.

On the shared workstation, acquire `host/docker/bijou-design-book-worker/` in `/Users/Shared/git-locks/workstation.git` and use the bounded runner. The worker has a read-only root, 2 CPUs, 4 GiB RAM, bounded temporary storage and logging; monitored outputs stay within the recorded project budget. Build outputs belong in `/tmp`, not the image or repository. The build report records measured usage.

## Licensing, verification and history

Copyright © 2026 James Ross. Except for code and separately licensed material, book content is **CC BY 4.0**. Code examples are **Apache-2.0**. The copyright page appears immediately after the title; the complete Apache license and reproduction notices appear in the final appendix. Any distributed code excerpts include the full license and applicable notices. Font software keeps its original licenses.

`build-report.json` and `editorial-verification.json` record the current PDF, original-corpus checks, destinations and validation boundaries. Earlier pagination and byte-equivalence proofs remain under `history/` with their original PDF hashes. They describe those earlier editions.

`backlog-reconciliation.json` retains 48 verified source links covering all 44 retired planning cards; no duplicate issues were created. `compiled-source-retirement.json` and `retired-documents.json` retain the removal inventory. Historical links target the pre-retirement revision.
