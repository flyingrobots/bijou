# German translation glossary

This glossary fixes one German rendering for each Bijou term in
[the design vocabulary](./design-vocabulary.md). Use it in DOGFOOD's `de`
catalog column (`examples/docs/i18n/source/dogfood-strings.csv`), in
`examples/docs/content/i18n/de/`, in `README.de.md` files, and in book
translations. The decision and the rejected alternatives are in
[DL-035](../design/DL-035-translation-glossary.md). A native-speaker review
(flyingrobots/bijou#596) may amend a rendering; change it here first, then
apply it.

## Terms

| English term | German rendering | Gender and plural | Reason |
| --- | --- | --- | --- |
| Component | Komponente | die Komponente, die Komponenten | An ordinary noun; German technical prose uses it. |
| Block | Block (kept) | der Block, die Blocks | A product term and a versioned contract (`bijou-block/1`). Use the plural "Blocks", not "Blöcke", so the product term stays recognizable. |
| Surface | Surface (kept) | die Surface, die Surfaces | A product term for structured terminal-cell output (`PackedSurface`). "Oberfläche" stays only for the English sense of "an interface" (Terminal-Oberflächen). |
| family | Familie | die Familie | Ordinary noun with the same meaning. |
| variant | Variante | die Variante | Ordinary noun with the same meaning. |
| section | Abschnitt | der Abschnitt | Ordinary noun; a Components Library grouping. |
| output mode | Ausgabemodus | der Ausgabemodus, die Ausgabemodi | Descriptive compound; the mode names stay English. |
| graceful lowering | kontrolliertes Absenken | das kontrollierte Absenken | "Lowering" keeps meaning. "Herabstufen" means a downgrade, a loss of rank. |
| lowering, to lower | Absenken, absenken | | Same root as the term above. |
| command and effect | Befehl und Effekt | der Befehl, der Effekt | Ordinary nouns; code names (`Cmd`) stay as they are. |
| core and TUI | Core, TUI (kept) | der Core, die TUI | They name packages (`@flyingrobots/bijou`, `@flyingrobots/bijou-tui`). |
| versioned artifact | versioniertes Artefakt | das versionierte Artefakt | Descriptive phrase; the identifier (`ui-scene-ir/1`) stays. |
| Stories | Stories (kept) | die Stories | DOGFOOD's area name and story IDs are code. |
| Guides | Guides | die Guides | DOGFOOD's area name; matches the current UI. |

Component family field labels in translated articles: Familie, Varianten,
Wann verwenden, Wann vermeiden, Inhaltliche Hinweise, Zuständigkeit,
Kontrolliertes Absenken, Verwandte Familien. English source files keep the
English labels, because the design-system preflight reads them.

## Keep English

- Product terms in the table marked "kept": Block, Surface, Stories, Core, TUI.
- Code identifiers, function names, package names, command lines, paths,
  catalog keys, story IDs, and `{placeholder}` names.
- Output mode names, always in code font: `interactive`, `static`, `pipe`,
  `accessible`. Write "der Modus `pipe`" or "der `pipe`-Modus".
- Product names: Bijou, DOGFOOD.

## Compounds

Join a kept English term to a German word with a hyphen: Block-Vorschau,
Surface-Vertrag, `pipe`-Modus. A translated term keeps its chosen rendering,
as in Komponenten-Stories. Do not write closed
compounds such as "Blockvorschau", because they hide the product term.

## Address form

Use **du** for every instruction, label, and article, with lowercase "du",
"dein". It matches the design vocabulary's direct, teammate voice and the
current German catalog. Never mix "Sie" forms into a page. Action labels use
the infinitive (**Einstellungen öffnen**); procedure steps use the "du"
imperative (**Öffne die Einstellungen**).

## Typography

- Quotation marks: „ “ first level, ‚ ‘ inside them.
- Capitalize every noun, including kept English nouns (die Surface).
- Headings and labels use sentence case after the first noun rules.
- Never apply German quotation marks inside code spans, code fences,
  placeholders, or keyboard keys.
