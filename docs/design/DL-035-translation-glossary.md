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

Counts from `examples/docs/content/i18n/<locale>/` and the DOGFOOD catalog:

- "Block" occurs about 167 times per language in articles; the fr and es
  UI uses "Blocs" and "Bloques" in four catalog rows each.
- Graceful lowering: fr dégradation (9) and abaissement (5); es reducción
  (7) and degradación (6); de Herabstufen (8) and Absenken (5).
- fr story lists use both "Récits" (14) and "Stories" (42).
- Address form is already vous (fr), tú (es), and du (de) in nearly every
  string.

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
