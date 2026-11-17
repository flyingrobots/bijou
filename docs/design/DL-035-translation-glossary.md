---
title: DL-035 Translation Glossary for French, Spanish, and German
lane: localization
priority: medium
github_issue: 588
status: decided
keywords:
  - localization
  - glossary
  - dogfood
  - design-vocabulary
---

# Translation Glossary for French, Spanish, and German

## Linked Work

- Decision issue: flyingrobots/bijou#588 (parent flyingrobots/bijou#584)
- Applied by: flyingrobots/bijou#590 (fr), #592 (es), #593 (de); book
  translations #620, #621, #625
- Canonical English terms: [design vocabulary](../topics/design-vocabulary.md)
- Glossaries: [French](../topics/glossary.fr.md),
  [Spanish](../topics/glossary.es.md), [German](../topics/glossary.de.md)

## Sponsors

- **Human:** James Ross — delegated the decision to the agent.
- **Agent:** Claude — decided from the DOGFOOD catalogs and translated
  articles on `main` after PR #579.

## Decision Summary

Bijou uses a mixed glossary: each term takes the rendering that fits it,
recorded in one table per language.

- **Product terms stay English**: Block, Surface, Stories, core, TUI. They
  name contracts, packages, or DOGFOOD areas that also appear as code.
- **Ordinary nouns translate**: Component, family, variant, section, output
  mode, command and effect, versioned artifact.
- **Output mode names stay English in code font**: `interactive`, `static`,
  `pipe`, `accessible`.
- **Graceful lowering** becomes abaissement maîtrisé (fr), reducción
  controlada (es), kontrolliertes Absenken (de).
- **Address form**: vous (fr), tú (es), du (de).
- Each language has its own file, `docs/topics/glossary.<locale>.md`.

## Pre-Change Baseline

Examples checked at Bijou commit `36a77614`, before glossary application:

- `examples/docs/i18n/source/dogfood-strings.csv` uses "Blocs" and
  "Bloques" in translated navigation labels, while the translated
  `blocks-preview.md` articles use "Block".
- Articles under `examples/docs/content/i18n/<locale>/` contain competing
  lowering terms: fr dégradation and abaissement; es reducción and
  degradación; de Herabstufen and Absenken. Search these literal terms in
  the corresponding locale directory to inspect their contexts.
- French `blocks-preview-linkdestinationblock.md` uses "Récits", while
  `blocks-preview-densecomparisonblock.md` uses "Stories".

These examples establish inconsistent terminology, not a complete count of
translation debt. The address forms below are editorial choices; a
native-speaker review remains outstanding.

## Directions Considered

1. **Keep every Bijou term in English.** Matches identifiers, but makes
   ordinary prose read as foreign. Rejected: family, variant, and section have exact
   native equivalents with no code counterpart.
2. **Translate every term.** Natural prose, but "Blocs" and "Bloques"
   collide with "code block" and lose the link to `bijou-block/1`, and
   "Superficie" and "Oberfläche" already mean "an interface" in general
   prose. Rejected: a reader cannot map the translated word to the API.
3. **Mixed per term (chosen).** Keeps product terms recognizable and lets
   ordinary nouns read naturally. The cost is a table per language, which
   the apply tasks need anyway.

Per-term choices that lost:

- **dégradation, degradación, Herabstufen** for graceful lowering. Each
  says the output gets worse or loses rank. Bijou's claim is the opposite:
  meaning is preserved. The chosen words keep the "lower" metaphor, and the
  shared "controlled" qualifier keeps the three languages parallel.
- **réduction** (fr). Suggests removing content, not changing the mode.
- **Récits** for Stories. Story IDs and the DOGFOOD area are code; a
  translated label breaks the match between the label and the ID beside it.
- **Blöcke** (de plural). Hides the product term; "Blocks" is kept.
- **usted** (es) and **Sie** (de). Formal address conflicts with the
  design vocabulary's direct teammate voice and with the current catalogs.
- **tu** (fr). Overfamiliar in French technical documentation.

Layout choices that lost:

- **One shared `translation-glossary.md` with a table per language.**
  Rejected: each apply task and native-speaker review owns one language, and
  #588's definition of done asks for a file per language. Shared rules are
  short enough to repeat.

## Typography

- French: no-break space (U+00A0) before `:` `;` `!` `?` `%` and inside
  « ». U+202F is rejected because some terminal fonts lack it.
- Spanish: `¿ ¡` openers; « » then “ ”.
- German: „ “ then ‚ ‘; hyphenated compounds with kept terms (Block-Vorschau).
- No locale typography inside code spans, fences, placeholders, or keys.

## Reversibility

Reversible. A native-speaker review (#594, #595, #596) may amend a
rendering; the glossary file changes first, then the apply task reruns.

## Playback Questions

- Can a reader map every translated term to the API name it describes?
- Does a search for each rejected rendering return nothing after the apply
  tasks merge?
