---
title: DF-030 Make DOGFOOD the canonical docs surface
legend: DF
lane: up-next
priority: high
keywords:
  - dogfood
  - docs
  - packages
  - design-system
  - doctrine
  - release
  - recursive-ingest
  - honesty
---

# DF-030 Make DOGFOOD the canonical docs surface

## Block Candidate

This issue has been reshaped as a Bijou Block candidate for maintainer
approval. The implementation should use the current typed Blocks API first:
`defineBlock()`, schema-bound Blocks, `defineViewData()`, command intents,
`blockRenderNode()`, and `renderBlockTree()`. The YAML sketch below is a future
declaration shape, not a new runtime requirement for the first slice.

Source lineage: DF-030 make DOGFOOD the canonical docs surface.

## Hill

A maintainer can use DOGFOOD as the canonical human docs surface, with
navigation, content, search, and proof artifacts authored as Blocks rather than
duplicated prose paths.

## Sponsored Perspectives

- Sponsored Human: Readers who want the terminal docs app to be the first-class
  documentation experience.
- Sponsored Agent: Agents auditing docs truth through one structured Block tree
  with search, navigation, and lowerings.

## Block Contract

- Block name: `DogfoodDocsSurfaceBlock`
- Family: `docs-surface`
- Scale: `workspace`
- Canonical modes: `interactive`, `static`, `pipe`, `accessible`

Inputs:

- `docsTree`
- `selectedRoute`
- `searchState`
- `proofArtifacts`

Slots:

- `navigation`
- `reader`
- `search?`
- `proofPanel?`

Bindings and data requirements:

- docs route snapshot
- search result snapshot
- capture artifact inventory

Command intents:

- `docs.navigate`
- `docs.search`
- `docs.openProof`
- `docs.copyLink`

Semantic facts that must survive lowering:

- `route`
- `heading-id`
- `search-hit-count`
- `proof-artifact`

## TUI Mockup

```text
+-- DOGFOOD Docs Surface -------------------------------+
| Nav                 | Reader                            |
|> Blocks             | # Blocks                          |
|  Architecture       | Blocks are reusable contracts...  |
|  Method             |                                   |
| Search: table       | Proof: table-demo.gif available   |
+-------------------------------------------------------+
```

## Lower Mode Sketches

Static mode:

```text
DOGFOOD docs surface route Blocks. Search query table. Proof artifact table-demo.gif available.
```

Pipe mode:

```text
route	heading	proofs
blocks	Blocks	table-demo.gif
```

Accessible mode:

```text
DOGFOOD docs surface. Blocks page selected. Reader content available. One proof artifact listed.
```

## Future YAML Declaration Sketch

```yaml
block:
  name: DogfoodDocsSurfaceBlock
  family: docs-surface
  scale: workspace
  modes:
    - interactive
    - static
    - pipe
    - accessible
  inputs:
    - docsTree
    - selectedRoute
    - searchState
    - proofArtifacts
  slots:
    - navigation
    - reader
    - search?
    - proofPanel?
  dataRequirements:
    - docs route snapshot
    - search result snapshot
    - capture artifact inventory
  commandIntents:
    - docs.navigate
    - docs.search
    - docs.openProof
    - docs.copyLink
  semanticFacts:
    - route
    - heading-id
    - search-hit-count
    - proof-artifact
```

## Acceptance Criteria

- The design doc names this as a Block candidate and uses Design Thinking
  framing: hill, sponsored human, sponsored agent, playback
  questions, and evidence.
- The block metadata is declared with `defineBlock()` or an explicitly
  justified narrower helper.
- Unknown boundary input is validated through a schema-bound Block or an
  equivalent typed parser before rendering.
- The block exposes data requirements and command intents as inspectable
  metadata, not hidden callbacks or global provider handles.
- DOGFOOD includes at least one story or preview that renders the TUI shape
  above or a reviewed equivalent.
- Tests prove interactive/static rendering and pipe/accessible lowerings
  preserve the semantic facts listed above.
- If a YAML or JSON declaration path is added, it is treated as a compiler/input
  adapter over the typed Block contract, not as a replacement for the typed API.
- Closeout links the PR, tests, playback evidence, docs update, and any retro
  notes.

## Verification Notes

Expected proof for implementation:

- Focused unit tests for block metadata, schema binding, and lower-mode facts.
- DOGFOOD or Storybook preview evidence for the visual mode.
- Pipe and accessible snapshots that are useful without ANSI, borders, color,
  or animation.
- Changelog and Method/design updates if this becomes release-scoped work.
