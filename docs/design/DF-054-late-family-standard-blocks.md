---
title: DF-054 Late-family standard Blocks
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

# DF-054 Late-family standard Blocks

## Framing

The first two DOGFOOD component-family six-packs moved grouping, prose, links,
dividers, text entry, choice, decision, navigation, disclosure, and path
progress into typed standard Blocks. This cycle takes the remaining v7
component-family audit queue and turns it into concrete first-party Blocks
with metadata, schema-bound input, command intents, ready stories, rendered
output, and mode-lowering facts.

This cycle closes issues #238 through #243:

| Issue | Block | Family |
| :--- | :--- | :--- |
| [#238](https://github.com/flyingrobots/bijou/issues/238) | `BrandEmphasisBlock` | branding |
| [#239](https://github.com/flyingrobots/bijou/issues/239) | `ModeAwarePrimitiveBlock` | primitive |
| [#240](https://github.com/flyingrobots/bijou/issues/240) | `DenseComparisonBlock` | comparison |
| [#241](https://github.com/flyingrobots/bijou/issues/241) | `HierarchyBlock` | hierarchy |
| [#242](https://github.com/flyingrobots/bijou/issues/242) | `ExplorationListBlock` | list |
| [#243](https://github.com/flyingrobots/bijou/issues/243) | `TemporalDependencyBlock` | graph |

The work follows a Design Thinking loop:

- observe the remaining DOGFOOD component families as reusable product
  semantics instead of visual one-offs
- frame each family as a named Block contract with explicit data fields and
  facts
- prototype interactive, static, pipe, and accessible shapes before treating
  the implementation as landed
- prove catalog, schema, render, story, command, preview, and lowering behavior
  in tests

## Sponsored Users

- TUI authors who need reusable semantics for branding, primitives,
  comparisons, hierarchies, exploratory lists, and dependency views.
- DOGFOOD maintainers who need the Blocks preview page to show the remaining
  component-family families as real examples, not future-audit placeholders.
- Tooling authors who inspect selected ids, semantic values, and family facts
  without scraping terminal layout.
- Future declarative IR authors who need stable typed targets for YAML or JSON
  declarations.

## Hills

1. A builder can import all six Blocks and inspect metadata, data requirements,
   command intents, schema descriptions, and ready story ids from the public
   barrel.
2. A reader can move between visual, static, pipe, and accessible modes and
   recover brand, primitive, comparison, hierarchy, list, and dependency
   meaning without ANSI, borders, color, or animation.
3. A maintainer can run one DF-054 cycle test that proves the six-pack is
   catalogued, schema-bound, rendered, documented, and lowering-stable.

## Playback Questions

- Does each late-family audit now have a named Block contract instead of a
  broad review note?
- Are required fields concrete enough for DOGFOOD previews and small enough
  for reuse?
- Do lower modes expose stable facts for block identity, family, variant, mode,
  selected value, and semantic values?
- Does the DOGFOOD Blocks page have sample slots for every new definition?
- Does this keep future YAML/JSON IR as an adapter over typed Block APIs?

## Block Contracts

| Block | Required data | Optional data | Scale |
| :--- | :--- | :--- | :--- |
| `BrandEmphasisBlock` | `brand`, `tagline`, `decoration` | `role`, `selected` | section |
| `ModeAwarePrimitiveBlock` | `primitive`, `fact`, `value` | `status`, `modeContract`, `selected` | section |
| `DenseComparisonBlock` | `title`, `metric`, `left`, `right`, `delta` | `selected` | workspace |
| `HierarchyBlock` | `root`, `nodes`, `selected` | `parent`, `depth`, `expanded` | section |
| `ExplorationListBlock` | `title`, `facet`, `items`, `selected` | `preview` | workspace |
| `TemporalDependencyBlock` | `title`, `events`, `dependency` | `selected`, `dependsOn` | workspace |

Each Block gets the same first-party command contract:

```text
<blockPrefix>.select
<blockPrefix>.copyFacts
<blockPrefix>.openStory
```

## TUI Mockups

Brand emphasis:

```text
+-- BrandEmphasisBlock -----------------------------+
| Brand                                              |
|   BIJOU                                            |
| Tagline                                            |
|   Terminal-native app blocks                       |
| Decoration                                         |
|   accent rule                                      |
| Role                                               |
|   nonessential                                     |
+----------------------------------------------------+
```

Mode-aware primitive:

```text
+-- ModeAwarePrimitiveBlock ------------------------+
| Primitive                                          |
|   metric badge                                     |
| Fact                                               |
|   latency-ms                                       |
| Value                                              |
|   42                                               |
| Status                                             |
|   good                                             |
| Mode contract                                      |
|   visual and pipe                                  |
+----------------------------------------------------+
```

Dense comparison:

```text
+-- DenseComparisonBlock ---------------------------+
| Title                                              |
|   Compare packages                                 |
| Metric                                             |
|   tests                                            |
| Left                                               |
|   1820                                             |
| Right                                              |
|   640                                              |
| Delta                                              |
|   +12                                              |
+----------------------------------------------------+
```

Hierarchy:

```text
+-- HierarchyBlock ---------------------------------+
| Root                                               |
|   docs/                                            |
| Nodes                                              |
|   design/; DX-031.md; METHOD.md                    |
| Selected                                           |
|   design/                                          |
| Parent                                             |
|   docs/                                            |
| Depth                                              |
|   1                                                |
+----------------------------------------------------+
```

Exploration list:

```text
+-- ExplorationListBlock ---------------------------+
| Title                                              |
|   Explore components                               |
| Facet                                              |
|   input                                            |
| Items                                              |
|   TextEntry field input; SingleChoice radio/select |
| Selected                                           |
|   TextEntry                                        |
| Preview                                            |
|   field input                                      |
+----------------------------------------------------+
```

Temporal dependency:

```text
+-- TemporalDependencyBlock ------------------------+
| Title                                              |
|   Timeline                                         |
| Events                                             |
|   09:00 build; 09:05 test; 09:10 publish           |
| Dependency                                         |
|   publish waits for test                           |
| Selected                                           |
|   publish                                          |
| Depends on                                         |
|   test                                             |
+----------------------------------------------------+
```

## Lower Modes

Static mode keeps the same surface structure as interactive mode and stays
render-only.

Pipe mode lowers every Block to a compact record:

```text
BrandEmphasisBlock
brand: BIJOU
tagline: Terminal-native app blocks
decoration: accent rule
role: nonessential
selected: BIJOU
```

```text
TemporalDependencyBlock
title: Timeline
events: 09:00 build; 09:05 test; 09:10 publish
dependency: publish waits for test
selected: publish
dependsOn: test
```

Accessible mode lowers every Block to label-first prose:

```text
BrandEmphasisBlock
Brand: BIJOU
Tagline: Terminal-native app blocks
Decoration: accent rule
Role: nonessential
Selected: BIJOU
```

```text
TemporalDependencyBlock
Title: Timeline
Events: 09:00 build; 09:05 test; 09:10 publish
Dependency: publish waits for test
Selected: publish
Depends on: test
```

Every lower mode carries inspectable facts:

```text
block = BrandEmphasisBlock
block.rendered = true
block.family = branding
block.variant = ready
block.mode = pipe
block.selected = BIJOU
semanticValue.brand = BIJOU
```

```text
block = TemporalDependencyBlock
block.rendered = true
block.family = graph
block.variant = ready
block.mode = accessible
block.selected = publish
semanticValue.title = Timeline
```

## Accessibility And Directionality

The first slice does not add bespoke focus behavior. The Blocks expose labels,
selected values, and section values so accessible output preserves meaning
when visual emphasis, indentation, dense columns, list focus, and graph arrows
are removed. Text is stored as plain strings or string arrays, leaving locale,
bidirectional rendering, and translation concerns to callers and localization
adapters.

## Agent Inspectability

Agents and tests should inspect metadata, data contracts, schema descriptions,
command intent ids, ready story ids, and lowering facts. They should not infer
hierarchy depth from indentation, compare values from column positions, or
dependency meaning from arrows.

## Declarative IR Note

The Bijou IR idea remains an adapter layer over this typed API. This cycle does
not introduce a new YAML or JSON runtime, but it gives future IR work concrete
targets:

```yaml
block: TemporalDependencyBlock
package: "@flyingrobots/bijou"
story: temporal-dependency.ready
data:
  title: Timeline
  events:
    - 09:00 build
    - 09:05 test
    - 09:10 publish
  dependency: publish waits for test
  selected: publish
  dependsOn: test
commands:
  - temporalDependency.select
  - temporalDependency.copyFacts
  - temporalDependency.openStory
facts:
  block.family: graph
  block.variant: ready
  block.selected: publish
  semanticValue.title: Timeline
```

## Tests

- `tests/cycles/DF-054/dogfood-late-family-six-pack.test.ts` proves all six
  Blocks publish through the standard catalog and package manifest.
- The cycle test validates metadata, command intent shape, schema binding,
  accessor rejection, visual rendering, lower-mode rendering, semantic facts,
  and Method documentation.
- DX-031 catalog tests prove the public barrel, first-party manifest, story
  ids, and rendered lowering checks include the expanded standard block set.
- DOGFOOD Blocks page tests prove the preview navigation and per-block preview
  output derive from `standardBlocks`.

## Closeout

The six-pack is landed when:

- `@flyingrobots/bijou` exports all six Block definitions, schema adapters, and
  schema-bound block definitions
- DOGFOOD Blocks preview has concrete sample slots for all six names
- `standardBlocks`, `standardBlockStories`, and
  `standardBlockPackageManifest` include the six names
- CHANGELOG, BEARING, and ROADMAP record the v7 late-family slice
- PR text closes #238, #239, #240, #241, #242, and #243
