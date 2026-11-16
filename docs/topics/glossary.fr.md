# French translation glossary

This glossary fixes one French rendering for each Bijou term in
[the design vocabulary](./design-vocabulary.md). Use it in DOGFOOD's `fr`
catalog column (`examples/docs/i18n/source/dogfood-strings.csv`), in
`examples/docs/content/i18n/fr/`, in `README.fr.md` files, and in book
translations. The decision and the rejected alternatives are in
[DL-035](../design/DL-035-translation-glossary.md). A native-speaker review
(flyingrobots/bijou#594) may amend a rendering; change it here first, then
apply it.

## Terms

| English term | French rendering | Gender and plural | Reason |
| --- | --- | --- | --- |
| Component | composant | le composant, les composants | An ordinary noun; French technical prose uses it. |
| Block | Block (kept) | le Block, les Blocks | A product term and a versioned contract (`bijou-block/1`). "bloc" collides with "bloc de code" and "bloc de texte". |
| Surface | Surface (kept, capital S) | la Surface, les Surfaces | A product term for structured terminal-cell output (`PackedSurface`). Lowercase "surface" in the English sense of "an interface" becomes "interface". |
| family | famille | la famille | Ordinary noun with the same meaning. |
| variant | variante | la variante | Ordinary noun with the same meaning. |
| section | section | la section | Same word; a Components Library grouping. |
| output mode | mode de sortie | le mode de sortie | Descriptive phrase; the mode names stay English. |
| graceful lowering | abaissement maîtrisé | l'abaissement maîtrisé | "Lowering" keeps meaning; it is not a failure. "dégradation" says the opposite. |
| lowering, to lower | abaissement, abaisser | | Same root as the term above. |
| command and effect | commande et effet | la commande, l'effet | Ordinary nouns; code names (`Cmd`) stay as they are. |
| core and TUI | core, TUI (kept) | le core, la TUI | They name packages (`@flyingrobots/bijou`, `@flyingrobots/bijou-tui`). |
| versioned artifact | artefact versionné | l'artefact versionné | Descriptive phrase; the identifier (`ui-scene-ir/1`) stays. |
| Stories | Stories (kept) | les Stories | DOGFOOD's area name and story IDs (`framed-group.ready`) are code. Replace "Récits". |
| Guides | Guides | les guides | Same word in French. |

Component family field labels in translated articles: Famille, Variantes,
Quand l'utiliser, Quand l'éviter, Conseils de contenu, Propriété,
Abaissement maîtrisé, Familles associées. English source files keep the
English labels, because the design-system preflight reads them.

## Keep English

- Product terms in the table marked "kept": Block, Surface, Stories, core, TUI.
- Code identifiers, function names, package names, command lines, paths,
  catalog keys, story IDs, and `{placeholder}` names.
- Output mode names, always in code font: `interactive`, `static`, `pipe`,
  `accessible`. Write "le mode `pipe`", never "le mode tube".
- Product names: Bijou, DOGFOOD.

## Address form

Use **vous** for every instruction, label, and article. French technical
documentation uses "vous"; "tu" reads as overfamiliar to a professional
reader. Keep the imperative for action labels: **Ouvrir les réglages** in a
label (infinitive), **Ouvrez les réglages** in a procedure step.

## Typography

- Put a no-break space (U+00A0) before `:` `;` `!` `?` and `%`, and inside
  guillemets: « texte ». Use U+00A0 rather than the narrow U+202F, because
  some terminal fonts do not have U+202F and render it as a missing glyph.
- Quotation marks: « » first level, “ ” inside them.
- Headings and labels use sentence case: « Bonnes pratiques de contenu ».
- Never apply French spacing or quotation marks inside code spans, code
  fences, placeholders, or keyboard keys.
