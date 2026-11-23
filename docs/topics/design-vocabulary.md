# Design vocabulary

Bijou's design vocabulary is the set of canonical terms, field names, and writing rules used to describe components, Blocks, output modes, and interface copy. Use it in code comments, documentation, issues, example apps, and on-screen copy, so every surface describes the same thing the same way.

This page collects the vocabulary from four archive records in the Bijou book (`docs/book/bijou-designs.pdf`); record numbers follow the archive's R1–R426 identifiers. Where this page and a record disagree, the record is the source; fix this page.

| Record | Title | What it defines |
| --- | --- | --- |
| R45 | Documentation Standards | Canonical terminology (§7.2), writing style (§7), examples (§5) |
| R52 | Component Families | The component family fields and how to read them |
| R15 | Content Guide | Voice, tone by surface, and writing rules for interface copy |
| R26 | Localization and Bidirectionality | Logical direction and what mirrors in right-to-left layout |

## Core terms

Use one term per concept, and define unfamiliar terms at first use (R45 §7.2).

| Term | Meaning |
| --- | --- |
| Component | Leaf rendering vocabulary, such as `alert()` or `table()`. |
| Block | A unit that owns product semantics, data contracts, and lowering facts. |
| Surface | Structured terminal-cell output. |
| Surface presenter | A host that shows `interactive` frames from Surfaces instead of from terminal bytes (`SurfacePresenter`). |
| Family | One semantic job that one or more components perform, such as "Inline status" (R52). |
| Section | A Components Library grouping of related families for browsing, such as "Status and in-flow feedback". A section is not a family. |
| Variant | A semantic, interaction-layer, or render-path form of a family (R52). |
| Output mode | `interactive`, `static`, `pipe`, or `accessible`. Each mode makes a distinct claim about what the output can do. |
| Graceful lowering | How a component keeps its meaning when it renders in a less capable output mode. |
| Command and effect | A command requests change; an effect interacts with the outside world. |
| Core and TUI | Ownership: `@flyingrobots/bijou` (core) or `@flyingrobots/bijou-tui` (TUI). |
| Versioned artifact | An explicit contract such as `ui-scene-ir/1` or `bijou-block/1`. |

Say "output mode", not "profile", "lowering", or "TUI mode", when you mean `interactive`, `static`, `pipe`, or `accessible`. "Lowering" names the process of rendering for a less capable mode. Introduce it with care in first-use paths (R15).

## Translation glossaries

Each translated locale renders these terms one way, recorded per language: [French](./glossary.fr.md), [Spanish](./glossary.es.md), and [German](./glossary.de.md). Block, Surface, Stories, core, and TUI stay English; output mode names stay English in code font. [DL-035](../design/DL-035-translation-glossary.md) records the decision.

## Component family fields

Document every component family with these fields, in this order (R52). The design-system docs preflight (`npm run docs:design-system:preflight`) checks that each family has all of them.

| Field | What it answers |
| --- | --- |
| Family | Which components perform this job. |
| Variants | Which forms the family takes. |
| Use when | When this family is the honest choice. |
| Avoid when | When another family is more honest, and which one. |
| Content guidance | How to write the copy the family displays. |
| Ownership | Core or TUI. |
| Graceful lowering | What each output mode shows: rich (interactive) and static, pipe, and accessible. |
| Related families | Which families a reader should compare. |

The family reference writes the interactive line of **Graceful lowering** as `rich`, and the preflight requires that word there. Everywhere else, call the mode `interactive`.

Bijou does not document components by comparison to other design systems. Do not add analogue or "closest equivalent" fields.

## Writing style

Write like a competent teammate: direct, precise, and approachable (R45 §7). Bijou copy should sound direct, calm, precise, and unpretentious, and never hyped, mysterious, overly cute, or apologetic (R15).

- Use "you" for actions the reader performs, and the package, command, or component name for actions the system performs.
- Use imperative verbs for procedures and verb-first action labels, such as **Open settings** or **Search components**.
- Use present tense for current behaviour, and active voice when it clarifies responsibility.
- Put the result, decision, warning, or essential condition first. Give each sentence one main job.
- Avoid "we" unless it refers to an explicit project decision or policy.
- Treat hint bars as scarce space: short, truthful, and current.
- Write for localization: no idioms, jokes, or copy that only works at one exact length.
- Write so accessible output makes sense read top to bottom, with no spatial context.
- Label examples as runnable, illustrative, or abridged (R45 §5.1).

## Direction

Think in logical directions, start and end, rather than left and right (R26). Mirror breadcrumb flow, pane sequencing, drawer sides, and directional affordances in right-to-left layout. Do not mirror code, IDs, paths, commands, URLs, or raw tabular data.
