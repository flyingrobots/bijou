# The Bijou Book and Design Archive

[The teaching book](./bijou-book.pdf) · [Design Archive](./bijou-archive.pdf) · [Complete edition](./bijou-designs.pdf)

The publication has three PDFs assembled from one modular LaTeX source tree.
The teaching book is the main reading path. The archive preserves the project's
working history. The complete edition combines the teaching book with historical
appendices and keeps the existing filename used by repository links.

This build produces:

- Teaching: 106 physical pages, 14,793,930 bytes.
- Archive: 1,872 physical pages, 20,333,134 bytes.
- Complete: 1,933 physical pages, 22,710,082 bytes.

## Learn through one application

The main text contains fourteen chapters, including seven runnable workshops,
organized into five Parts with introductions and explicit learning outcomes:

1. **Why Bijou** — useful meaning, framework fit, tradeoffs and version boundaries.
2. **Build the job monitor** — the model, four environments and a complete keypress trace.
3. **Understand the machinery** — App/model/effect boundaries, late results, layout and styling.
4. **Make it dependable** — hostile terminal conditions, evidence and symptom-led troubleshooting.
5. **Ship and maintain it** — reproducibility, packaging, a concrete regression repair and upgrades.

A component atlas, renderer gallery, glossary, practical topic finder, explained
exercise answers and unfamiliar-reader protocol follow the main text. The atlas, gallery and glossary also appear in the archive; the practical topic finder belongs to the teaching text. The
teaching book has no archived source chapters; historical guides and principles
are kept with the other 426 records rather than mixed into the instructional route.

The public companion is [flyingrobots/bijou-job-monitor](https://github.com/flyingrobots/bijou-job-monitor),
pinned to published **Bijou 7.2.0**, commit
**1c5c47ce0eeeb7342fb7e95e6424a2256c1288a1**, tagged `book-v2`.
Five independent source stages now build the application incrementally, with actual
adjacent diffs and acceptance criteria. The original checkpoint commands remain
inspections of the completed modules. `companion.json` records the prior local evidence and
successful GitHub Actions runs at that exact commit. No new companion release is
implied by this editorial restructuring.

## Read the historical appendices as history

All **426 archived source record bodies are byte-identical to the preceding
illustrated edition**. Their original paths, labels, figures and tables remain.
Each record now carries a visible historical notice: original claims and status
are retained, and implementation status has not been reassessed for this edition.
We do not invent an implemented/superseded classification without code evidence.

The standalone archive and complete edition identify them as **R1–R426**. The
inventory's numeric chapter field is the numeric portion of that identity.
`chapter-pages.json` maps original paths to physical pages in the complete edition;
`archive-chapter-pages.json` does the same for the standalone archive. Page numbers
differ; the R identity and original path are stable. `edition-manifest.json` records
all three output hashes, pagination and structural checks.

The records cover philosophy and architecture, practical guides, design proposals,
releases and migration, retrospectives and historical planning, and audits.
Introductions explain their families and the retired design-document vocabulary.
GitHub issues and milestones remain the authority for current scope.

## Preserve the original source and actual artwork

`source-corpus.json` preserves exact original Markdown bytes and SHA-256 values.
The compiled Markdown files remain removed. `scripts/documentation-corpus.ts`
validates hashes, prefers live files and limits archive fallback to known paths.
Use the bounded excerpt command in `docs/README.md` to retrieve source passages.

Typeset archive records already replaced conceptual arrow notation with TikZ
figures and source tables with component renders. This edition does not edit those
bodies again. Earlier byte-equivalence and pagination reports remain in `history/`,
identified with the PDF and source hashes to which they apply.

The existing palette anchored on `#F7685F` and requested font roles are retained:
Jacquard 24 for every heading level, IBM Plex Mono for prose, VT323 for source
listings, and Recursive Mono for terminal specimens and component tables. Original
font licenses and instance parameters accompany the source.

Artwork has explicit version boundaries: **7.2.0** for the teaching companion,
**8.0.0-rc.1** for the component capture checkout, and **7.1.0** for `bijou-fun`.
A picture from a newer capture is not proof that its API exists in 7.2.0. SVGs
project actual Surface cells; compact table PDFs use the same positions, colors
and font outlines, with possible raster antialiasing differences. No component is
redrawn by eye. See the capture manifests and `tools/README.md` for reproduction.

## Source layout and builds

- `bijou-book.tex`: teaching book; `bijou-archive.tex`: historical volume;
  `bijou-designs.tex`: complete edition.
- `preamble.tex`, `frontmatter.tex`, `copyright.tex`, `reproducibility.tex`,
  `preface.tex`, `edition-notes.tex`: shared publication setup and edition-aware front matter.
- `teaching/`: the five-Part route, introductions and seven connecting chapters.
- `workshops/`: seven shared teaching chapters with stable workshop labels.
- `archive/`, `parts/`, `introductions/`, `groups/`: historical assembly and guidance.
- `chapters/`: 426 unchanged typeset source records.
- `reference/`, `appendices/`, `specimens/`: practical reference, provenance and licenses.
- `diagrams/`, `tables/`, `figures/`: actual component artwork and native TikZ figures.
- `companion-snippets/`: exact pinned `job.ts`, `app.ts` and `main.ts` listings,
  with the full companion license and notices.

Compile from this directory with LuaLaTeX and the packages in `preamble.tex`.
DejaVu Sans must be available to luaotfload. Run each entrypoint three times in
one owned `/tmp` output directory to resolve contents and cross-references:

```sh
mkdir -p /tmp/bijou-design-book/teaching/build
for name in bijou-book bijou-archive bijou-designs; do
  for pass in 1 2 3; do
    lualatex --no-shell-escape --interaction=nonstopmode --halt-on-error \
      --output-directory=/tmp/bijou-design-book/teaching/build "$name.tex"
  done
done
```

On this shared workstation reuse `bijou-design-book-worker`, its existing TeX
image and bounded runner. Acquire `host/docker/bijou-design-book-worker/` and
`host/heavy-work` together in `/Users/Shared/git-locks/workstation.git`. Outputs
belong in `/tmp`; the image and repository mount are read-only. The worker uses
2 CPUs, 4 GiB RAM, bounded temporary storage and logs. Record the active guard,
timeout, usage and free space before launch. Do not create another worker to
avoid a reservation or resource limit.

## Licensing and verification

Copyright © 2026 James Ross. Book content is CC BY 4.0 except code and separately
licensed material. Code examples are Apache-2.0. Each PDF places the copyright
page immediately after its title and includes the full Apache license and notices.
The three copied companion files are byte-identical to the pinned source and
retain their copyright statements; companion-snippets includes LICENSE and NOTICE.

`build-report.json`, `editorial-verification.json` and `edition-manifest.json`
record current output verification. Source-corpus checks and archive-body identity
are distinct: the corpus preserves original Markdown; the unchanged TeX records
retain the preceding edition's presentation edits. Historical tracker links and
source-retirement manifests remain intact. The companion's 44 tests and six PTY cases were executed for book-v2 and its hosted CI passed at the pinned commit.
No human screen-reader study or broad terminal-emulator matrix is claimed.

## Progressive edition and human review

The `book-v2` companion is published on `book/progressive-stages`, with the old
`book-v1` tag preserved. All five source stages run without importing the final
application or each other; a clean candidate install was tested with the finished
source hidden. The final stage matches the eight `src/` modules byte for byte.
Actual source diffs span 37, 123, 291 and 89 lines including context.

The answer key explains hints, diagnoses, repairs, tempting failed alternatives
and completion criteria. The user will arrange an unfamiliar reader. That human
walkthrough is prepared and **not conducted**. Its protocol and blank form are
in the companion and book appendix. No participant answers are prefilled. A real
interactive screen-reader workflow remains unimplemented; accessible CLI output
is a static fixture.

`learning-material-manifest.json` identifies the exact companion Markdown sources
typeset into the new appendices. `companion-material/` retains the stage hash
manifest and blank observation form. The source corpus and all 426 historical
TeX record bodies remain unchanged.
