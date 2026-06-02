# DF-030 Dogfood Docs Surface Block

Linked legend: [DF - DOGFOOD Field Guide](../legends/DF-dogfood-field-guide.md)

Status: landed for `v7.0.0`
Issue: [#244](https://github.com/flyingrobots/bijou/issues/244)
PR: [#258](https://github.com/flyingrobots/bijou/pull/258)

## Framing

DOGFOOD is already the human-facing documentation app and proving ground, but
its docs experience was still described as several nearby surfaces: navigation,
article reader, search, proof panels, and footer/status evidence. DF-030 makes
that product truth explicit as one inspectable Block contract.

This cycle lands `DogfoodDocsSurfaceBlock` as the canonical DOGFOOD docs
workspace Block. It does not replace the existing leaf Blocks. Instead, it
anchors them under one docs-surface identity so humans and agents can inspect
the full documentation experience without reconstructing it from scattered
rendering code.

## Sponsored Perspectives

Sponsored Human:

- A maintainer wants DOGFOOD to be the first-class documentation experience,
  not a secondary demo app.
- A reader wants navigation, article content, search, and proof artifacts to
  feel like one documentation surface.

Sponsored Agent:

- An agent auditing docs truth needs one Block tree and stable lowering facts
  for the selected route, heading, search hit count, and proof artifacts.
- An agent should not need provider handles, global app state, or rendered cell
  parsing to know what DOGFOOD is showing.

## Hill

A maintainer can open DOGFOOD and treat the docs app as the canonical Bijou
documentation surface, with route, reader, search, and proof evidence exposed as
typed Block metadata, schema-bound input, command intents, registry inventory,
and stable lower-mode facts.

## Playback Questions

- Can DOGFOOD name its full docs workspace as one Block?
- Can unknown docs-surface input be validated before rendering?
- Do route, heading, search-hit-count, and proof-artifact facts survive every
  output mode as stable identities?
- Does the DOGFOOD Blocks inventory show this surface as product truth?
- Can lower modes explain the docs surface without borders, color, or terminal
  layout?

## Linked Invariants

- [Tests Are the Spec](../invariants/tests-are-the-spec.md)
- [Docs Are the Demo](../invariants/docs-are-the-demo.md)
- [Visible Controls Are a Promise](../invariants/visible-controls-are-a-promise.md)

## Tests To Write First

- RED: a DF-030 cycle test imports `dogfoodDocsSurfaceBlock`,
  `dogfoodDocsSurfaceSchemaBlock`, and `dogfoodDocsSurfaceBlockRegistryEntry`
  before those exports exist.
- RED: the test asserts metadata, data requirement names, command intent ids,
  and schema-bound input validation for the docs-surface contract.
- RED: the test rejects accessor-backed boundary input before getters can run.
- RED: the test renders interactive, static, pipe, and accessible modes and
  checks that route, heading, search-hit-count, and proof-artifact facts remain
  stable.
- RED: the test opens the DOGFOOD Blocks inventory and expects the new
  `docs.surface` registry entry to appear with a localized description.

## Block Contract

| Field | Value |
| :--- | :--- |
| Block name | `DogfoodDocsSurfaceBlock` |
| Package | `@flyingrobots/bijou-dogfood` |
| Family | `docs-surface` |
| Scale | `workspace` |
| Modes | `interactive`, `static`, `pipe`, `accessible` |
| Registry surface | `docs.surface` |
| Registry role | `app-shell` |

Data requirements:

- `docsTree`
- `selectedRoute`
- `searchState`
- `proofArtifacts`

Command intents:

- `docs.navigate`
- `docs.search`
- `docs.openProof`
- `docs.copyLink`

Stable facts:

- `route`
- `heading-id`
- `search-hit-count`
- `proof-artifact` as the artifact id, not the display label

## TUI Mockup

```text
+-- DOGFOOD Docs Surface ------------------------------------------+
| navigation             | reader                                  |
| > Blocks               | # Blocks                                |
|   Guides               | Blocks are reusable contracts...       |
|   Packages             |                                         |
|------------------------+-----------------------------------------|
| search: table (2 hits) | proof: table-demo.gif available        |
+------------------------------------------------------------------+
```

## Lower Modes

Pipe mode:

```text
route	heading	search-hit-count	proofs
blocks	blocks	2	table-demo.gif
```

Accessible mode:

```text
DOGFOOD docs surface. Blocks page selected. Reader heading blocks.
Search query table has 2 hits. Proof artifacts: table-demo.gif.
```

The lower-mode invariant is semantic parity. The route, heading, hit count, and
proof artifact facts are inspected from `BlockRenderResult.facts`, not parsed
from terminal layout.

## Accessibility And Assistive Posture

`DogfoodDocsSurfaceBlock` must preserve docs meaning without relying on
position, borders, color, or animation. Accessible mode lowers the selected
route, reader heading, search summary, and proof artifact list into readable
sentences, while facts preserve the same semantic payload for assistive and
agent consumers.

## Localization And Directionality Posture

The registry description for `docs.surface` is catalog-backed through the
DOGFOOD string table. This slice adds the English source row and generated
runtime catalog entries while leaving non-English locales explicitly missing
rather than hiding untranslated copy behind silent selected-locale fallback.
The Block contract itself carries ids, routes, counts, and artifact labels as
data so future locale and directionality adapters can format presentation
without changing the semantic facts.

## Agent Inspectability And Explainability Posture

Agents should inspect this surface through typed Block metadata, view data
requirements, command intents, schema-bound input, registry ownership, and
mode-lowering facts. The registry intentionally remains render-free and avoids
provider handles, subscriptions, mutable dispatch callbacks, or global Block
lookup.

## Implementation

The implementation lives in `examples/docs/dogfood-blocks.ts`.

What landed:

- `DogfoodDocsSurfaceBlock` metadata, data requirements, commands, render
  output, and stable facts.
- `dogfoodDocsSurfaceSchemaAdapter` and `dogfoodDocsSurfaceSchemaBlock`.
- `docs.surface` registry entry with role `app-shell`.
- `workspace` as a valid block scale.
- DOGFOOD Blocks inventory evidence and a code-backed rendered preview for the
  new surface.

The block composes the existing DOGFOOD docs leaf Blocks by contract:

- `NavigationListBlock`
- `DocumentationArticleBlock`
- `SearchPanelBlock`
- `GuideInspectorBlock`

It does not add provider handles, global dispatch, subscriptions, or runtime
tree traversal to the registry.

## Tests

RED:

- `tests/cycles/DF-030/dogfood-docs-surface-block.test.ts` failed because
  `DogfoodDocsSurfaceBlock`, its schema-bound wrapper, and registry entry did
  not exist.

GREEN:

- The DF-030 test validates metadata, schema binding, accessor rejection,
  render lowerings, stable facts, registry coverage, DOGFOOD inventory output,
  the code-backed rendered docs-surface preview, and proof artifact id facts
  when display labels differ.
- `tests/cycles/DF-069/dogfood-block-registry.test.ts` now includes
  `docs.surface` in registry coverage.
- `tests/cycles/DF-071/dogfood-block-authored-surfaces.test.ts` continues to
  prove the runtime DOGFOOD inventory renders registered surface Blocks.

## Future Declaration Shape

The YAML shape remains an authoring adapter over the typed Block contract:

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
data:
  docsTree:
    - Guides
    - Blocks
    - Packages
  selectedRoute: blocks
  selectedHeadingId: blocks
  searchState:
    query: table
    hitCount: 2
  proofArtifacts:
    - id: table-demo.gif
      label: table-demo.gif
      available: true
commands:
  - docs.navigate
  - docs.search
  - docs.openProof
  - docs.copyLink
facts:
  route: blocks
  heading-id: blocks
  search-hit-count: 2
  proof-artifact: table-demo.gif
```

## Closeout

DF-030 moves DOGFOOD one step closer to being the canonical docs surface rather
than a collection of adjacent examples. The useful boundary is the typed Block:
metadata, schema-bound input, command intents, registry evidence, and
lower-mode facts. The runtime app remains free to render through its existing
TUI machinery, but the product truth is inspectable as a Block.
