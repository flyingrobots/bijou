# Spanish translation glossary

This glossary fixes one Spanish rendering for each Bijou term in
[the design vocabulary](./design-vocabulary.md). Use it in DOGFOOD's `es`
catalog column (`examples/docs/i18n/source/dogfood-strings.csv`), in
`examples/docs/content/i18n/es/`, in `README.es.md` files, and in book
translations. The decision and the rejected alternatives are in
[DL-035](../design/DL-035-translation-glossary.md). A native-speaker review
(flyingrobots/bijou#595) may amend a rendering; change it here first, then
apply it.

## Terms

| English term | Spanish rendering | Gender and plural | Reason |
| --- | --- | --- | --- |
| Component | componente | el componente, los componentes | An ordinary noun; Spanish technical prose uses it. |
| Block | Block (kept) | el Block, los Blocks | A product term and a versioned contract (`bijou-block/1`). "bloque" collides with "bloque de código". Replace "Bloques" in the UI. |
| Surface | Surface (kept, capital S) | la Surface, las Surfaces | A product term for structured terminal-cell output (`PackedSurface`). Replace "Superficie". Lowercase "surface" in the English sense of "an interface" becomes "interfaz". |
| family | familia | la familia | Ordinary noun with the same meaning. |
| variant | variante | la variante | Ordinary noun with the same meaning. |
| section | sección | la sección | Ordinary noun; a Components Library grouping. |
| output mode | modo de salida | el modo de salida | Descriptive phrase; the mode names stay English. |
| graceful lowering | reducción controlada | la reducción controlada | "Lowering" keeps meaning; it is not a failure. "degradación" says the opposite. "controlada" matches the French and German renderings. |
| lowering, to lower | reducción, reducir | | Same root as the term above. |
| command and effect | comando y efecto | el comando, el efecto | Ordinary nouns; code names (`Cmd`) stay as they are. |
| core and TUI | core, TUI (kept) | el core, la TUI | They name packages (`@flyingrobots/bijou`, `@flyingrobots/bijou-tui`). |
| versioned artifact | artefacto versionado | el artefacto versionado | Descriptive phrase; the identifier (`ui-scene-ir/1`) stays. |
| Stories | Stories (kept) | las Stories | DOGFOOD's area name and story IDs are code. |
| Guides | Guías | las guías | Ordinary noun; write it with the accent. |

Component family field labels in translated articles: Familia, Variantes,
Cuándo usarla, Cuándo evitarla, Guía de contenido, Propiedad,
Reducción controlada, Familias relacionadas. English source files keep the
English labels, because the design-system preflight reads them.

## Keep English

- Product terms in the table marked "kept": Block, Surface, Stories, core, TUI.
- Code identifiers, function names, package names, command lines, paths,
  catalog keys, story IDs, and `{placeholder}` names.
- Output mode names, always in code font: `interactive`, `static`, `pipe`,
  `accessible`. Write "el modo `pipe`", never "el modo tubería".
- Product names: Bijou, DOGFOOD.

## Address form

Use **tú** for every instruction, label, and article. It matches the
design vocabulary's direct, teammate voice, and current Spanish developer
documentation uses it. Never mix "usted" forms into a page. Action labels
use the infinitive (**Abrir ajustes**); procedure steps use the "tú"
imperative (**Abre los ajustes**).

## Typography

- Open questions and exclamations with `¿` and `¡`.
- Quotation marks: « » first level, “ ” inside them, as the Real Academia
  Española recommends.
- Headings and labels use sentence case.
- Keep every accent, including on capitals (Índice, Guías).
- Never apply Spanish punctuation or quotation marks inside code spans, code
  fences, placeholders, or keyboard keys.
