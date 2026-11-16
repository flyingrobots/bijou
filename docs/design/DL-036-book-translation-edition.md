---
title: DL-036 Book Translation Edition and Source Location
lane: roadmap
priority: medium
github_issue: 616
status: decided
keywords:
  - book
  - localization
  - translation
  - latex
  - provenance
---

# Book Translation Edition and Source Location

## Linked Work

- Decision: [#616](https://github.com/flyingrobots/bijou/issues/616)
- Parent container: [#580](https://github.com/flyingrobots/bijou/issues/580)
- Locale PDF build: [#618](https://github.com/flyingrobots/bijou/issues/618)
- Translations: [#620](https://github.com/flyingrobots/bijou/issues/620) (fr),
  [#621](https://github.com/flyingrobots/bijou/issues/621) (es),
  [#625](https://github.com/flyingrobots/bijou/issues/625) (de)
- Native reviews: [#629](https://github.com/flyingrobots/bijou/issues/629),
  [#632](https://github.com/flyingrobots/bijou/issues/632),
  [#634](https://github.com/flyingrobots/bijou/issues/634)
- Glossary prerequisite: [#588](https://github.com/flyingrobots/bijou/issues/588)

## Sponsors

- **Human:** James Ross. Delegated the decision: "choose as if it were your
  repository."
- **Agent:** Claude. Measured each edition and chose the edition and layout.

## Decision Summary

Translate the **teaching book** first. It is the live edition that readers use
to learn Bijou, and it is the only edition small enough to translate and review
per language at the planned size. The complete edition and the archive stay
English only.

Translated sources live in the companion repository
`flyingrobots/bijou-job-monitor`, next to the English sources, under
`book/locales/<locale>/`. Each locale directory mirrors the English path of each
file that it translates. A per-locale manifest pins the English hash that each
translation was made from. The English files, `book/publication.json`'s
`teaching_pdf` entry, and every Bijou-repository pin
(`docs/book/source-manifest.json`, `source-corpus.json`,
`archive-record-hashes.json`) do not change.

The measured size is about 13,600 translatable words per language. That is
more than 8 hours of work for one task, so #620, #621 and #625 each split into
two tasks (see [Task Splits](#task-splits)).

## Measured Sizes

The teaching estimate is 13,634 lexical tokens, rounded to about 13,600 for
planning. The reproducible recipe below reads companion commit
`209732eeb17315892df25f4546ccb40d92bd3240`; it does not use a moving branch.
The `book-v2` tag identifies the companion application, not the book sources.
Page counts are recorded publication metadata: 106 in that commit's
`book/publication.json` and 1,933 in Bijou commit `36a77614`'s
`docs/book/build-report.json`. No PDF was rebuilt for this decision.

This is a bounded source inventory and a lexical planning estimate, not an
exact count of translatable prose. The recipe strips comments, listings,
TikZ blocks, selected path/reference arguments and macro names. It retains
ordinary macro arguments, which can include non-prose, and omits TikZ node
labels. Those limitations make the final translation workload uncertain.
No reproducible word measurement is retained for the complete edition or
archive; their recorded page/record sizes suffice to reject them here.

| Edition | Location | Pages | Estimated lexical tokens |
| --- | --- | ---: | ---: |
| Teaching book | `bijou-job-monitor/book/bijou-book.tex` | 106 | ~13,600 |
| Complete edition | `bijou/docs/book/bijou-designs.tex` | 1,933 | not measured |
| Design Archive | `bijou/docs/book/bijou-archive.tex` | (426 records) | not measured |

Teaching book breakdown:

| Unit | Files | Estimated tokens |
| --- | --- | ---: |
| Part I, Why Bijou | `teaching/introduction-why`, `01-meaning`, `02-fit` | 1,412 |
| Part II, Build the job monitor | `teaching/introduction-build`, `07-build-along`, `workshops/01`–`03` | 2,502 |
| Part III, Understand the machinery | `teaching/introduction-machinery`, `03-boundaries`, `workshops/04-async`, `teaching/04-layout` | 1,900 |
| Part IV, Make it dependable | `teaching/introduction-dependable`, `workshops/05`–`06`, `teaching/05-troubleshooting` | 2,217 |
| Part V, Ship and maintain it | `teaching/introduction-maintain`, `workshops/07-reproduce`, `teaching/06-maintenance` | 1,301 |
| Front matter | `bijou-book`, `preface`, `edition-notes`, `reproducibility`, `copyright`, `frontmatter` | 1,417 |
| Reference | `reference/contents`, `glossary`, `topic-finder`, `provenance` | 1,050 |
| Appendices | `appendices/exercise-answers`, `reader-walkthrough`, `renderer-gallery`, `component-atlas`, `licenses` | 1,835 |
| **Total** | | **~13,600** |

Estimate per language: an agent draft with glossary conformance runs at about
2,000 words an hour, so drafting takes about 7 hours. Checks that code,
identifiers and record IDs are byte-identical, a fix-up pass, and the locale
PDF build add about 2 hours. The total is about 9 hours, more than the 8-hour
budget. These rates are planning assumptions, not measured agent or reviewer throughput.
Re-estimate after the first translated part.

## Location and Layout

```text
bijou-job-monitor/book/
  bijou-book.tex                 English entry point (unchanged)
  teaching/ workshops/ ...       English sources (unchanged)
  publication.json               gains a "translations" map; teaching_pdf unchanged
  locales/
    fr/
      manifest.json              per-file English and translation hashes
      bijou-book.tex             locale entry point (title macros, babel language)
      preface.tex
      teaching/01-meaning.tex    same relative path as the English file
      workshops/01-model.tex
      reference/glossary.tex
      ...
    es/ ...
    de/ ...
  bijou-book.fr.pdf              built locale PDF
  bijou-book.es.pdf
  bijou-book.de.pdf
```

- Locale directory names are the BCP 47 tags that DOGFOOD already uses
  (`fr`, `es`, `de`).
- A translated file keeps the English file's relative path and name. Every
  `\label`, `\ref`, figure path and `\input` path stays the same, so
  cross-references work without a mapping table.
- Figures, captures, fonts, palettes and table artwork are not copied. They
  resolve from the English tree. Captured terminal output stays English: it is
  actual rendered evidence pinned to a release, and recapturing it in a locale
  is a different outcome. A locale may translate captions only.
- `manifest.json` lists each translated file:
  `{ "path", "source_sha256", "sha256", "translator", "reviewed": null }`.
  `source_sha256` is the hash of the English file at the time of translation.

## Planned build contract (#618)

The following behavior is required of #618; it is not implemented by this
decision. The current companion Makefile builds English only.

- `make pdf LOCALE=fr` builds `locales/fr/bijou-book.tex`. It sets
  `TEXINPUTS=locales/fr//:./:` so that a translated file is found before the
  English file of the same path. Figures and shared assets resolve from `./`.
- Before LaTeX runs, a check script reads the English input graph (the files
  in `teaching/contents.tex`, `reference/contents.tex` and the entry point). It
  fails with a clear message that names each missing file if a translatable
  English file has no locale counterpart. It warns on each file whose
  `source_sha256` no longer matches the English file (stale translation). A
  partial locale never builds silently with English chapters mixed in.
- The same check confirms that code listings, inline code and record IDs
  (`R1`–`R426`) are byte-identical to the English file.
- The locale entry point loads `babel` with the locale language, so
  hyphenation and the generated strings ("Contents", "Part", "Appendix") are
  localized. The existing fonts must cover the accented glyphs. The build fails
  on missing-glyph warnings.
- The output is `bijou-book.<locale>.pdf`. The build adds an entry to
  `publication.json` under `translations.<locale>`: path, pages, bytes,
  sha256, date, source commit, the manifest hash, and `native_review` (null
  until #629/#632/#634 record reviewer, date and scope).
- An English build (`make pdf` with no `LOCALE`) runs the same commands as
  now and produces a byte-equivalent `teaching_pdf` entry.

## Hash Pins and Evidence

- English pins do not change. The Bijou repository's book manifests describe
  the complete edition and the archive, which this decision does not
  translate. No file under `bijou/docs/book/` changes, so
  `npm run docs:design-system:preflight` is unaffected.
- Translations get their own pins: `locales/<locale>/manifest.json` (per file)
  and `publication.json` `translations.<locale>` (per PDF). A translation pin
  never replaces or edits an English pin.
- Staleness is visible: when the English teaching book changes, the
  `source_sha256` mismatch shows which translated files need an update.
- Native review evidence is recorded as `native_review` on the locale
  publication entry. A machine-drafted locale PDF says "draft translation" on
  its copyright page until that field is filled.

## Task Splits

#620, #621 and #625 are over the 8-hour budget. Split each one into two tasks
of about 4.5 hours. Each split ends on a Part boundary, and both halves must
land before the locale PDF builds, because the build refuses partial locales.

| Proposed task | Content | Words | Hours |
| --- | --- | ---: | ---: |
| `<lang>` A: front matter and Parts I–III | preface, edition notes, reproducibility, copyright, frontmatter, locale entry point; Parts I, II, III | ~7,230 | 4.5 |
| `<lang>` B: Parts IV–V, reference and appendices, and PDF | Parts IV, V; reference; appendices; manifest; build and record the locale PDF | ~6,400 | 4.5 |

That gives six tasks in place of three:

- #620 French: fr-A (blocked by #616, #618, #588) and fr-B (blocked by fr-A).
- #621 Spanish: es-A and es-B, the same shape.
- #625 German: de-A and de-B, the same shape. Translated text can expand,
  so check the layout for overfull lines in tables and TikZ nodes.

The native reviews (#629, #632, #634, 4 hours each) review about 13,600 words,
about 3,400 words an hour. This is a provisional review budget, not verified
reviewer capacity. Re-estimate with the native reviewer before starting;
the reviews remain blocked by the locale's B task.

The Bijou repository issues remain the tracker. The source changes for #618
and the translations land as pull requests in `bijou-job-monitor`, linked from
the Bijou issues.

## Alternatives Considered

### Complete edition first, sources in `bijou/docs/book/locales/`

Rejected. The complete edition is frozen, so it is the wrong text to put work
into: readers learn from the teaching book. Its recorded 1,933 pages are about
18 times the teaching book's 106 pages; page count alone does not determine
translation hours. The frozen edition is also the subject of the Bijou hash pins and
the preservation evidence (`complete_pages_with_changed_text: []`). A
translation tree next to it adds risk to those checks.

### Archive first

Rejected. The archive preserves 426 historical design records.
Its value is that the text is exactly preserved. DOGFOOD reads it from
`source-corpus.json`. A translated record is no longer the record, and the
readers who use the archive are maintainers, who read English.

### Teaching book, sources in the Bijou repository (`bijou/docs/book/translations/`)

Rejected. The teaching book's English LaTeX, figures, fonts and Makefile moved
to `bijou-job-monitor` (`docs/book/teaching-migration.json`). A translation
tree in Bijou would build against sources in another repository. Each English
edit would then need a pinned cross-repository checkout to detect stale
translations, and the build would have to fetch the companion repository.
Keeping the translations next to the English sources makes the staleness check
a local hash comparison.

### Teaching book, one directory per locale with a full copy of the book

Rejected. A full copy (`book-fr/`) duplicates figures, fonts and captures. Each
English asset update would then need four updates. The overlay keeps one copy
of the assets and fails only on missing translated text.

## Consequences

- #618 is to be implemented in `bijou-job-monitor`. Its acceptance check
  "`npm run docs:design-system:preflight` passes" is still true in Bijou,
  because Bijou's book files do not change.
- Moving the translations later costs a path migration of
  `book/locales/` and the `publication.json` entries. That is the reversible
  part of this decision.
- If the complete edition or the archive is ever translated, that is a new
  decision with its own size measurement. This record does not authorize it.

## Reproduce the teaching estimate

Run in a `bijou-job-monitor` checkout containing the pinned commit, with Node
22.23.3. The command reads Git objects only and writes no repository files.

```sh
node --input-type=module <<'NODE'
import { execFileSync } from 'node:child_process';
const revision = '209732eeb17315892df25f4546ccb40d92bd3240';
const read = (path) => execFileSync('git', ['show', `${revision}:book/${path}.tex`], { encoding: 'utf8' });
const inputs = (text) => [...text.matchAll(/\\input\{([^}]+)\}/g)].map((match) => match[1]);
const count = (path) => {
  const prose = read(path)
    .replace(/(?<!\\)%[^\n]*/g, '')
    .replace(/\\begin\{(lstlisting|verbatim|tikzpicture)\}[\s\S]*?\\end\{\1\}/g, '')
    .replace(/\\(?:input|includegraphics|label|ref|pageref|url|lstinputlisting)(?:\[[^\]]*\])?\{[^}]*\}/g, '')
    .replace(/\\[a-zA-Z@]+\*?(?:\[[^\]]*\])?/g, ' ');
  return (prose.match(/[A-Za-z]+(?:['’][A-Za-z]+)*/g) ?? []).length;
};
const groups = read('teaching/contents').split(/\\part\{[^}]+\}/).slice(1).map(inputs);
groups.push(['bijou-book', 'preface', 'edition-notes', 'reproducibility', 'copyright', 'frontmatter']);
groups.push(['reference/contents', 'reference/glossary', 'reference/topic-finder', 'reference/provenance']);
groups.push(['appendices/exercise-answers', 'appendices/reader-walkthrough', 'appendices/renderer-gallery', 'appendices/component-atlas', 'appendices/licenses']);
const labels = ['I', 'II', 'III', 'IV', 'V', 'Front', 'Reference', 'Appendices'];
const totals = groups.map((files, i) => {
  const words = files.reduce((sum, file) => sum + count(file), 0);
  console.log(`${labels[i]}: ${words}`);
  return words;
});
console.log(`Total: ${totals.reduce((a, b) => a + b, 0)}`);
console.log(`A: ${totals[0] + totals[1] + totals[2] + totals[5]}`);
console.log(`B: ${totals[3] + totals[4] + totals[6] + totals[7]}`);
NODE
```

Recorded output: Parts I–V `1412, 2502, 1900, 2217, 1301`; front matter
`1417`; reference `1050`; appendices `1835`; total `13634`; split A `7231`;
split B `6403`. Rounded task estimates remain about 4.5 hours per half.
