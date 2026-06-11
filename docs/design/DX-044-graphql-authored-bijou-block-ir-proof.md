---
title: DX-044 GraphQL Authored Bijou Block IR Proof
legend: DX
lane: cool-ideas
priority: medium
github_issue: 302
status: active
keywords:
  - developer-experience
  - graphql
  - blocks
  - ir
  - geordi
  - dogfood
  - render-everywhere
---

# DX-044 GraphQL Authored Bijou Block IR Proof

Legend: [DX - Developer Experience](../legends/DX-developer-experience.md)

## Linked Work

- GitHub issue: [#302](https://github.com/flyingrobots/bijou/issues/302)
- Runtime seed: [DX-042 Shared UI Scene IR And Bijou Render Target](./DX-042-shared-ui-scene-ir-and-bijou-render-target.md)
- Portable endpoint direction: [DX-043 Portable Bijou Blocks And Multi-Endpoint IR](./DX-043-portable-bijou-blocks-and-multi-endpoint-ir.md)
- Prior block contract: [DX-031 Standard Bijou Blocks](./DX-031-standard-bijou-blocks.md)

This cycle is the first implementation proof after the `ui-scene-ir/1`
runtime seed. It should not try to make every Bijou block GraphQL-authored.
It should prove one boring, deterministic vertical slice that future Wesley and
Geordi work can replace or extend without changing the proof contract.

## Decision Summary

Bijou should treat GraphQL SDL as an authoring surface for portable block
semantics, not as a runtime data store and not as a visual scene graph.

The first flow is:

```text
GraphQL SDL fixture
  -> bijou-block/1 artifact
    -> ui-scene-ir/1
      -> Bijou terminal Surface proof
        -> ui-scene-receipt/1
```

The first slice stays inside Bijou. Geordi remains a named endpoint target, but
this cycle does not require Geordi repository changes unless the Bijou proof
needs a companion endpoint fixture.

## Sponsored Human

A Bijou author wants to define a small UI block in a declarative source format
and get a deterministic block artifact, scene IR, terminal output, source map,
and receipt without hand-maintaining parallel JSON fixtures.

## Sponsored Agent

An agent wants to inspect the GraphQL source, generated block artifact,
`ui-scene-ir/1`, terminal cell source map, and receipt hashes to understand
exactly which source field produced each visible terminal fact.

## Hill

Given a constrained GraphQL SDL file for one text-first Bijou block, Bijou can
produce a stable `bijou-block/1` artifact, lower it into `ui-scene-ir/1`, render
it to a terminal `Surface`, and emit a receipt whose source maps, tokens, i18n
keys, actions, bindings, and hashes are deterministic.

## Scope

- A constrained SDL reader for one block type.
- Directive-like metadata for block identity, target profile, slots, commands,
  bindings, theme tokens, localization keys, and source positions.
- A public `bijou-block/1` artifact type.
- A compiler function from SDL source to block artifact.
- A lowering function from block artifact to `ui-scene-ir/1`.
- Tests proving whitespace-stable source hashing, artifact stability, IR
  validation, terminal lowering, source maps, and receipts.

## Non-Goals

- No full GraphQL parser dependency in the first slice.
- No Wesley code generation in the first slice.
- No Geordi endpoint implementation in the first slice.
- No arbitrary GraphQL schema execution.
- No nested field resolver runtime.
- No visual layout engine beyond explicit first-slice layout facts.
- No DOGFOOD-wide migration.

## First SDL Shape

The first SDL subset is intentionally explicit:

```graphql
type ReleaseTitle
  @bijouBlock(id: "release.title", component: "ReleaseTitleBlock")
  @bijouTarget(kind: "bijou-terminal", cols: 40, rows: 5) {
  heading: String!
    @bijouText(id: "heading", x: 2, y: 1)
    @bijouI18n(key: "release.title.heading", fallback: "Bijou")
    @bijouToken(fg: "semantic.title.fg")

  openNotes: String
    @bijouAction(id: "release.openNotes", command: "release.openNotes", key: "Enter")
    @bijouText(id: "open-notes", x: 2, y: 3)
    @bijouI18n(key: "release.title.openNotes", fallback: "Open release notes")
    @bijouToken(fg: "semantic.action.fg", bg: "semantic.action.bg")
}
```

The subset allows only:

- one `type`
- type directives on the same type declaration
- scalar fields
- field directives on following indented lines
- string and integer directive arguments

That is small enough to parse deterministically without pretending to be a
general GraphQL compiler.

## Artifact Contract

The first generated artifact is:

```text
bijou-block/1
  id
  component
  sourceHash
  fields[]
    fieldName
    nodeId
    text
    action
    binding
    token refs
    source
  targetProfiles[]
```

`bijou-block/1` is semantic. It is not the same thing as Geordi IR and it is
not the same thing as a final `Surface`.

## Lowering Contract

`bijou-block/1 -> ui-scene-ir/1` must preserve:

- source hash
- node ids
- component ids
- i18n keys and fallbacks
- token references
- action ids, commands, keybindings, and targets
- binding facts when present
- source-map facts from SDL lines to IR nodes
- target profile facts

If the source asks for unsupported target facts, the compiler must fail before
lowering.

## Source Map Posture

Source strings should be stable and local to the input:

```text
release-title.graphql:7:3
```

Absolute paths are not allowed in emitted artifacts. The caller may provide a
`sourceName` option, but the default should be a neutral `inline.graphql`.

## Agent Inspectability

The useful debug path should be:

```text
SDL field -> bijou-block/1 field -> ui-scene-ir/1 node -> Surface cell -> receipt
```

An agent should not need a screenshot to answer:

- Which SDL field produced this node?
- Which node produced this terminal cell?
- Which i18n key and token refs were used?
- Which action or binding belongs to the rendered text?
- Which hash proves the scene and terminal output?

## Accessibility And Localization Posture

This first slice preserves localization keys and fallbacks but does not add new
runtime translation behavior. The source author must provide fallback text for
renderable text nodes. Directionality is deferred until multiline text and
localized layout constraints exist in the IR.

## Geordi Posture

Geordi is the likely next endpoint after this Bijou-only proof. The first
Geordi-facing shape should be a receipt-compatible endpoint facet, not a
semantic replacement for `bijou-block/1`.

Expected later flow:

```text
bijou-block/1
  -> ui-scene-ir/1
    -> Geordi endpoint profile
      -> browser/image/packed-cell witness
```

## Implementation Outline

1. Add this design doc and issue update.
2. Add `bijou-block/1` artifact types.
3. Add a deterministic constrained SDL compiler.
4. Add block-artifact to `ui-scene-ir/1` lowering.
5. Add public exports.
6. Add a focused fixture test that renders one GraphQL-authored block into a
   terminal proof.
7. Update changelog and issue/PR proof.

## Tests To Write First

- RED: a whitespace-variant SDL input should produce the same block hash and
  scene hash.
- RED: missing `@bijouBlock` should fail with a deterministic error.
- RED: a text field with i18n/token/action directives should become one IR
  text node with matching source-map facts.
- GREEN: terminal proof should render fallback text and include SHA-256 scene,
  layout, and surface hashes.

## Closeout

The cycle is landed when:

- the design doc exists and links #302
- #302 has a cycle comment pointing at the branch and PR
- `@flyingrobots/bijou` exports the first block authoring APIs
- the focused GraphQL-authored block proof is green
- `npm run lint`, `npm run typecheck:test`, `npm run docs:inventory`, and the
  relevant focused tests are green
- the PR names #302 and explains what remains for Wesley and Geordi
