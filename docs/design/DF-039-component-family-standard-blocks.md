---
title: DF-039 Component-family standard Blocks
legend: DF
lane: design
priority: medium
keywords:
  - blocks
  - component-audit
  - design-thinking
  - dogfood
  - lowerings
---

# DF-039 Component-family standard Blocks

## Framing

The v6 block catalog shipped the structural floor, then the status and
feedback slice. The next DOGFOOD six-pack turns the first component-family
audits from prose-only review items into standard Blocks with typed metadata,
schema-bound input, command intents, stories, real render output, and
mode-lowering facts.

This cycle closes issues #226 through #231:

| Issue | Block | Family |
| :--- | :--- | :--- |
| [#226](https://github.com/flyingrobots/bijou/issues/226) | `FramedGroupBlock` | grouping |
| [#227](https://github.com/flyingrobots/bijou/issues/227) | `ExplainabilityWalkthroughBlock` | explainability |
| [#228](https://github.com/flyingrobots/bijou/issues/228) | `FormattedDocumentBlock` | document |
| [#229](https://github.com/flyingrobots/bijou/issues/229) | `LinkDestinationBlock` | navigation |
| [#230](https://github.com/flyingrobots/bijou/issues/230) | `DividerBlock` | structure |
| [#231](https://github.com/flyingrobots/bijou/issues/231) | `TextEntryBlock` | input |

The work follows a Design Thinking loop:

- observe the real DOGFOOD surface families instead of trusting isolated
  fixtures
- frame each family as a reusable Block contract with explicit data and facts
- prototype the TUI and lower-mode shapes as ASCII mockups before treating the
  implementation as landed
- test the contract through catalog, schema, render, and lowering proof

## Sponsored Users

- TUI authors who need reusable semantics for groups, explanations, prose,
  links, separators, and text inputs.
- DOGFOOD maintainers who need the Blocks preview page to show real component
  families, not empty future-audit slots.
- Tooling authors who inspect block metadata, schemas, commands, and stories
  without mounting a terminal app.
- Future declarative IR authors who need typed runtime targets for YAML or JSON
  block declarations.

## Hills

1. A builder can import any Block in the six-pack and inspect metadata, data
   requirements, command intents, and ready story ids from the public barrel.
2. A reader can compare interactive/static output with pipe/accessibility
   lowerings and recover the same product meaning without parsing box drawing.
3. A maintainer can run one DF-039 cycle test that proves the six-pack is
   catalogued, schema-bound, rendered, documented, and lowering-stable.

## Playback Questions

- Does each family now have a named Block contract instead of a broad audit
  note?
- Are the required and optional fields small enough to be reusable but concrete
  enough to render?
- Do lower modes expose stable facts for block identity, family, variant, mode,
  selected value, and semantic values?
- Does the DOGFOOD Blocks page have example slots for every new definition?
- Does this leave room for future YAML/JSON IR without inventing a second
  runtime contract?

## Block Contracts

| Block | Required data | Optional data | Scale |
| :--- | :--- | :--- | :--- |
| `FramedGroupBlock` | `title`, `items` | `selected`, `mode` | section |
| `ExplainabilityWalkthroughBlock` | `title`, `steps` | `evidence`, `decision`, `nextStep` | section |
| `FormattedDocumentBlock` | `heading`, `body` | `callout`, `code` | section |
| `LinkDestinationBlock` | `label`, `destination` | `kind`, `status` | inline |
| `DividerBlock` | `label` | `style`, `density` | inline |
| `TextEntryBlock` | `field`, `value` | `placeholder`, `validation`, `results` | control |

Each Block gets the same first-party command contract:

```text
<blockPrefix>.select
<blockPrefix>.copyFacts
<blockPrefix>.openStory
```

## TUI Mockups

Framed grouping:

```text
+-- FramedGroupBlock --------------------------------+
| Title                                              |
|   Release Checks                                   |
| Items                                              |
|   tests green; docs updated; PR linked             |
| Selected                                           |
|   tests green                                      |
| Mode                                               |
|   review                                           |
+----------------------------------------------------+
```

Explainability walkthrough:

```text
+-- ExplainabilityWalkthroughBlock ------------------+
| Title                                              |
|   Why this changed                                 |
| Steps                                              |
|   input changed; constraint tightened;             |
|   preview re-rendered                              |
| Evidence                                           |
|   DF-040 playback                                  |
| Decision                                           |
|   keep grouped proof visible                       |
| Next step                                          |
|   open lower-mode output                           |
+----------------------------------------------------+
```

Formatted document:

```text
+-- FormattedDocumentBlock --------------------------+
| Heading                                            |
|   Blocks document                                  |
| Body                                               |
|   Use prose for persistent product truth.          |
| Callout                                            |
|   Lower modes keep heading and body facts.         |
| Code                                               |
|   block: FormattedDocumentBlock                    |
+----------------------------------------------------+
```

Linked destination:

```text
+-- LinkDestinationBlock ----------------------------+
| Label                                              |
|   DOGFOOD.md                                       |
| Destination                                        |
|   docs/DOGFOOD.md                                  |
| Kind                                               |
|   docs                                             |
| Status                                             |
|   available                                        |
+----------------------------------------------------+
```

Divider:

```text
+-- DividerBlock ------------------------------------+
| Label                                              |
|   Release Evidence                                 |
| Style                                              |
|   rule                                             |
| Density                                            |
|   compact                                          |
+----------------------------------------------------+
```

Text entry:

```text
+-- TextEntryBlock ----------------------------------+
| Field                                              |
|   Search docs                                      |
| Value                                              |
|   table                                            |
| Placeholder                                        |
|   type a query                                     |
| Validation                                         |
|   4 results                                        |
| Results                                            |
|   4                                                |
+----------------------------------------------------+
```

## Lower Modes

Static mode keeps the same surface structure as interactive mode and stays
render-only.

Pipe mode lowers every Block to a compact record:

```text
FramedGroupBlock
title: Release Checks
items: tests green; docs updated; PR linked
selected: tests green
mode: review
```

Accessible mode lowers every Block to label-first prose:

```text
FramedGroupBlock
Title: Release Checks
Items: tests green; docs updated; PR linked
Selected: tests green
Mode: review
```

Every lower mode carries inspectable facts:

```text
block = FramedGroupBlock
block.rendered = true
block.family = grouping
block.variant = ready
block.mode = pipe
block.selected = tests green
semanticValue.title = Release Checks
```

## Accessibility And Directionality

The first slice does not add bespoke focus behavior. The Blocks expose semantic
labels and section values so accessible output can preserve meaning when
visual grouping, rules, and input chrome are removed. Text is stored as plain
strings or string arrays, leaving locale, bidirectional rendering, and
translation concerns to callers and localization adapters.

## Agent Inspectability

Agents and tests should inspect metadata, data contracts, schema descriptions,
command intent ids, ready story ids, and lowering facts. They should not scrape
terminal boxes or infer meaning from row positions.

## Declarative IR Note

The old Bijou IR idea still fits as a declaration format over this typed API.
This cycle does not introduce a new YAML or JSON runtime, but it gives future
IR work concrete targets:

```yaml
block: FramedGroupBlock
package: "@flyingrobots/bijou"
story: framed-group.ready
data:
  title: Release Checks
  items:
    - tests green
    - docs updated
    - PR linked
  selected: tests green
  mode: review
commands:
  - framedGroup.select
  - framedGroup.copyFacts
  - framedGroup.openStory
facts:
  block.family: grouping
  block.variant: ready
  semanticValue.title: Release Checks
```

## Tests

- `tests/cycles/DF-039/dogfood-component-family-six-pack.test.ts` proves all
  six Blocks publish through the standard catalog and package manifest.
- The cycle test validates metadata, command intent shape, schema binding,
  accessor rejection, visual rendering, lower-mode rendering, semantic facts,
  and Method documentation.
- DX-031 catalog tests prove the public barrel, first-party manifest, story
  ids, and rendered lowering checks include the expanded standard block set.

## Closeout

The six-pack is landed when:

- `@flyingrobots/bijou` exports all six Block definitions, schema adapters, and
  schema-bound block definitions
- DOGFOOD Blocks preview has concrete sample slots for all six names
- `standardBlocks`, `standardBlockStories`, and
  `standardBlockPackageManifest` include the six names
- CHANGELOG, BEARING, and ROADMAP record the v7 component-family slice
- PR text closes #226, #227, #228, #229, #230, and #231
